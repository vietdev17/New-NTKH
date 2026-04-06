import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentMethod,
} from '../orders/schemas/order.schema';
import {
  User,
  UserDocument,
  ShipperStatus,
} from '../users/schemas/user.schema';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { DeliverOrderDto } from './dto/deliver-order.dto';
import {
  QueryShipperOrdersDto,
  ShipperOrderFilter,
} from './dto/query-shipper-orders.dto';
import { QueryEarningsDto, EarningsPeriod } from './dto/query-earnings.dto';

@Injectable()
export class ShipperService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ===== DON HANG CHO NHAN (WAITING_PICKUP duoc gan cho shipper nay) =====
  async getAvailableOrders(shipperId: string) {
    const orders = await this.orderModel
      .find({
        status: OrderStatus.WAITING_PICKUP,
        shipperId: new Types.ObjectId(shipperId),
        isDeleted: false,
      })
      .select(
        'orderNumber shippingStreet shippingDistrict shippingProvince total paymentMethod paymentStatus items createdAt',
      )
      .populate('items.productId', 'name images')
      .sort({ createdAt: 1 }) // Don cu nhat truoc
      .limit(50)
      .lean();

    return orders;
  }

  // ===== DON HANG CUA SHIPPER (ACTIVE + LICH SU) =====
  async getMyOrders(shipperId: string, query: QueryShipperOrdersDto) {
    const { page = 1, limit = 20, filter } = query;
    const skip = (page - 1) * limit;

    const conditions: any = {
      shipperId: new Types.ObjectId(shipperId),
      isDeleted: false,
    };

    if (filter === ShipperOrderFilter.ACTIVE) {
      conditions.status = OrderStatus.IN_TRANSIT;
    } else if (filter === ShipperOrderFilter.COMPLETED) {
      conditions.status = OrderStatus.DELIVERED;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(conditions)
        .select(
          'orderNumber shippingStreet shippingDistrict shippingProvince total paymentMethod paymentStatus status deliveredAt createdAt',
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(conditions),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== NHẬN ĐƠN HÀNG (shipper accept -> waiting_pickup => in_transit) =====
  async acceptOrder(shipperId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.status !== OrderStatus.WAITING_PICKUP) {
      throw new BadRequestException(
        `Đơn hàng trạng thái "${order.status}", không thể nhận`,
      );
    }

    // Shipper phải là người được gán cho đơn này
    if (!order.shipperId || order.shipperId.toString() !== shipperId) {
      throw new ForbiddenException(
        'Bạn không được gán cho đơn này',
      );
    }

    // Kiểm tra shipper không đang giao đơn khác
    const activeOrder = await this.orderModel.findOne({
      shipperId: new Types.ObjectId(shipperId),
      status: OrderStatus.IN_TRANSIT,
      isDeleted: false,
    });
    if (activeOrder) {
      throw new BadRequestException(
        `Bạn đang giao đơn ${activeOrder.orderNumber}. Hãy hoàn thành trước khi nhận đơn mới.`,
      );
    }

    // Chuyển status sang IN_TRANSIT
    order.status = OrderStatus.IN_TRANSIT;
    order.statusHistory.push({
      status: OrderStatus.IN_TRANSIT,
      changedBy: new Types.ObjectId(shipperId),
      changedAt: new Date(),
      note: 'Shipper đã nhận đơn và bắt đầu giao',
    } as any);
    await order.save();

    // Cập nhật trạng thái shipper thành BUSY
    await this.userModel.findByIdAndUpdate(shipperId, {
      shipperStatus: ShipperStatus.BUSY,
    });

    // Emit socket event cho admin
    this.socketGateway.sendToAdmin('order:shipper-assigned', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shipperId,
    });

    // Emit status update cho customer
    this.socketGateway.server.emit('order:statusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: OrderStatus.IN_TRANSIT,
      customerId: order.customerId?.toString(),
    });

    // Gửi thông báo cho khách hàng
    if (order.customerId) {
      await this.notificationsService.create({
        userId: order.customerId.toString(),
        type: 'order_in_transit',
        title: 'Đang giao hàng',
        message: `Đơn hàng ${order.orderNumber} đang được giao đến bạn`,
      });
    }

    return order;
  }

  // ===== TỪ CHỐI ĐƠN HÀNG =====
  async rejectOrder(
    shipperId: string,
    orderId: string,
    reason: string,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Chỉ cho từ chối đơn được gán cho shipper này
    if (
      !order.shipperId ||
      order.shipperId.toString() !== shipperId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền từ chối đơn này',
      );
    }

    if (
      order.status !== OrderStatus.WAITING_PICKUP &&
      order.status !== OrderStatus.IN_TRANSIT
    ) {
      throw new BadRequestException(
        'Chỉ có thể từ chối đơn đang chờ lấy hoặc đang giao',
      );
    }

    // Bỏ gán shipper, đơn quay lại preparing để admin gán shipper khác
    order.shipperId = null;
    (order as any).shipperName = null;
    (order as any).shipperPhone = null;
    order.status = OrderStatus.PREPARING;
    order.statusHistory.push({
      status: OrderStatus.PREPARING,
      changedBy: new Types.ObjectId(shipperId),
      changedAt: new Date(),
      note: `Shipper từ chối: ${reason}`,
    } as any);
    await order.save();

    // Cập nhật shipper về AVAILABLE
    await this.userModel.findByIdAndUpdate(shipperId, {
      shipperStatus: ShipperStatus.AVAILABLE,
    });

    // Emit event để admin biết
    this.socketGateway.sendToAdmin('order:shipper-rejected', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shipperId,
      reason,
    });

    return {
      message: `Đã từ chối đơn ${order.orderNumber}`,
      reason,
    };
  }

  // ===== XÁC NHẬN GIAO HÀNG (DELIVERED) =====
  async updateDeliveryStatus(
    shipperId: string,
    orderId: string,
    dto: DeliverOrderDto,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (
      !order.shipperId ||
      order.shipperId.toString() !== shipperId
    ) {
      throw new ForbiddenException(
        'Bạn không phải shipper của đơn này',
      );
    }

    if (order.status !== OrderStatus.IN_TRANSIT) {
      throw new BadRequestException(
        'Đơn hàng không ở trạng thái đang giao',
      );
    }

    // Cập nhật trạng thái đơn
    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.deliveryProofImage = dto.proofImage;
    order.statusHistory.push({
      status: OrderStatus.DELIVERED,
      changedBy: new Types.ObjectId(shipperId),
      changedAt: new Date(),
      note: 'Shipper xác nhận đã giao hàng',
    } as any);

    // Nếu thanh toán COD, đánh dấu đã thanh toán
    if (order.paymentMethod === PaymentMethod.COD) {
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Cập nhật shipper về AVAILABLE
    await this.userModel.findByIdAndUpdate(shipperId, {
      shipperStatus: ShipperStatus.AVAILABLE,
    });

    // Emit socket event
    this.socketGateway.sendToAdmin('order:delivered', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shipperId,
    });

    // Emit status update cho customer realtime
    this.socketGateway.server.emit('order:statusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: OrderStatus.DELIVERED,
      customerId: order.customerId?.toString(),
    });

    // Thông báo cho khách hàng
    if (order.customerId) {
      await this.notificationsService.create({
        userId: order.customerId.toString(),
        type: 'order_status_changed',
        title: 'Đơn hàng đã giao thành công',
        message: `Đơn hàng ${order.orderNumber} đã được giao thành công`,
      });
    }

    return order;
  }

  // ===== CHI TIET DON HANG (CHO SHIPPER) =====
  async getOrderDetail(shipperId: string, orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.productId', 'name images')
      .populate('customerId', 'fullName phone')
      .lean();

    if (!order) {
      throw new NotFoundException('Don hang khong ton tai');
    }

    // Shipper chi xem duoc don chua nhan hoac don cua minh
    const isAssignedToMe =
      order.shipperId?.toString() === shipperId;
    const isUnassigned = !order.shipperId;

    if (!isAssignedToMe && !isUnassigned) {
      throw new ForbiddenException(
        'Ban khong co quyen xem don nay',
      );
    }

    return order;
  }

  // ===== THONG KE TONG QUAT =====
  async getStats(shipperId: string, period?: string) {
    const shipperObjId = new Types.ObjectId(shipperId);

    // Xac dinh khoang thoi gian
    const now = new Date();
    let startOfPeriod: Date;

    switch (period) {
      case 'week':
        startOfPeriod = new Date(now);
        startOfPeriod.setDate(now.getDate() - 7);
        break;
      case 'month':
        startOfPeriod = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
        break;
      case 'day':
      default:
        startOfPeriod = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        break;
    }

    const matchCondition = {
      shipperId: shipperObjId,
      deliveredAt: { $gte: startOfPeriod },
      status: OrderStatus.DELIVERED,
    };

    const [stats] = await this.orderModel.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalCodCollected: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMethod', PaymentMethod.COD] },
                '$total',
                0,
              ],
            },
          },
          totalEarnings: {
            $sum: '$shippingFee', // Thu nhap shipper = phi van chuyen
          },
        },
      },
    ]);

    // Ty le hoan thanh
    const [totalAssigned, totalDelivered] = await Promise.all([
      this.orderModel.countDocuments({
        shipperId: shipperObjId,
        isDeleted: false,
      }),
      this.orderModel.countDocuments({
        shipperId: shipperObjId,
        status: OrderStatus.DELIVERED,
      }),
    ]);

    const completionRate =
      totalAssigned > 0
        ? Math.round((totalDelivered / totalAssigned) * 100)
        : 0;

    return {
      period: period || 'day',
      totalOrders: stats?.totalOrders || 0,
      totalEarnings: stats?.totalEarnings || 0,
      totalCodCollected: stats?.totalCodCollected || 0,
      completionRate,
      totalAssigned,
      totalDelivered,
    };
  }

  // ===== CHI TIET DOANH THU THEO NGAY/TUAN/THANG =====
  async getEarnings(shipperId: string, query: QueryEarningsDto) {
    const shipperObjId = new Types.ObjectId(shipperId);
    const {
      groupBy = EarningsPeriod.DAY,
      startDate,
      endDate,
    } = query;

    // Mac dinh: 30 ngay gan nhat
    const matchStart = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const matchEnd = endDate ? new Date(endDate) : new Date();

    // Xac dinh grouping format
    let dateFormat: string;
    switch (groupBy) {
      case EarningsPeriod.WEEK:
        dateFormat = '%Y-W%V';
        break;
      case EarningsPeriod.MONTH:
        dateFormat = '%Y-%m';
        break;
      case EarningsPeriod.DAY:
      default:
        dateFormat = '%Y-%m-%d';
        break;
    }

    const earnings = await this.orderModel.aggregate([
      {
        $match: {
          shipperId: shipperObjId,
          status: OrderStatus.DELIVERED,
          deliveredAt: {
            $gte: matchStart,
            $lte: matchEnd,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$deliveredAt',
            },
          },
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: '$shippingFee' },
          totalCodCollected: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMethod', PaymentMethod.COD] },
                '$total',
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Tong ket
    const summary = earnings.reduce(
      (acc, item) => ({
        totalOrders: acc.totalOrders + item.totalOrders,
        totalEarnings: acc.totalEarnings + item.totalEarnings,
        totalCodCollected:
          acc.totalCodCollected + item.totalCodCollected,
      }),
      { totalOrders: 0, totalEarnings: 0, totalCodCollected: 0 },
    );

    return {
      groupBy,
      startDate: matchStart,
      endDate: matchEnd,
      earnings,
      summary,
    };
  }

  // ===== TONG HOP COD CAN QUYET TOAN =====
  async getCodSummary(shipperId: string) {
    const shipperObjId = new Types.ObjectId(shipperId);

    // Don COD da giao nhung chua quyet toan voi admin
    const codOrders = await this.orderModel
      .find({
        shipperId: shipperObjId,
        status: OrderStatus.DELIVERED,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: { $ne: 'settled' }, // Chua quyet toan
      })
      .select('orderNumber total deliveredAt')
      .sort({ deliveredAt: -1 })
      .lean();

    const totalCodToSettle = codOrders.reduce(
      (sum, order) => sum + (order as any).total,
      0,
    );

    return {
      totalOrders: codOrders.length,
      totalCodToSettle,
      orders: codOrders,
    };
  }
}
