import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './schemas/order.schema';
import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema';
import {
  User,
  UserDocument,
  UserRole,
} from '../users/schemas/user.schema';
import { CouponsService } from '../coupons/coupons.service';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { calculateShippingFee } from './constants/shipping-fees.constant';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
    private readonly couponsService: CouponsService,
    private readonly socketGateway: SocketGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ================================================================
  // TAO DON HANG (CUSTOMER - TU WEBSITE)
  // ================================================================
  async create(
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Lay thong tin customer
      const customer = await this.userModel
        .findById(customerId)
        .session(session);

      if (!customer) {
        throw new NotFoundException('Khong tim thay khach hang');
      }

      // 2. Validate va tinh gia tung item
      const orderItems: any[] = [];
      let subtotal = 0;

      for (const item of dto.items) {
        const product = await this.productModel
          .findById(item.productId)
          .session(session);

        if (!product) {
          throw new BadRequestException(
            `San pham ${item.productId} khong ton tai`,
          );
        }

        if (product.status !== 'active') {
          throw new BadRequestException(
            `San pham "${product.name}" hien khong kha dung`,
          );
        }

        let unitPrice: number = product.basePrice;
        let variantInfo: any = { colorName: null, dimensionLabel: null };
        let productImage: string | null = (product.images as any)?.[0] || null;

        if (item.variantSku) {
          const variant = product.variants?.find(
            (v) => v.sku === item.variantSku.toUpperCase(),
          );

          if (!variant) {
            throw new BadRequestException(
              `Bien the ${item.variantSku} khong ton tai cho san pham "${product.name}"`,
            );
          }

          if (!variant.available) {
            throw new BadRequestException(
              `Bien the ${item.variantSku} hien khong kha dung`,
            );
          }

          if (variant.stock < item.quantity) {
            throw new BadRequestException(
              `San pham "${product.name}" (${item.variantSku}) chi con ${variant.stock} san pham`,
            );
          }

          // Reserve stock (tru ton kho trong transaction)
          await this.productModel.updateOne(
            {
              _id: product._id,
              'variants.sku': item.variantSku.toUpperCase(),
            },
            { $inc: { 'variants.$.stock': -item.quantity } },
            { session },
          );

          unitPrice = variant.price;
          productImage = variant.image || productImage;

          const color = product.colors?.find(
            (c: any) => c.id === variant.colorId,
          );
          const dimension = product.dimensions?.find(
            (d: any) => d.id === variant.dimensionId,
          );
          variantInfo = {
            colorName: (color as any)?.name || null,
            dimensionLabel: (dimension as any)?.label || null,
          };
        } else {
          // San pham khong co bien the - kiem tra ton kho tong
          const totalStock =
            product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

          if (totalStock < item.quantity && product.variants?.length > 0) {
            throw new BadRequestException(
              `San pham "${product.name}" khong du ton kho`,
            );
          }
        }

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          productId: product._id,
          productName: product.name,
          productImage,
          variantSku: item.variantSku?.toUpperCase() || null,
          variantInfo,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      // 3. Tinh phi van chuyen
      const shippingFee = calculateShippingFee(dto.shippingAddress.province);

      // 4. Ap dung coupon (neu co)
      let discountAmount = 0;
      let discountReason: string | null = null;
      let couponId: string | null = null;

      if (dto.couponCode) {
        // Build items for coupon validation (use empty categoryId since we don't have it here)
        const couponItems = orderItems.map((i) => ({
          productId: i.productId.toString(),
          categoryId: '', // Will match ALL scope only
          price: i.unitPrice,
          quantity: i.quantity,
        }));

        const couponResult = await this.couponsService.validateAndApply(
          dto.couponCode,
          customerId,
          couponItems,
          subtotal,
        );

        if (!couponResult.isValid) {
          throw new BadRequestException(
            `Ma giam gia khong hop le: ${couponResult.message}`,
          );
        }

        discountAmount = couponResult.discountAmount;
        discountReason = `Ma giam gia: ${dto.couponCode.toUpperCase()}`;
        couponId = couponResult.couponId || null;
      }

      // 5. Tinh tong cong
      const total = subtotal - discountAmount + shippingFee;

      // 6. Sinh ma don hang
      const orderNumber = await this.generateOrderNumber(session);

      // 7. Tao don hang
      const [order] = await this.orderModel.create(
        [
          {
            orderNumber,
            customerId: new Types.ObjectId(customerId),
            customerName: dto.shippingAddress.fullName,
            customerPhone: dto.shippingAddress.phone,
            customerEmail: customer.email,
            items: orderItems,
            subtotal,
            discountAmount,
            discountReason,
            shippingFee,
            total,
            status: OrderStatus.PENDING,
            paymentMethod: dto.paymentMethod,
            paymentStatus: PaymentStatus.UNPAID,
            shippingFullName: dto.shippingAddress.fullName,
            shippingPhone: dto.shippingAddress.phone,
            shippingStreet: dto.shippingAddress.street,
            shippingWard: dto.shippingAddress.ward,
            shippingDistrict: dto.shippingAddress.district,
            shippingProvince: dto.shippingAddress.province,
            shippingNote: dto.note || null,
            couponCode: dto.couponCode?.toUpperCase() || null,
            isPosOrder: false,
            statusHistory: [
              {
                status: OrderStatus.PENDING,
                changedBy: new Types.ObjectId(customerId),
                changedAt: new Date(),
                note: 'Don hang moi tao',
              },
            ],
          },
        ],
        { session },
      );

      // 8. Commit transaction
      await session.commitTransaction();

      // 9. Ghi nhan su dung coupon (sau khi commit)
      if (dto.couponCode && couponId) {
        await this.couponsService.recordUsage(
          couponId,
          customerId,
          (order._id as Types.ObjectId).toString(),
          discountAmount,
        );
      }

      // 10. Thông báo + Socket
      await this.notificationsService.notifyOrderCreated(order);

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ================================================================
  // TAO DON HANG POS (STAFF - TAI QUAY)
  // ================================================================
  async createPosOrder(
    staffId: string,
    dto: CreatePosOrderDto,
  ): Promise<OrderDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const orderItems: any[] = [];
      let subtotal = 0;

      for (const item of dto.items) {
        const product = await this.productModel
          .findById(item.productId)
          .session(session);

        if (!product) {
          throw new BadRequestException(
            `San pham ${item.productId} khong ton tai`,
          );
        }

        let unitPrice: number = product.basePrice;
        let variantInfo: any = { colorName: null, dimensionLabel: null };
        let productImage: string | null = (product.images as any)?.[0] || null;

        if (item.variantSku) {
          const variant = product.variants?.find(
            (v) => v.sku === item.variantSku.toUpperCase(),
          );

          if (!variant) {
            throw new BadRequestException(
              `Bien the ${item.variantSku} khong ton tai`,
            );
          }

          if (variant.stock < item.quantity) {
            throw new BadRequestException(
              `${product.name} (${item.variantSku}) chi con ${variant.stock}`,
            );
          }

          // Reserve stock
          await this.productModel.updateOne(
            {
              _id: product._id,
              'variants.sku': item.variantSku.toUpperCase(),
            },
            { $inc: { 'variants.$.stock': -item.quantity } },
            { session },
          );

          unitPrice = variant.price;
          productImage = variant.image || productImage;

          const color = product.colors?.find(
            (c: any) => c.id === variant.colorId,
          );
          const dimension = product.dimensions?.find(
            (d: any) => d.id === variant.dimensionId,
          );
          variantInfo = {
            colorName: (color as any)?.name || null,
            dimensionLabel: (dimension as any)?.label || null,
          };
        }

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          productId: product._id,
          productName: product.name,
          productImage,
          variantSku: item.variantSku?.toUpperCase() || null,
          variantInfo,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      // Ap dung coupon
      let discountAmount = 0;
      let discountReason: string | null = null;

      if (dto.couponCode) {
        const couponItems = orderItems.map((i) => ({
          productId: i.productId.toString(),
          categoryId: '',
          price: i.unitPrice,
          quantity: i.quantity,
        }));

        const couponResult = await this.couponsService.validateAndApply(
          dto.couponCode,
          dto.customerId || null,
          couponItems,
          subtotal,
        );

        if (!couponResult.isValid) {
          throw new BadRequestException(
            `Ma giam gia loi: ${couponResult.message}`,
          );
        }

        discountAmount = couponResult.discountAmount;
        discountReason = `Ma giam gia POS: ${dto.couponCode.toUpperCase()}`;
      }

      // POS: khong co phi van chuyen
      const total = subtotal - discountAmount;

      // Tinh tien thua (voi thanh toan tien mat)
      let changeAmount: number | null = null;
      if (dto.paymentMethod === PaymentMethod.CASH && dto.cashReceived) {
        if (dto.cashReceived < total) {
          throw new BadRequestException(
            `Tien khach dua (${dto.cashReceived}) khong du. Tong: ${total}`,
          );
        }
        changeAmount = dto.cashReceived - total;
      }

      const orderNumber = await this.generateOrderNumber(session);

      const [order] = await this.orderModel.create(
        [
          {
            orderNumber,
            customerId: dto.customerId
              ? new Types.ObjectId(dto.customerId)
              : null,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            customerEmail: null,
            items: orderItems,
            subtotal,
            discountAmount,
            discountReason,
            shippingFee: 0,
            total,
            // POS: bat dau tu CONFIRMED, thanh toan ngay
            status: OrderStatus.CONFIRMED,
            paymentMethod: dto.paymentMethod,
            paymentStatus: PaymentStatus.PAID,
            // POS khong co dia chi giao hang - dung thong tin cua hang
            shippingFullName: dto.customerName,
            shippingPhone: dto.customerPhone,
            shippingStreet: 'Mua tai cua hang',
            shippingWard: '',
            shippingDistrict: '',
            shippingProvince: 'Ho Chi Minh',
            shippingNote: dto.note || null,
            couponCode: dto.couponCode?.toUpperCase() || null,
            isPosOrder: true,
            createdBy: new Types.ObjectId(staffId),
            cashReceived: dto.cashReceived || null,
            changeAmount,
            statusHistory: [
              {
                status: OrderStatus.CONFIRMED,
                changedBy: new Types.ObjectId(staffId),
                changedAt: new Date(),
                note: 'Don POS - xac nhan ngay',
              },
            ],
          },
        ],
        { session },
      );

      await session.commitTransaction();

      // Thông báo + Socket (POS)
      await this.notificationsService.notifyOrderCreated(order);

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ================================================================
  // DANH SACH DON HANG (ADMIN)
  // ================================================================
  async findAll(query: QueryOrderDto): Promise<{
    items: OrderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      paymentStatus,
      search,
      fromDate,
      toDate,
      customerId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: any = { isDeleted: false };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customerId = new Types.ObjectId(customerId);

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.orderModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as OrderDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ================================================================
  // CHI TIET DON HANG
  // ================================================================
  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(id),
        isDeleted: false,
      })
      .populate('customerId', 'fullName email phone avatar')
      .populate('shipperId', 'fullName phone')
      .lean();

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    return order as unknown as OrderDocument;
  }

  // ================================================================
  // DON HANG CUA TOI (CUSTOMER)
  // ================================================================
  async findMyOrders(
    customerId: string,
    query: QueryOrderDto,
  ): Promise<{
    items: OrderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      customerId: new Types.ObjectId(customerId),
      isDeleted: false,
    };

    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as OrderDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ================================================================
  // CAP NHAT TRANG THAI DON HANG
  // ================================================================
  async updateStatus(
    orderId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      isDeleted: false,
    });

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    const currentStatus = order.status as OrderStatus;
    const newStatus = dto.status;

    // Validate chuyen trang thai
    this.validateStatusTransition(currentStatus, newStatus, userRole, order, userId);

    // Shipper giao hang thanh cong - can anh chung minh
    if (newStatus === OrderStatus.DELIVERED && !dto.deliveryProofImage) {
      throw new BadRequestException(
        'Can anh chung minh giao hang (deliveryProofImage)',
      );
    }

    // Cap nhat
    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: new Types.ObjectId(userId),
      changedAt: new Date(),
      note: dto.note || null,
    } as any);

    // Cap nhat cac truong lien quan
    if (newStatus === OrderStatus.DELIVERED) {
      (order as any).deliveredAt = new Date();
      (order as any).deliveryProofImage = dto.deliveryProofImage;
      // COD: cap nhat thanh toan khi giao thanh cong
      if (order.paymentMethod === PaymentMethod.COD) {
        order.paymentStatus = PaymentStatus.PAID;
      }
    }

    if (newStatus === OrderStatus.CANCELLED) {
      (order as any).cancelReason = dto.note || 'Khong ro ly do';
    }

    await order.save();

    // Emit Socket.IO event
    this.socketGateway.server.emit('order:statusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: newStatus,
      customerId: order.customerId?.toString(),
    });

    // Tạo notification cho customer
    await this.notificationsService.notifyOrderStatusChanged(
      order,
      currentStatus,
      newStatus,
    );

    return order;
  }

  // Validate quy tac chuyen trang thai
  private validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
    userRole: UserRole,
    order: any,
    userId: string,
  ): void {
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.WAITING_PICKUP, OrderStatus.CANCELLED],
      [OrderStatus.WAITING_PICKUP]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowedNext = validTransitions[current] || [];
    if (!allowedNext.includes(next)) {
      throw new BadRequestException(
        `Khong the chuyen tu "${current}" sang "${next}"`,
      );
    }

    // PENDING -> CONFIRMED: chi admin
    if (
      current === OrderStatus.PENDING &&
      next === OrderStatus.CONFIRMED &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Chi admin moi duoc xac nhan don hang');
    }

    // Customer chi duoc huy don PENDING cua chinh minh
    if (next === OrderStatus.CANCELLED && userRole === UserRole.CUSTOMER) {
      if (current !== OrderStatus.PENDING) {
        throw new ForbiddenException(
          'Khach hang chi duoc huy don o trang thai PENDING',
        );
      }
      if (order.customerId?.toString() !== userId) {
        throw new ForbiddenException('Khong co quyen huy don nay');
      }
    }

    // IN_TRANSIT -> DELIVERED: chi shipper duoc gan cho don nay
    if (
      current === OrderStatus.IN_TRANSIT &&
      next === OrderStatus.DELIVERED &&
      userRole === UserRole.SHIPPER
    ) {
      if (order.shipperId?.toString() !== userId) {
        throw new ForbiddenException(
          'Chi shipper duoc gan moi cap nhat giao hang',
        );
      }
    }
  }

  // ================================================================
  // GAN SHIPPER CHO DON HANG
  // ================================================================
  async assignShipper(
    orderId: string,
    shipperId: string,
  ): Promise<OrderDocument> {
    const [order, shipper] = await Promise.all([
      this.orderModel.findOne({
        _id: new Types.ObjectId(orderId),
        isDeleted: false,
      }),
      this.userModel.findOne({
        _id: new Types.ObjectId(shipperId),
        role: UserRole.SHIPPER,
        isActive: true,
        isDeleted: false,
      }),
    ]);

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    if (!shipper) {
      throw new NotFoundException('Khong tim thay shipper');
    }

    if (
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Chi gan shipper cho don CONFIRMED hoac PREPARING',
      );
    }

    (order as any).shipperId = new Types.ObjectId(shipperId);
    (order as any).shipperName = shipper.fullName;
    (order as any).shipperPhone = shipper.phone;

    // Tự động chuyển trạng thái sang WAITING_PICKUP
    order.status = OrderStatus.WAITING_PICKUP;
    order.statusHistory.push({
      status: OrderStatus.WAITING_PICKUP,
      changedBy: new Types.ObjectId(shipperId),
      changedAt: new Date(),
      note: `Gán shipper: ${shipper.fullName}`,
    } as any);

    await order.save();

    // Emit status update
    this.socketGateway.server.emit('order:statusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: OrderStatus.WAITING_PICKUP,
      customerId: order.customerId?.toString(),
    });

    // Thông báo cho shipper + customer
    await this.notificationsService.notifyShipperAssigned(order, shipper);

    return order;
  }

  // ================================================================
  // HUY DON HANG
  // ================================================================
  async cancelOrder(
    orderId: string,
    userId: string,
    dto: CancelOrderDto,
  ): Promise<OrderDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel
        .findOne({
          _id: new Types.ObjectId(orderId),
          isDeleted: false,
        })
        .session(session);

      if (!order) {
        throw new NotFoundException('Khong tim thay don hang');
      }

      if (
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Khong the huy don da giao hoac da huy',
        );
      }

      // Hoan lai ton kho
      for (const item of order.items) {
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

      order.status = OrderStatus.CANCELLED;
      (order as any).cancelReason = dto.reason;
      order.statusHistory.push({
        status: OrderStatus.CANCELLED,
        changedBy: new Types.ObjectId(userId),
        changedAt: new Date(),
        note: `Huy don: ${dto.reason}`,
      } as any);

      await order.save({ session });
      await session.commitTransaction();

      // Emit event
      this.socketGateway.server.emit('order:statusUpdated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: OrderStatus.CANCELLED,
        customerId: order.customerId?.toString(),
      });

      // Thông báo cho customer
      await this.notificationsService.notifyOrderStatusChanged(
        order,
        'active',
        OrderStatus.CANCELLED,
      );

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ================================================================
  // XAC NHAN CHUYEN KHOAN NGAN HANG
  // ================================================================
  async confirmBankTransfer(
    orderId: string,
    adminId: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      isDeleted: false,
    });

    if (!order) {
      throw new NotFoundException('Khong tim thay don hang');
    }

    if (order.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException(
        'Don hang nay khong thanh toan bang chuyen khoan',
      );
    }

    if ((order as any).bankTransferConfirmed) {
      throw new BadRequestException('Da xac nhan chuyen khoan truoc do');
    }

    (order as any).bankTransferConfirmed = true;
    (order as any).bankTransferConfirmedBy = new Types.ObjectId(adminId);
    order.paymentStatus = PaymentStatus.PAID;

    order.statusHistory.push({
      status: order.status,
      changedBy: new Types.ObjectId(adminId),
      changedAt: new Date(),
      note: 'Xac nhan da nhan chuyen khoan ngan hang',
    } as any);

    await order.save();

    return order;
  }

  // ================================================================
  // THONG KE DON HANG
  // ================================================================
  async getOrderStats(): Promise<{
    byStatus: Record<string, number>;
    revenue: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    totalOrders: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [statusCounts, todayRevenue, weekRevenue, monthRevenue, totalOrders] =
      await Promise.all([
        this.orderModel.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.orderModel.aggregate([
          {
            $match: {
              isDeleted: false,
              status: { $nin: ['cancelled', 'returned'] },
              createdAt: { $gte: startOfDay },
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        this.orderModel.aggregate([
          {
            $match: {
              isDeleted: false,
              status: { $nin: ['cancelled', 'returned'] },
              createdAt: { $gte: startOfWeek },
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        this.orderModel.aggregate([
          {
            $match: {
              isDeleted: false,
              status: { $nin: ['cancelled', 'returned'] },
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        this.orderModel.countDocuments({ isDeleted: false }),
      ]);

    const byStatus: Record<string, number> = {};
    statusCounts.forEach((s: any) => {
      byStatus[s._id] = s.count;
    });

    return {
      byStatus,
      revenue: {
        today: todayRevenue[0]?.total || 0,
        thisWeek: weekRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
      },
      totalOrders,
    };
  }

  // ================================================================
  // DON HANG GAN DAY (ADMIN DASHBOARD)
  // ================================================================
  async getRecentOrders(limit: number = 10): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'orderNumber customerName customerPhone total status paymentMethod paymentStatus isPosOrder createdAt',
      )
      .lean() as unknown as OrderDocument[];
  }

  // ================================================================
  // SINH MA DON HANG: FV-YYYYMMDD-XXXX
  // ================================================================
  private async generateOrderNumber(session?: any): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    const prefix = `FV-${dateStr}-`;

    const lastOrder = await this.orderModel
      .findOne({ orderNumber: { $regex: `^${prefix}` } })
      .sort({ orderNumber: -1 })
      .select('orderNumber')
      .session(session || null)
      .lean();

    let sequence = 1;
    if (lastOrder) {
      const parts = (lastOrder as any).orderNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
