import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailService } from './email.service';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private socketGateway: SocketGateway,
    private emailService: EmailService,
  ) {}

  // ============================================================
  // CRUD co ban
  // ============================================================

  /**
   * Tao notification moi va push realtime qua Socket.IO
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      title: dto.title,
      message: dto.message,
      type: dto.type,
      actionUrl: dto.actionUrl,
      data: dto.data || {},
      isRead: false,
    });

    // Push realtime tới user qua socket
    this.socketGateway.sendToUser(dto.userId, 'notification:new', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      actionUrl: notification.actionUrl,
      createdAt: (notification as any).createdAt,
    });

    return notification;
  }

  /**
   * Lay danh sach notification cua user, ho tro pagination + filter
   */
  async findByUser(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };

    if (query.unreadOnly === 'true') {
      filter.isRead = false;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Danh dau 1 notification da doc
   */
  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      { isRead: true, readAt: new Date() },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Khong tim thay thong bao');
    }

    return notification;
  }

  /**
   * Danh dau tat ca notification cua user da doc
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Dem so notification chua doc
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Xoa notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Khong tim thay thong bao');
    }
  }

  // ============================================================
  // Helper methods - Tao thong bao cho cac su kien cu the
  // ============================================================

  /**
   * Thong bao don hang moi duoc tao
   */
  async notifyOrderCreated(order: any): Promise<void> {
    // 1. Notification cho customer
    if (order.customerId) {
      await this.create({
        userId: order.customerId.toString(),
        title: 'Đơn hàng đã được tạo',
        message: `Đơn hàng ${order.orderNumber} đã được đặt thành công. Tổng tiền: ${(order.total || 0).toLocaleString('vi-VN')}đ`,
        type: NotificationType.ORDER_CREATED,
        actionUrl: `/orders/${order.orderNumber}`,
        data: { orderId: order._id, orderNumber: order.orderNumber },
      });
    }

    // 2. Push socket cho admin room + emit notification:new event
    const adminNotification = {
      id: `temp-${Date.now()}`,
      title: 'Đơn hàng mới',
      message: `Đơn hàng ${order.orderNumber} - ${(order.total || 0).toLocaleString('vi-VN')}đ từ ${order.isPosOrder ? 'POS' : 'Web'}`,
      type: NotificationType.ORDER_CREATED,
      actionUrl: `/admin/orders`,
      createdAt: new Date().toISOString(),
    };
    this.socketGateway.sendToAdmin('notification:new', adminNotification);

    // 3. Tao notification cho all admins (luu vao DB)
    const admins = await this.userModel.find({ role: UserRole.ADMIN, isDeleted: false }).lean();
    const adminNotifications = admins.map((admin) => ({
      userId: admin._id,
      title: 'Đơn hàng mới',
      message: `Đơn hàng ${order.orderNumber} - ${(order.total || 0).toLocaleString('vi-VN')}đ từ ${order.isPosOrder ? 'POS' : 'Web'}`,
      type: NotificationType.ORDER_CREATED,
      actionUrl: `/admin/orders`,
      data: { orderId: order._id, orderNumber: order.orderNumber },
      isRead: false,
    }));
    if (adminNotifications.length > 0) {
      await this.notificationModel.insertMany(adminNotifications);
    }

    // 4. Gui email xac nhan don hang
    if (order.customerEmail) {
      await this.emailService.sendOrderConfirmation(order);
    }
  }

  /**
   * Thong bao khi trang thai don hang thay doi
   */
  async notifyOrderStatusChanged(
    order: any,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      confirmed: 'Đơn hàng đã được xác nhận và đang chuẩn bị',
      preparing: 'Đơn hàng đang được chuẩn bị',
      waiting_pickup: 'Đơn hàng đang chờ shipper đến lấy',
      in_transit: 'Đơn hàng đang được vận chuyển đến bạn',
      delivered: 'Đơn hàng đã giao thành công',
      cancelled: 'Đơn hàng đã bị hủy',
    };

    const message =
      statusMessages[newStatus] ||
      `Trạng thái đơn hàng chuyển từ ${oldStatus} sang ${newStatus}`;

    if (order.customerId) {
      await this.create({
        userId: order.customerId.toString(),
        title: `Cập nhật đơn hàng ${order.orderNumber}`,
        message,
        type: NotificationType.ORDER_STATUS_CHANGED,
        actionUrl: `/orders/${order.orderNumber}`,
        data: { orderId: order._id, oldStatus, newStatus },
      });
    }

    // Push toi order room
    this.socketGateway.sendToOrder(
      order._id.toString(),
      'order:status_updated',
      {
        orderId: order._id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
      },
    );

    // Gui email cap nhat trang thai
    if (order.customerEmail) {
      await this.emailService.sendOrderStatusUpdate(order, newStatus);
    }
  }

  /**
   * Thong bao khi shipper duoc gan vao don hang
   */
  async notifyShipperAssigned(order: any, shipper: any): Promise<void> {
    // Notification cho shipper
    if (shipper?._id) {
      await this.create({
        userId: shipper._id.toString(),
        title: 'Bạn có đơn hàng mới cần giao',
        message: `Đơn hàng ${order.orderNumber} - Giao tới: ${order.shippingStreet}, ${order.shippingDistrict}`,
        type: NotificationType.SHIPPER_ASSIGNED,
        actionUrl: `/shipper/orders/${order._id}`,
        data: { orderId: order._id, orderNumber: order.orderNumber },
      });
    }

    // Notification cho customer
    if (order.customerId) {
      await this.create({
        userId: order.customerId.toString(),
        title: 'Shipper đã nhận đơn hàng',
        message: `Shipper ${shipper?.fullName || 'của bạn'} đang trên đường giao đơn hàng ${order.orderNumber}`,
        type: NotificationType.SHIPPER_ASSIGNED,
        actionUrl: `/orders/${order.orderNumber}`,
        data: { orderId: order._id, shipperName: shipper?.fullName },
      });
    }

    // Socket event toi shipper
    if (shipper?._id) {
      this.socketGateway.sendToShipper(
        shipper._id.toString(),
        'order:assigned',
        {
          orderId: order._id,
          orderNumber: order.orderNumber,
          shippingAddress: {
            fullAddress: `${order.shippingStreet}, ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingProvince}`,
            province: order.shippingProvince,
          },
        },
      );
    }
  }

  /**
   * Thong bao khi san pham sap het hang
   */
  async notifyLowStock(product: any, variant: any): Promise<void> {
    // Push socket notification:new cho admin
    this.socketGateway.sendToAdmin('notification:new', {
      id: `temp-${Date.now()}`,
      title: 'Cảnh báo tồn kho thấp',
      message: `${product.name} (SKU: ${variant.sku}) chỉ còn ${variant.stock} sản phẩm`,
      type: NotificationType.LOW_STOCK,
      actionUrl: `/admin/products/${product._id}`,
      createdAt: new Date().toISOString(),
    });

    // Tao notification cho all admins
    const admins = await this.userModel.find({ role: UserRole.ADMIN, isDeleted: false }).lean();
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      title: 'Cảnh báo tồn kho thấp',
      message: `${product.name} (SKU: ${variant.sku}) chỉ còn ${variant.stock} sản phẩm`,
      type: NotificationType.LOW_STOCK,
      actionUrl: `/admin/products/${product._id}`,
      data: { productId: product._id, variantId: variant._id, sku: variant.sku },
      isRead: false,
    }));
    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }

  /**
   * Thong bao khi co danh gia moi
   */
  async notifyNewReview(review: any, product: any): Promise<void> {
    // Push socket notification:new cho admin
    this.socketGateway.sendToAdmin('notification:new', {
      id: `temp-${Date.now()}`,
      title: 'Đánh giá mới cần duyệt',
      message: `${product.name} có đánh giá ${review.rating} sao: "${review.comment?.slice(0, 50)}..."`,
      type: NotificationType.NEW_REVIEW,
      actionUrl: `/admin/reviews`,
      createdAt: new Date().toISOString(),
    });

    // Tao notification cho all admins
    const admins = await this.userModel.find({ role: UserRole.ADMIN, isDeleted: false }).lean();
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      title: 'Đánh giá mới cần duyệt',
      message: `${product.name} có đánh giá ${review.rating} sao: "${review.comment?.slice(0, 50)}..."`,
      type: NotificationType.NEW_REVIEW,
      actionUrl: `/admin/reviews`,
      data: { reviewId: review._id, productId: product._id },
      isRead: false,
    }));
    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }

  /**
   * Thong bao khi co yeu cau tra hang
   */
  async notifyReturnRequested(returnRequest: any): Promise<void> {
    // Push socket notification:new cho admin
    this.socketGateway.sendToAdmin('notification:new', {
      id: `temp-${Date.now()}`,
      title: 'Yêu cầu trả hàng mới',
      message: `Khách yêu cầu trả hàng cho đơn #${returnRequest.order}: ${returnRequest.reason}`,
      type: NotificationType.RETURN_REQUESTED,
      actionUrl: `/admin/returns`,
      createdAt: new Date().toISOString(),
    });

    // Tao notification cho all admins
    const admins = await this.userModel.find({ role: UserRole.ADMIN, isDeleted: false }).lean();
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      title: 'Yêu cầu trả hàng mới',
      message: `Khách yêu cầu trả hàng cho đơn #${returnRequest.order}: ${returnRequest.reason}`,
      type: NotificationType.RETURN_REQUESTED,
      actionUrl: `/admin/returns`,
      data: { returnId: returnRequest._id, orderId: returnRequest.order },
      isRead: false,
    }));
    if (notifications.length > 0) {
      await this.notificationModel.insertMany(notifications);
    }
  }
}
