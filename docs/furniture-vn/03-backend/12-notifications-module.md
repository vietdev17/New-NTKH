# NOTIFICATIONS MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module thong bao realtime (Socket.IO) + gui email (nodemailer)
> Truoc do chi co schema, gio xay dung day du service/controller/email
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [DTOs](#3-dtos)
4. [NotificationsService](#4-notificationsservice)
5. [EmailService](#5-emailservice)
6. [NotificationsController](#6-notificationscontroller)
7. [Bang API Endpoints](#7-bang-api-endpoints)
8. [Vi du Request/Response](#8-vi-du-requestresponse)

---

## 1. Tong quan

Module Notifications dam nhan 2 nhiem vu chinh:

**Thong bao realtime:**
- Luu notification vao DB (schema Notification da co san)
- Push realtime qua Socket.IO toi user tuong ung
- Ho tro pagination, filter unread, mark as read
- Cac helper method tu dong tao thong bao cho cac su kien quan trong

**Gui email:**
- Su dung nodemailer voi SMTP config tu environment
- Template HTML inline styles (tuong thich email client)
- Gui email xac nhan don hang, reset password, cap nhat trang thai

**Schemas su dung:**
- Notification (xem `02-database/01-schemas.md`)
- Order, Product, User (de lay thong tin khi tao notification)

---

## 2. Cau truc module

```
apps/api/src/modules/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts
├── email.service.ts
├── dto/
│   ├── create-notification.dto.ts
│   └── query-notification.dto.ts
└── templates/
    ├── order-confirmation.template.ts
    ├── password-reset.template.ts
    └── order-status-update.template.ts
```

### Module Registration

```typescript
// notifications.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => SocketModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
```

---

## 3. DTOs

### CreateNotificationDto

```typescript
// dto/create-notification.dto.ts
import { IsString, IsEnum, IsOptional, IsMongoId } from 'class-validator';

export enum NotificationType {
  ORDER = 'order',
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  REVIEW = 'review',
  STOCK = 'stock',
  RETURN = 'return',
  SYSTEM = 'system',
}

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsString()
  link?: string; // VD: '/orders/FV-20260402-0001'

  @IsOptional()
  metadata?: Record<string, any>; // Du lieu bo sung (orderId, productId, ...)
}
```

### QueryNotificationDto

```typescript
// dto/query-notification.dto.ts
import { IsOptional, IsEnum, IsNumberString } from 'class-validator';

export class QueryNotificationDto {
  @IsOptional()
  @IsNumberString()
  page?: string; // Default: '1'

  @IsOptional()
  @IsNumberString()
  limit?: string; // Default: '20'

  @IsOptional()
  @IsEnum(['true', 'false'])
  unreadOnly?: string; // Default: 'false'

  @IsOptional()
  @IsEnum(['order', 'payment', 'shipping', 'review', 'stock', 'return', 'system'])
  type?: string;
}
```

---

## 4. NotificationsService

```typescript
// notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../../schemas/notification.schema';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { EventsGateway } from '../socket/events.gateway';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private eventsGateway: EventsGateway,
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
      user: new Types.ObjectId(dto.userId),
      title: dto.title,
      message: dto.message,
      type: dto.type,
      link: dto.link,
      metadata: dto.metadata,
      isRead: false,
    });

    // Push realtime toi user
    this.eventsGateway.server.to(`room:customer:${dto.userId}`).emit('notification', {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  /**
   * Lay danh sach notification cua user, ho tro pagination + filter
   */
  async findByUser(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<{ data: NotificationDocument[]; total: number; page: number; totalPages: number }> {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: new Types.ObjectId(userId) };

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
  async markAsRead(id: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
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
      { user: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Dem so notification chua doc
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      user: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Xoa notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
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
   * - Gui cho admin (room:admin)
   * - Gui notification cho customer
   * - Gui email xac nhan cho customer
   */
  async notifyOrderCreated(order: any): Promise<void> {
    // 1. Notification cho customer
    await this.create({
      userId: order.customer.toString(),
      title: 'Don hang da duoc tao',
      message: `Don hang ${order.orderNumber} da duoc dat thanh cong. Tong tien: ${order.totalAmount.toLocaleString('vi-VN')}d`,
      type: NotificationType.ORDER,
      link: `/orders/${order.orderNumber}`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber },
    });

    // 2. Push cho admin room
    this.eventsGateway.server.to('room:admin').emit('order:created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      channel: order.channel,
      createdAt: order.createdAt,
    });

    // 3. Gui email xac nhan don hang
    if (order.customerInfo?.email) {
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
      confirmed: 'Don hang da duoc xac nhan va dang chuan bi',
      shipping: 'Don hang dang duoc van chuyen',
      delivered: 'Don hang da giao thanh cong',
      cancelled: 'Don hang da bi huy',
    };

    const message = statusMessages[newStatus]
      || `Trang thai don hang chuyen tu ${oldStatus} sang ${newStatus}`;

    await this.create({
      userId: order.customer.toString(),
      title: `Cap nhat don hang ${order.orderNumber}`,
      message,
      type: NotificationType.ORDER,
      link: `/orders/${order.orderNumber}`,
      metadata: { orderId: order._id, oldStatus, newStatus },
    });

    // Push toi order room
    this.eventsGateway.server.to(`room:order:${order._id}`).emit('order:status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus,
    });

    // Gui email cap nhat trang thai
    if (order.customerInfo?.email) {
      await this.emailService.sendOrderStatusUpdate(order, newStatus);
    }
  }

  /**
   * Thong bao khi shipper duoc gan vao don hang
   */
  async notifyShipperAssigned(order: any, shipper: any): Promise<void> {
    // Notification cho shipper
    await this.create({
      userId: shipper._id.toString(),
      title: 'Ban co don hang moi can giao',
      message: `Don hang ${order.orderNumber} - Giao toi: ${order.shippingAddress.fullAddress}`,
      type: NotificationType.SHIPPING,
      link: `/shipper/orders/${order._id}`,
      metadata: { orderId: order._id, orderNumber: order.orderNumber },
    });

    // Notification cho customer
    await this.create({
      userId: order.customer.toString(),
      title: 'Shipper da nhan don hang',
      message: `Shipper ${shipper.name} dang tren duong giao don hang ${order.orderNumber}`,
      type: NotificationType.SHIPPING,
      link: `/orders/${order.orderNumber}`,
      metadata: { orderId: order._id, shipperName: shipper.name },
    });

    // Socket event
    this.eventsGateway.server.to(`room:shipper:${shipper._id}`).emit('order:assigned', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shippingAddress: order.shippingAddress,
    });
  }

  /**
   * Thong bao khi nhan duoc thanh toan (chuyen khoan)
   */
  async notifyPaymentReceived(order: any): Promise<void> {
    await this.create({
      userId: order.customer.toString(),
      title: 'Da nhan thanh toan',
      message: `Thanh toan ${order.totalAmount.toLocaleString('vi-VN')}d cho don ${order.orderNumber} da duoc xac nhan`,
      type: NotificationType.PAYMENT,
      link: `/orders/${order.orderNumber}`,
      metadata: { orderId: order._id },
    });

    this.eventsGateway.server.to('room:admin').emit('order:status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      event: 'payment_received',
    });
  }

  /**
   * Thong bao khi san pham sap het hang
   */
  async notifyLowStock(product: any, variant: any): Promise<void> {
    // Chi gui cho admin
    this.eventsGateway.server.to('room:admin').emit('stock:low', {
      productId: product._id,
      productName: product.name,
      sku: variant.sku,
      currentStock: variant.stock,
      color: variant.color?.name,
      dimension: variant.dimension?.label,
    });
  }

  /**
   * Thong bao khi co danh gia moi
   */
  async notifyNewReview(review: any, product: any): Promise<void> {
    this.eventsGateway.server.to('room:admin').emit('review:new', {
      reviewId: review._id,
      productId: product._id,
      productName: product.name,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerName,
    });
  }

  /**
   * Thong bao khi co yeu cau tra hang
   */
  async notifyReturnRequested(returnRequest: any): Promise<void> {
    this.eventsGateway.server.to('room:admin').emit('return:requested', {
      returnId: returnRequest._id,
      orderId: returnRequest.order,
      reason: returnRequest.reason,
      createdAt: returnRequest.createdAt,
    });
  }
}
```

---

## 5. EmailService

```typescript
// email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('MAIL_FROM', 'noreply@furniturevn.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // true cho port 465
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  // ============================================================
  // Generic send
  // ============================================================

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"FurnitureVN" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  // ============================================================
  // Email xac nhan don hang
  // ============================================================

  async sendOrderConfirmation(order: any): Promise<boolean> {
    const itemsHtml = order.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.productName}</strong><br>
            <span style="color: #666; font-size: 13px;">
              ${item.color ? 'Mau: ' + item.color : ''} 
              ${item.dimension ? '| Kich thuoc: ' + item.dimension : ''}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${item.price.toLocaleString('vi-VN')}d
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${(item.price * item.quantity).toLocaleString('vi-VN')}d
          </td>
        </tr>`,
      )
      .join('');

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FurnitureVN</h1>
        <p style="margin: 8px 0 0;">Xac nhan don hang</p>
      </div>
      
      <div style="padding: 24px;">
        <h2 style="color: #333;">Cam on ban da dat hang!</h2>
        <p style="color: #666;">Ma don hang: <strong>${order.orderNumber}</strong></p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px; text-align: left;">San pham</th>
              <th style="padding: 12px; text-align: center;">SL</th>
              <th style="padding: 12px; text-align: right;">Don gia</th>
              <th style="padding: 12px; text-align: right;">Thanh tien</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #2563eb; padding-top: 16px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 4px 0; color: #666;">Tam tinh:</td>
              <td style="text-align: right;">${order.subtotal.toLocaleString('vi-VN')}d</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">Phi van chuyen:</td>
              <td style="text-align: right;">${order.shippingFee.toLocaleString('vi-VN')}d</td>
            </tr>
            ${order.discount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #22c55e;">Giam gia:</td>
              <td style="text-align: right; color: #22c55e;">-${order.discount.toLocaleString('vi-VN')}d</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-size: 18px; font-weight: bold;">Tong cong:</td>
              <td style="text-align: right; font-size: 18px; font-weight: bold; color: #2563eb;">
                ${order.totalAmount.toLocaleString('vi-VN')}d
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin: 0 0 8px; color: #333;">Dia chi giao hang</h3>
          <p style="margin: 0; color: #666;">${order.shippingAddress.fullAddress}</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${this.frontendUrl}/orders/${order.orderNumber}"
             style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem don hang
          </a>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>FurnitureVN - Noi that chat luong cho moi nha</p>
      </div>
    </div>`;

    return this.sendEmail(
      order.customerInfo.email,
      `Xac nhan don hang ${order.orderNumber} - FurnitureVN`,
      html,
    );
  }

  // ============================================================
  // Email reset mat khau
  // ============================================================

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FurnitureVN</h1>
      </div>
      
      <div style="padding: 24px;">
        <h2 style="color: #333;">Dat lai mat khau</h2>
        <p style="color: #666;">
          Ban da yeu cau dat lai mat khau. Click vao nut ben duoi de tao mat khau moi.
          Link nay se het han sau 1 gio.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}"
             style="background: #2563eb; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">
            Dat lai mat khau
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px;">
          Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.
        </p>
        <p style="color: #999; font-size: 13px;">
          Hoac copy link: <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>FurnitureVN - Noi that chat luong cho moi nha</p>
      </div>
    </div>`;

    return this.sendEmail(email, 'Dat lai mat khau - FurnitureVN', html);
  }

  // ============================================================
  // Email cap nhat trang thai don hang
  // ============================================================

  async sendOrderStatusUpdate(order: any, newStatus: string): Promise<boolean> {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      confirmed: { label: 'Da xac nhan', color: '#3b82f6', icon: '&#9989;' },
      shipping: { label: 'Dang giao hang', color: '#f59e0b', icon: '&#128666;' },
      delivered: { label: 'Da giao thanh cong', color: '#22c55e', icon: '&#9989;' },
      cancelled: { label: 'Da huy', color: '#ef4444', icon: '&#10060;' },
    };

    const status = statusMap[newStatus] || { label: newStatus, color: '#666', icon: '' };

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FurnitureVN</h1>
      </div>
      
      <div style="padding: 24px;">
        <h2 style="color: #333;">Cap nhat don hang ${order.orderNumber}</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="font-size: 40px; margin: 0;">${status.icon}</p>
          <p style="font-size: 20px; font-weight: bold; color: ${status.color}; margin: 8px 0;">
            ${status.label}
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${this.frontendUrl}/orders/${order.orderNumber}"
             style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem chi tiet don hang
          </a>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>FurnitureVN - Noi that chat luong cho moi nha</p>
      </div>
    </div>`;

    return this.sendEmail(
      order.customerInfo.email,
      `Don hang ${order.orderNumber} - ${status.label}`,
      html,
    );
  }
}
```

---

## 6. NotificationsController

```typescript
// notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Lay danh sach notification cua user dang dang nhap
   * Query params: page, limit, unreadOnly, type
   */
  @Get()
  async findAll(@Request() req, @Query() query: QueryNotificationDto) {
    return this.notificationsService.findByUser(req.user._id, query);
  }

  /**
   * GET /notifications/unread-count
   * Dem so thong bao chua doc
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user._id);
    return { unreadCount: count };
  }

  /**
   * PATCH /notifications/:id/read
   * Danh dau 1 thong bao da doc
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user._id);
  }

  /**
   * PATCH /notifications/read-all
   * Danh dau tat ca thong bao da doc
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user._id);
  }

  /**
   * DELETE /notifications/:id
   * Xoa thong bao
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    await this.notificationsService.delete(id, req.user._id);
    return { message: 'Da xoa thong bao' };
  }
}
```

---

## 7. Bang API Endpoints

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| GET | `/notifications` | JWT | Lay danh sach notification (pagination + filter) |
| GET | `/notifications/unread-count` | JWT | Dem so thong bao chua doc |
| PATCH | `/notifications/:id/read` | JWT | Danh dau da doc 1 thong bao |
| PATCH | `/notifications/read-all` | JWT | Danh dau tat ca da doc |
| DELETE | `/notifications/:id` | JWT | Xoa thong bao |

> **Luu y:** Tat ca endpoint deu yeu cau JWT token. User chi thao tac duoc voi notification cua chinh minh.

---

## 8. Vi du Request/Response

### GET /notifications?page=1&limit=10&unreadOnly=true

**Request:**
```http
GET /api/notifications?page=1&limit=10&unreadOnly=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "data": [
    {
      "_id": "661a1b2c3d4e5f6a7b8c9d01",
      "user": "660f1a2b3c4d5e6f7a8b9c01",
      "title": "Don hang da duoc tao",
      "message": "Don hang FV-20260402-0001 da duoc dat thanh cong. Tong tien: 15.500.000d",
      "type": "order",
      "link": "/orders/FV-20260402-0001",
      "isRead": false,
      "metadata": {
        "orderId": "661a1b2c3d4e5f6a7b8c9d10",
        "orderNumber": "FV-20260402-0001"
      },
      "createdAt": "2026-04-02T10:30:00.000Z"
    },
    {
      "_id": "661a1b2c3d4e5f6a7b8c9d02",
      "user": "660f1a2b3c4d5e6f7a8b9c01",
      "title": "Shipper da nhan don hang",
      "message": "Shipper Nguyen Van A dang tren duong giao don hang FV-20260401-0003",
      "type": "shipping",
      "link": "/orders/FV-20260401-0003",
      "isRead": false,
      "createdAt": "2026-04-01T14:20:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "totalPages": 1
}
```

### GET /notifications/unread-count

**Request:**
```http
GET /api/notifications/unread-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "unreadCount": 5
}
```

### PATCH /notifications/:id/read

**Request:**
```http
PATCH /api/notifications/661a1b2c3d4e5f6a7b8c9d01/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "_id": "661a1b2c3d4e5f6a7b8c9d01",
  "user": "660f1a2b3c4d5e6f7a8b9c01",
  "title": "Don hang da duoc tao",
  "message": "Don hang FV-20260402-0001 da duoc dat thanh cong",
  "type": "order",
  "isRead": true,
  "readAt": "2026-04-02T11:00:00.000Z"
}
```

### PATCH /notifications/read-all

**Request:**
```http
PATCH /api/notifications/read-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "modifiedCount": 5
}
```

### DELETE /notifications/:id

**Request:**
```http
DELETE /api/notifications/661a1b2c3d4e5f6a7b8c9d01
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "message": "Da xoa thong bao"
}
```
