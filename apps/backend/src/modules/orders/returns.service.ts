import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Return, ReturnDocument, ReturnStatus } from './schemas/return.schema';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateReturnDto } from './dto/create-return.dto';
import { QueryReturnDto } from './dto/query-return.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectModel(Return.name) private returnModel: Model<ReturnDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectConnection() private connection: Connection,
    private readonly socketGateway: SocketGateway,
  ) {}

  // ===== TAO YEU CAU TRA HANG =====
  async createReturn(
    customerId: string,
    dto: CreateReturnDto,
  ): Promise<ReturnDocument> {
    // 1. Kiem tra don hang
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(dto.orderId),
      customerId: new Types.ObjectId(customerId),
      isDeleted: false,
    });

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    // 2. Chi cho phep tra hang voi don da DELIVERED
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Chi duoc tra hang voi don hang da giao thanh cong',
      );
    }

    // 3. Kiem tra thoi han tra hang (7 ngay)
    const deliveredAt =
      (order as any).deliveredAt || (order as any).updatedAt || new Date();
    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceDelivery > 7) {
      throw new BadRequestException(
        `Da qua thoi han tra hang (7 ngay). Don giao cach day ${daysSinceDelivery} ngay.`,
      );
    }

    // 4. Kiem tra san pham tra co nam trong don khong
    for (const returnItem of dto.items) {
      const orderItem = order.items.find(
        (oi) =>
          oi.productId.toString() === returnItem.productId &&
          ((oi as any).variantSku || null) === (returnItem.variantSku || null),
      );

      if (!orderItem) {
        throw new BadRequestException(
          `San pham ${returnItem.productId} (${returnItem.variantSku || 'khong co bien the'}) khong co trong don hang`,
        );
      }

      if (returnItem.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `So luong tra (${returnItem.quantity}) lon hon so luong mua (${orderItem.quantity})`,
        );
      }
    }

    // 5. Kiem tra da co yeu cau tra hang chua
    const existingReturn = await this.returnModel.findOne({
      orderId: new Types.ObjectId(dto.orderId),
      status: {
        $in: [ReturnStatus.REQUESTED, ReturnStatus.APPROVED, ReturnStatus.PROCESSING],
      },
    });

    if (existingReturn) {
      throw new BadRequestException(
        'Don hang nay da co yeu cau tra hang dang xu ly',
      );
    }

    // 6. Tinh so tien hoan
    let refundAmount = 0;
    for (const returnItem of dto.items) {
      const orderItem = order.items.find(
        (oi) =>
          oi.productId.toString() === returnItem.productId &&
          ((oi as any).variantSku || null) === (returnItem.variantSku || null),
      );
      if (orderItem) {
        refundAmount += orderItem.unitPrice * returnItem.quantity;
      }
    }

    // 7. Sinh ma tra hang
    const returnNumber = await this.generateReturnNumber();

    // 8. Tao yeu cau tra hang
    const returnRequest = new this.returnModel({
      returnNumber,
      orderId: new Types.ObjectId(dto.orderId),
      customerId: new Types.ObjectId(customerId),
      items: dto.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        variantSku: item.variantSku || null,
        quantity: item.quantity,
        reason: item.reason,
        note: item.note || null,
      })),
      status: ReturnStatus.REQUESTED,
      refundAmount,
      customerNote: dto.customerNote || null,
      images: dto.images || [],
    });

    await returnRequest.save();

    // Emit Socket.IO
    this.socketGateway.server.emit('return:created', {
      returnId: returnRequest._id,
      returnNumber: returnRequest.returnNumber,
      orderId: dto.orderId,
      refundAmount,
    });

    return returnRequest;
  }

  // ===== DANH SACH YEU CAU TRA HANG (ADMIN) =====
  async getReturns(query: QueryReturnDto): Promise<{
    items: ReturnDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      this.returnModel
        .find(filter)
        .populate('orderId', 'orderNumber customerName total')
        .populate('customerId', 'fullName phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.returnModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as ReturnDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== YEU CAU TRA HANG CUA TOI (CUSTOMER) =====
  async getMyReturns(customerId: string): Promise<ReturnDocument[]> {
    return this.returnModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('orderId', 'orderNumber total')
      .sort({ createdAt: -1 })
      .lean() as unknown as ReturnDocument[];
  }

  // ===== DUYET YEU CAU TRA HANG =====
  async approveReturn(
    returnId: string,
    adminId: string,
  ): Promise<ReturnDocument> {
    const returnRequest = await this.returnModel.findById(returnId);

    if (!returnRequest) {
      throw new NotFoundException('Khong tim thay yeu cau tra hang');
    }

    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException(
        'Chi duoc duyet yeu cau o trang thai PENDING',
      );
    }

    returnRequest.status = ReturnStatus.APPROVED;
    (returnRequest as any).processedBy = new Types.ObjectId(adminId);
    (returnRequest as any).processedAt = new Date();

    await returnRequest.save();

    // Cap nhat trang thai don hang
    await this.orderModel.findByIdAndUpdate(returnRequest.orderId, {
      status: OrderStatus.RETURNED,
      $push: {
        statusHistory: {
          status: OrderStatus.RETURNED,
          changedBy: new Types.ObjectId(adminId),
          changedAt: new Date(),
          note: `Duyet tra hang: ${returnRequest.returnNumber}`,
        },
      },
    });

    return returnRequest;
  }

  // ===== TU CHOI YEU CAU TRA HANG =====
  async rejectReturn(
    returnId: string,
    adminId: string,
    reason: string,
  ): Promise<ReturnDocument> {
    const returnRequest = await this.returnModel.findById(returnId);

    if (!returnRequest) {
      throw new NotFoundException('Khong tim thay yeu cau tra hang');
    }

    if (returnRequest.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException(
        'Chi duoc tu choi yeu cau o trang thai PENDING',
      );
    }

    returnRequest.status = ReturnStatus.REJECTED;
    (returnRequest as any).adminNote = reason;
    (returnRequest as any).processedBy = new Types.ObjectId(adminId);
    (returnRequest as any).processedAt = new Date();

    await returnRequest.save();

    return returnRequest;
  }

  // ===== XU LY HOAN TIEN =====
  async processRefund(
    returnId: string,
    adminId: string,
  ): Promise<ReturnDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const returnRequest = await this.returnModel
        .findById(returnId)
        .session(session);

      if (!returnRequest) {
        throw new NotFoundException('Khong tim thay yeu cau tra hang');
      }

      if (returnRequest.status !== ReturnStatus.APPROVED) {
        throw new BadRequestException(
          'Chi xu ly hoan tien cho yeu cau da duoc duyet',
        );
      }

      // 1. Hoan lai ton kho
      for (const item of returnRequest.items) {
        if ((item as any).variantSku) {
          await this.productModel.updateOne(
            {
              _id: item.productId,
              'variants.sku': (item as any).variantSku,
            },
            { $inc: { 'variants.$.stock': item.quantity } },
            { session },
          );
        }
      }

      // 2. Cap nhat trang thai return
      returnRequest.status = ReturnStatus.COMPLETED;
      (returnRequest as any).refundMethod = 'bank_transfer';
      await returnRequest.save({ session });

      // 3. Cap nhat trang thai don hang
      const order = await this.orderModel
        .findById(returnRequest.orderId)
        .session(session);

      if (order) {
        order.paymentStatus = PaymentStatus.REFUNDED;
        order.statusHistory.push({
          status: order.status,
          changedBy: new Types.ObjectId(adminId),
          changedAt: new Date(),
          note: `Hoan tien ${returnRequest.refundAmount.toLocaleString('vi-VN')} VND - ${returnRequest.returnNumber}`,
        } as any);
        await order.save({ session });
      }

      await session.commitTransaction();

      // Emit Socket.IO
      this.socketGateway.server.emit('return:refunded', {
        returnId: returnRequest._id,
        returnNumber: returnRequest.returnNumber,
        refundAmount: returnRequest.refundAmount,
        customerId: returnRequest.customerId.toString(),
      });

      return returnRequest;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ===== SINH MA TRA HANG: RT-YYYYMMDD-XXXX =====
  private async generateReturnNumber(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    const prefix = `RT-${dateStr}-`;

    const lastReturn = await this.returnModel
      .findOne({ returnNumber: { $regex: `^${prefix}` } })
      .sort({ returnNumber: -1 })
      .select('returnNumber')
      .lean();

    let sequence = 1;
    if (lastReturn) {
      const parts = (lastReturn as any).returnNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
