import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift } from '../orders/schemas/shift.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentMethod,
} from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<Shift>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ============================================================
  // Mở ca làm
  // ============================================================
  async openShift(userId: string, openingCash: number) {
    // Kiểm tra không có ca đang mở
    const existingShift = await this.shiftModel.findOne({
      cashierId: new Types.ObjectId(userId),
      isClosed: false,
    });

    if (existingShift) {
      throw new BadRequestException(
        'Bạn đang có ca làm chưa đóng. Vui lòng đóng ca trước khi mở ca mới.',
      );
    }

    // Lấy tên nhân viên từ DB
    const user = await this.userModel
      .findById(userId)
      .select('fullName')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    const shift = await this.shiftModel.create({
      cashierId: new Types.ObjectId(userId),
      cashierName: (user as any).fullName || 'Nhân viên',
      openedAt: new Date(),
      openingCash,
      isClosed: false,
    });

    return {
      success: true,
      message: 'Mở ca thành công',
      data: shift,
    };
  }

  // ============================================================
  // Đóng ca làm
  // ============================================================
  async closeShift(
    shiftId: string,
    userId: string,
    closingCash: number,
    note?: string,
  ) {
    const shift = await this.shiftModel.findById(shiftId);

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm');
    }

    if (shift.cashierId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền đóng ca làm này');
    }

    if (shift.isClosed) {
      throw new BadRequestException('Ca làm đã được đóng trước đó');
    }

    // Tính toán tổng từ đơn hàng POS trong ca
    const now = new Date();
    const posOrders = await this.orderModel.aggregate([
      {
        $match: {
          isPosOrder: true,
          createdBy: new Types.ObjectId(userId),
          createdAt: { $gte: shift.openedAt, $lte: now },
          status: { $ne: OrderStatus.CANCELLED },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          totalCashSales: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMethod', PaymentMethod.CASH] },
                '$total',
                0,
              ],
            },
          },
          totalBankSales: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMethod', PaymentMethod.BANK_TRANSFER] },
                '$total',
                0,
              ],
            },
          },
          totalDiscounts: { $sum: '$discountAmount' },
          orderIds: { $push: '$_id' },
        },
      },
    ]);

    const summary = posOrders[0] || {
      totalSales: 0,
      totalOrders: 0,
      totalCashSales: 0,
      totalBankSales: 0,
      totalDiscounts: 0,
      orderIds: [],
    };

    const updatedShift = await this.shiftModel.findByIdAndUpdate(
      shiftId,
      {
        closingCash,
        closedAt: now,
        isClosed: true,
        totalSales: summary.totalSales,
        totalOrders: summary.totalOrders,
        totalCashSales: summary.totalCashSales,
        totalBankSales: summary.totalBankSales,
        totalDiscounts: summary.totalDiscounts,
        orderIds: summary.orderIds,
        note: note || undefined,
      },
      { new: true },
    );

    return {
      success: true,
      message: 'Đóng ca thành công',
      data: updatedShift,
    };
  }

  // ============================================================
  // Lấy ca làm hiện tại
  // ============================================================
  async getCurrentShift(userId: string) {
    const shift = await this.shiftModel.findOne({
      cashierId: new Types.ObjectId(userId),
      isClosed: false,
    });

    return {
      success: true,
      data: shift || null,
    };
  }

  // ============================================================
  // Lấy danh sách ca làm của tôi
  // ============================================================
  async getMyShifts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.shiftModel
        .find({ cashierId: new Types.ObjectId(userId) })
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.shiftModel.countDocuments({
        cashierId: new Types.ObjectId(userId),
      }),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // Admin: Lấy tất cả ca làm
  // ============================================================
  async getAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.shiftModel
        .find()
        .sort({ openedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.shiftModel.countDocuments(),
    ]);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // Lấy chi tiết ca làm theo ID
  // ============================================================
  async getById(id: string) {
    const shift = await this.shiftModel
      .findById(id)
      .populate('orderIds')
      .lean()
      .exec();

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm');
    }

    return {
      success: true,
      data: shift,
    };
  }
}
