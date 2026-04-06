# SHIPPER MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module quan ly shipper: nhan/giao don, GPS tracking, thong ke doanh thu, thu ho COD
> 2 Controller: ShipperController (shipper endpoints) + AdminShipperController (admin endpoints)
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [DTOs](#3-dtos)
4. [ShipperService](#4-shipperservice)
5. [ShipperLocationService](#5-shipperlocationservice)
6. [ShipperController](#6-shippercontroller)
7. [AdminShipperController](#7-adminshippercontroller)
8. [Bang API Endpoints](#8-bang-api-endpoints)
9. [Vi du Request/Response](#9-vi-du-requestresponse)

---

## 1. Tong quan

Module Shipper quan ly toan bo quy trinh giao hang:

**Shipper-facing:**
- Xem don hang cho nhan (WAITING_PICKUP) gan vi tri
- Nhan/tu choi don hang
- Cap nhat trang thai giao (DELIVERED voi anh chung minh)
- Thong ke doanh thu, so don, COD da thu

**Admin-facing:**
- Quan ly danh sach shipper, trang thai
- Xem vi tri tat ca shipper tren ban do
- Tim shipper gan vi tri cu the (2dsphere query)
- Gan don thu cong cho shipper

**GPS Tracking:**
- Shipper cap nhat vi tri realtime (lat/lng/accuracy)
- Luu currentOrderId de gan vi tri voi don dang giao
- TTL 24h tu dong xoa vi tri cu
- Index 2dsphere ho tro query $nearSphere

**Schemas su dung:**
- User (xem `02-database/01-schemas.md` muc 2) - voi role = SHIPPER
- ShipperLocation (xem `02-database/01-schemas.md` muc 6)
- Order (xem `02-database/01-schemas.md` muc 5)

---

## 2. Cau truc module

```
src/modules/shipper/
  ├── shipper.module.ts
  ├── shipper.service.ts
  ├── shipper-location.service.ts
  ├── shipper.controller.ts
  ├── admin-shipper.controller.ts
  └── dto/
      ├── update-location.dto.ts
      ├── deliver-order.dto.ts
      ├── update-shipper-status.dto.ts
      ├── reject-order.dto.ts
      ├── query-shipper-orders.dto.ts
      └── query-earnings.dto.ts
```

### shipper.module.ts

```typescript
// ============================================================
// modules/shipper/shipper.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import {
  ShipperLocation,
  ShipperLocationSchema,
} from '../../schemas/shipper-location.schema';
import { ShipperService } from './shipper.service';
import { ShipperLocationService } from './shipper-location.service';
import { ShipperController } from './shipper.controller';
import { AdminShipperController } from './admin-shipper.controller';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ShipperLocation.name, schema: ShipperLocationSchema },
    ]),
    SocketModule,
    NotificationsModule,
  ],
  controllers: [ShipperController, AdminShipperController],
  providers: [ShipperService, ShipperLocationService],
  exports: [ShipperService, ShipperLocationService],
})
export class ShipperModule {}
```

---

## 3. DTOs

### UpdateLocationDto

```typescript
// ============================================================
// modules/shipper/dto/update-location.dto.ts
// ============================================================
import {
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90, { message: 'Latitude phai tu -90 den 90' })
  @Max(90, { message: 'Latitude phai tu -90 den 90' })
  lat: number;

  @IsNumber()
  @Min(-180, { message: 'Longitude phai tu -180 den 180' })
  @Max(180, { message: 'Longitude phai tu -180 den 180' })
  lng: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number; // Do chinh xac GPS (met)

  /**
   * [FIXED] Truong nay truoc day bi thieu trong DTO.
   * Can de he thong biet shipper dang giao don nao,
   * phuc vu tracking map cho khach hang.
   */
  @IsOptional()
  @IsMongoId()
  currentOrderId?: string;
}
```

### DeliverOrderDto

```typescript
// ============================================================
// modules/shipper/dto/deliver-order.dto.ts
// ============================================================
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class DeliverOrderDto {
  @IsNotEmpty({ message: 'Anh chung minh giao hang la bat buoc' })
  @IsString()
  proofImage: string; // URL anh tu Upload module

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string; // Ghi chu khi giao (VD: "De o bao ve")
}
```

### UpdateShipperStatusDto

```typescript
// ============================================================
// modules/shipper/dto/update-shipper-status.dto.ts
// ============================================================
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ShipperStatus } from '../../../enums/shipper-status.enum';

export class UpdateShipperStatusDto {
  @IsNotEmpty()
  @IsEnum(ShipperStatus, {
    message: 'Trang thai phai la: available, busy, offline',
  })
  status: ShipperStatus;
}
```

### RejectOrderDto

```typescript
// ============================================================
// modules/shipper/dto/reject-order.dto.ts
// ============================================================
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectOrderDto {
  @IsNotEmpty({ message: 'Ly do tu choi la bat buoc' })
  @IsString()
  @MaxLength(500)
  reason: string;
}
```

### QueryShipperOrdersDto

```typescript
// ============================================================
// modules/shipper/dto/query-shipper-orders.dto.ts
// ============================================================
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../enums/order-status.enum';

export enum ShipperOrderFilter {
  ACTIVE = 'active',     // Don dang giao (shipping)
  COMPLETED = 'completed', // Don da giao (delivered)
  ALL = 'all',
}

export class QueryShipperOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ShipperOrderFilter)
  filter?: ShipperOrderFilter = ShipperOrderFilter.ALL;
}
```

### QueryEarningsDto

```typescript
// ============================================================
// modules/shipper/dto/query-earnings.dto.ts
// ============================================================
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum EarningsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class QueryEarningsDto {
  @IsOptional()
  @IsEnum(EarningsPeriod)
  groupBy?: EarningsPeriod = EarningsPeriod.DAY;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

---

## 4. ShipperService

```typescript
// ============================================================
// modules/shipper/shipper.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { OrderStatus } from '../../enums/order-status.enum';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { ShipperStatus } from '../../enums/shipper-status.enum';
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

  // ===== DON HANG CHO NHAN (WAITING_PICKUP / SHIPPING chua co shipper) =====
  async getAvailableOrders(shipperId: string) {
    // Lay don hang trang thai SHIPPING nhung chua co shipperId
    // (Admin da xac nhan, dang cho shipper nhan)
    const orders = await this.orderModel
      .find({
        status: OrderStatus.SHIPPING,
        shipperId: null,
      })
      .select(
        'orderNumber shippingAddress totalAmount paymentMethod paymentStatus items createdAt',
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
    };

    if (filter === ShipperOrderFilter.ACTIVE) {
      conditions.status = OrderStatus.SHIPPING;
    } else if (filter === ShipperOrderFilter.COMPLETED) {
      conditions.status = OrderStatus.DELIVERED;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(conditions)
        .select(
          'orderNumber shippingAddress totalAmount paymentMethod paymentStatus status deliveredAt createdAt',
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

  // ===== NHAN DON HANG =====
  async acceptOrder(shipperId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Don hang khong ton tai');
    }

    if (order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException(
        `Don hang trang thai "${order.status}", khong the nhan`,
      );
    }

    if (order.shipperId) {
      throw new BadRequestException(
        'Don hang da duoc shipper khac nhan',
      );
    }

    // Kiem tra shipper khong dang giao don khac
    const activeOrder = await this.orderModel.findOne({
      shipperId: new Types.ObjectId(shipperId),
      status: OrderStatus.SHIPPING,
    });
    if (activeOrder) {
      throw new BadRequestException(
        `Ban dang giao don ${activeOrder.orderNumber}. Hay hoan thanh truoc khi nhan don moi.`,
      );
    }

    // Gan shipper cho don
    order.shipperId = new Types.ObjectId(shipperId);
    await order.save();

    // Cap nhat trang thai shipper thanh BUSY
    await this.userModel.findByIdAndUpdate(shipperId, {
      shipperStatus: ShipperStatus.BUSY,
    });

    // Emit socket event
    this.socketGateway.server.emit('order:shipper-assigned', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shipperId,
    });

    // Gui thong bao cho khach hang
    await this.notificationsService.create({
      userId: order.customerId.toString(),
      type: 'shipper_assigned',
      title: 'Shipper da nhan don',
      message: `Don hang ${order.orderNumber} dang duoc giao den ban`,
    });

    return order;
  }

  // ===== TU CHOI DON HANG =====
  async rejectOrder(
    shipperId: string,
    orderId: string,
    reason: string,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Don hang khong ton tai');
    }

    // Chi cho tu choi don da nhan (co shipperId = shipper nay)
    if (
      !order.shipperId ||
      order.shipperId.toString() !== shipperId
    ) {
      throw new ForbiddenException(
        'Ban khong co quyen tu choi don nay',
      );
    }

    if (order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException(
        'Chi co the tu choi don dang giao',
      );
    }

    // Bo gan shipper, don quay lai cho shipper khac nhan
    order.shipperId = null;
    await order.save();

    // Cap nhat shipper ve AVAILABLE
    await this.userModel.findByIdAndUpdate(shipperId, {
      shipperStatus: ShipperStatus.AVAILABLE,
    });

    // Emit event de admin biet
    this.socketGateway.server.emit('order:shipper-rejected', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shipperId,
      reason,
    });

    return {
      message: `Da tu choi don ${order.orderNumber}`,
      reason,
    };
  }

  // ===== CAP NHAT TRANG THAI GIAO HANG (DELIVERED) =====
  async updateDeliveryStatus(
    shipperId: string,
    orderId: string,
    dto: DeliverOrderDto,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Don hang khong ton tai');
    }

    if (
      !order.shipperId ||
      order.shipperId.toString() !== shipperId
    ) {
      throw new ForbiddenException(
        'Ban khong phai shipper cua don nay',
      );
    }

    if (order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException(
        'Don hang khong o trang thai dang giao',
      );
    }

    // Cap nhat trang thai don
    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.deliveryProofImage = dto.proofImage;
    if (dto.note) {
      order.deliveryNote = dto.note;
    }

    // Neu thanh toan COD, danh dau da thanh toan
    if (order.paymentMethod === PaymentMethod.COD) {
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Cap nhat shipper ve AVAILABLE
    await this.userModel.findByIdAndUpdate(shipperId, {
      shipperStatus: ShipperStatus.AVAILABLE,
    });

    // Emit socket event
    this.socketGateway.server.emit('order:delivered', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      shipperId,
    });

    // Thong bao cho khach hang
    await this.notificationsService.create({
      userId: order.customerId.toString(),
      type: 'order_status',
      title: 'Don hang da giao thanh cong',
      message: `Don hang ${order.orderNumber} da duoc giao thanh cong`,
    });

    return order;
  }

  // ===== CHI TIET DON HANG (CHO SHIPPER) =====
  async getOrderDetail(shipperId: string, orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('items.productId', 'name images basePrice')
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
                '$totalAmount',
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
      this.orderModel.countDocuments({ shipperId: shipperObjId }),
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
    const { groupBy = EarningsPeriod.DAY, startDate, endDate } = query;

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
                '$totalAmount',
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
        codSettled: { $ne: true }, // Chua quyet toan
      })
      .select('orderNumber totalAmount deliveredAt')
      .sort({ deliveredAt: -1 })
      .lean();

    const totalCodToSettle = codOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    return {
      totalOrders: codOrders.length,
      totalCodToSettle,
      orders: codOrders,
    };
  }
}
```

---

## 5. ShipperLocationService

```typescript
// ============================================================
// modules/shipper/shipper-location.service.ts
// ============================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ShipperLocation,
  ShipperLocationDocument,
} from '../../schemas/shipper-location.schema';
import { ShipperStatus } from '../../enums/shipper-status.enum';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class ShipperLocationService {
  constructor(
    @InjectModel(ShipperLocation.name)
    private locationModel: Model<ShipperLocationDocument>,
  ) {}

  // ===== CAP NHAT VI TRI GPS =====
  async updateLocation(
    shipperId: string,
    dto: UpdateLocationDto,
  ): Promise<ShipperLocationDocument> {
    const shipperObjId = new Types.ObjectId(shipperId);

    // Upsert: tao moi neu chua co, cap nhat neu da co
    const location = await this.locationModel.findOneAndUpdate(
      { shipperId: shipperObjId },
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [dto.lng, dto.lat], // GeoJSON: [longitude, latitude]
          },
          accuracy: dto.accuracy || null,
          /**
           * [FIXED] Cap nhat currentOrderId.
           * Truoc day truong nay bi thieu trong DTO va service,
           * khien tracking map khong hien thi duoc vi tri
           * shipper dang giao don nao.
           */
          currentOrderId: dto.currentOrderId
            ? new Types.ObjectId(dto.currentOrderId)
            : null,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    return location;
  }

  // ===== LAY VI TRI HIEN TAI CUA SHIPPER =====
  async getLocation(
    shipperId: string,
  ): Promise<ShipperLocationDocument> {
    const location = await this.locationModel
      .findOne({
        shipperId: new Types.ObjectId(shipperId),
      })
      .lean();

    if (!location) {
      throw new NotFoundException(
        'Khong tim thay vi tri cua shipper',
      );
    }

    return location;
  }

  // ===== TIM SHIPPER GAN VI TRI (2DSPHERE QUERY) =====
  async getNearbyShippers(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ) {
    const radiusInMeters = radiusKm * 1000;

    const shippers = await this.locationModel
      .find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
            },
            $maxDistance: radiusInMeters,
          },
        },
        status: { $in: [ShipperStatus.AVAILABLE] },
      })
      .populate('shipperId', 'fullName phone avatar')
      .lean();

    // Tinh khoang cach (xap xi) cho moi shipper
    return shippers.map((s) => {
      const [shipperLng, shipperLat] = s.location.coordinates;
      const distance = this.calculateDistance(
        lat,
        lng,
        shipperLat,
        shipperLng,
      );
      return {
        ...s,
        distanceKm: Math.round(distance * 100) / 100,
      };
    });
  }

  // ===== ADMIN: TAT CA VI TRI SHIPPER DANG HOAT DONG =====
  async getAllActiveLocations() {
    return this.locationModel
      .find({
        status: { $ne: ShipperStatus.OFFLINE },
      })
      .populate('shipperId', 'fullName phone avatar')
      .lean();
  }

  // ===== CAP NHAT TRANG THAI KHA DUNG =====
  async updateStatus(
    shipperId: string,
    status: ShipperStatus,
  ): Promise<ShipperLocationDocument> {
    const location = await this.locationModel.findOneAndUpdate(
      { shipperId: new Types.ObjectId(shipperId) },
      { $set: { status, updatedAt: new Date() } },
      { upsert: true, new: true },
    );

    return location;
  }

  // ----- Ham tinh khoang cach (Haversine formula) -----
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Ban kinh Trai Dat (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
```

---

## 6. ShipperController

```typescript
// ============================================================
// modules/shipper/shipper.controller.ts
// ============================================================
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShipperService } from './shipper.service';
import { ShipperLocationService } from './shipper-location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DeliverOrderDto } from './dto/deliver-order.dto';
import { UpdateShipperStatusDto } from './dto/update-shipper-status.dto';
import { RejectOrderDto } from './dto/reject-order.dto';
import { QueryShipperOrdersDto } from './dto/query-shipper-orders.dto';
import { QueryEarningsDto } from './dto/query-earnings.dto';

@Controller('shipper')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SHIPPER)
export class ShipperController {
  constructor(
    private readonly shipperService: ShipperService,
    private readonly locationService: ShipperLocationService,
  ) {}

  // ===== DON HANG CHO NHAN =====
  @Get('orders/available')
  async getAvailableOrders(@Request() req) {
    const data = await this.shipperService.getAvailableOrders(
      req.user._id.toString(),
    );
    return {
      success: true,
      data,
    };
  }

  // ===== DON HANG CUA TOI =====
  @Get('orders/my-orders')
  async getMyOrders(
    @Request() req,
    @Query() query: QueryShipperOrdersDto,
  ) {
    const result = await this.shipperService.getMyOrders(
      req.user._id.toString(),
      query,
    );
    return {
      success: true,
      ...result,
    };
  }

  // ===== CHI TIET DON HANG =====
  @Get('orders/:id')
  async getOrderDetail(
    @Request() req,
    @Param('id') orderId: string,
  ) {
    const data = await this.shipperService.getOrderDetail(
      req.user._id.toString(),
      orderId,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== NHAN DON =====
  @Post('orders/:id/accept')
  async acceptOrder(
    @Request() req,
    @Param('id') orderId: string,
  ) {
    const data = await this.shipperService.acceptOrder(
      req.user._id.toString(),
      orderId,
    );
    return {
      success: true,
      message: `Da nhan don ${data.orderNumber}`,
      data,
    };
  }

  // ===== TU CHOI DON =====
  @Post('orders/:id/reject')
  async rejectOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() dto: RejectOrderDto,
  ) {
    const data = await this.shipperService.rejectOrder(
      req.user._id.toString(),
      orderId,
      dto.reason,
    );
    return {
      success: true,
      ...data,
    };
  }

  // ===== XAC NHAN DA GIAO (VOI ANH CHUNG MINH) =====
  @Post('orders/:id/deliver')
  async deliverOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() dto: DeliverOrderDto,
  ) {
    const data = await this.shipperService.updateDeliveryStatus(
      req.user._id.toString(),
      orderId,
      dto,
    );
    return {
      success: true,
      message: `Da giao don ${data.orderNumber} thanh cong`,
      data,
    };
  }

  // ===== CAP NHAT VI TRI GPS =====
  @Post('location')
  async updateLocation(
    @Request() req,
    @Body() dto: UpdateLocationDto,
  ) {
    const data = await this.locationService.updateLocation(
      req.user._id.toString(),
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== THONG KE =====
  @Get('stats')
  async getStats(
    @Request() req,
    @Query('period') period?: string,
  ) {
    const data = await this.shipperService.getStats(
      req.user._id.toString(),
      period,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== DOANH THU CHI TIET =====
  @Get('earnings')
  async getEarnings(
    @Request() req,
    @Query() query: QueryEarningsDto,
  ) {
    const data = await this.shipperService.getEarnings(
      req.user._id.toString(),
      query,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== TONG HOP COD =====
  @Get('cod-summary')
  async getCodSummary(@Request() req) {
    const data = await this.shipperService.getCodSummary(
      req.user._id.toString(),
    );
    return {
      success: true,
      data,
    };
  }

  // ===== CAP NHAT TRANG THAI (AVAILABLE/BUSY/OFFLINE) =====
  @Patch('status')
  async updateStatus(
    @Request() req,
    @Body() dto: UpdateShipperStatusDto,
  ) {
    const data = await this.locationService.updateStatus(
      req.user._id.toString(),
      dto.status,
    );
    return {
      success: true,
      message: `Trang thai da cap nhat thanh "${dto.status}"`,
      data,
    };
  }
}
```

---

## 7. AdminShipperController

```typescript
// ============================================================
// modules/shipper/admin-shipper.controller.ts
// ============================================================
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShipperService } from './shipper.service';
import { ShipperLocationService } from './shipper-location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  User,
  UserDocument,
} from '../../schemas/user.schema';
import {
  Order,
  OrderDocument,
} from '../../schemas/order.schema';
import { OrderStatus } from '../../enums/order-status.enum';
import { ShipperStatus } from '../../enums/shipper-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Controller('admin/shippers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminShipperController {
  constructor(
    private readonly shipperService: ShipperService,
    private readonly locationService: ShipperLocationService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  // ===== DANH SACH TAT CA SHIPPER =====
  @Get()
  async listShippers(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const conditions: any = { role: UserRole.SHIPPER };

    if (status) {
      conditions.shipperStatus = status;
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(conditions)
        .select(
          'fullName email phone avatar shipperStatus createdAt',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.userModel.countDocuments(conditions),
    ]);

    // Them thong ke cho moi shipper
    const shippersWithStats = await Promise.all(
      data.map(async (shipper) => {
        const [activeOrders, deliveredOrders] = await Promise.all([
          this.orderModel.countDocuments({
            shipperId: shipper._id,
            status: OrderStatus.SHIPPING,
          }),
          this.orderModel.countDocuments({
            shipperId: shipper._id,
            status: OrderStatus.DELIVERED,
          }),
        ]);
        return {
          ...shipper,
          activeOrders,
          deliveredOrders,
        };
      }),
    );

    return {
      success: true,
      data: shippersWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ===== VI TRI TAT CA SHIPPER DANG HOAT DONG (CHO BAN DO) =====
  @Get('locations')
  async getAllActiveLocations() {
    const data =
      await this.locationService.getAllActiveLocations();
    return {
      success: true,
      data,
    };
  }

  // ===== CHI TIET SHIPPER =====
  @Get(':id')
  async getShipperDetail(@Param('id') id: string) {
    const shipper = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id),
        role: UserRole.SHIPPER,
      })
      .select('-password')
      .lean();

    if (!shipper) {
      throw new NotFoundException('Shipper khong ton tai');
    }

    // Lay vi tri hien tai
    let currentLocation = null;
    try {
      currentLocation = await this.locationService.getLocation(id);
    } catch (e) {
      // Shipper chua bao gio cap nhat vi tri
    }

    // Lay thong ke
    const stats = await this.shipperService.getStats(id);

    return {
      success: true,
      data: {
        ...shipper,
        currentLocation,
        stats,
      },
    };
  }

  // ===== GAN DON THU CONG CHO SHIPPER =====
  @Post(':id/assign-order/:orderId')
  async assignOrder(
    @Param('id') shipperId: string,
    @Param('orderId') orderId: string,
  ) {
    // Kiem tra shipper ton tai va la SHIPPER
    const shipper = await this.userModel.findOne({
      _id: new Types.ObjectId(shipperId),
      role: UserRole.SHIPPER,
    });
    if (!shipper) {
      throw new NotFoundException('Shipper khong ton tai');
    }

    // Dung ShipperService.acceptOrder de dam bao cung logic
    const data = await this.shipperService.acceptOrder(
      shipperId,
      orderId,
    );

    return {
      success: true,
      message: `Da gan don ${data.orderNumber} cho shipper ${shipper.fullName}`,
      data,
    };
  }

  // ===== TIM SHIPPER GAN VI TRI =====
  @Get('nearby')
  async findNearbyShippers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5,
  ) {
    if (!lat || !lng) {
      throw new BadRequestException(
        'Can truyen toa do lat va lng',
      );
    }

    const data = await this.locationService.getNearbyShippers(
      Number(lat),
      Number(lng),
      Number(radius),
    );

    return {
      success: true,
      data,
      meta: {
        searchCenter: { lat: Number(lat), lng: Number(lng) },
        radiusKm: Number(radius),
        found: data.length,
      },
    };
  }
}
```

---

## 8. Bang API Endpoints

### Shipper Endpoints (role: SHIPPER)

| # | Method | Endpoint | Mo ta |
|---|--------|----------|-------|
| 1 | `GET` | `/shipper/orders/available` | Don hang cho nhan (chua co shipper) |
| 2 | `GET` | `/shipper/orders/my-orders` | Don hang cua toi (active + lich su) |
| 3 | `GET` | `/shipper/orders/:id` | Chi tiet don hang |
| 4 | `POST` | `/shipper/orders/:id/accept` | Nhan don hang |
| 5 | `POST` | `/shipper/orders/:id/reject` | Tu choi don hang |
| 6 | `POST` | `/shipper/orders/:id/deliver` | Xac nhan da giao (kem anh chung minh) |
| 7 | `POST` | `/shipper/location` | Cap nhat vi tri GPS |
| 8 | `GET` | `/shipper/stats` | Thong ke tong quat |
| 9 | `GET` | `/shipper/earnings` | Doanh thu chi tiet theo ngay/tuan/thang |
| 10 | `GET` | `/shipper/cod-summary` | Tong hop COD can quyet toan |
| 11 | `PATCH` | `/shipper/status` | Cap nhat trang thai (available/busy/offline) |

### Admin Shipper Endpoints (role: ADMIN)

| # | Method | Endpoint | Mo ta |
|---|--------|----------|-------|
| 12 | `GET` | `/admin/shippers` | Danh sach tat ca shipper |
| 13 | `GET` | `/admin/shippers/locations` | Vi tri tat ca shipper (cho ban do) |
| 14 | `GET` | `/admin/shippers/:id` | Chi tiet shipper + vi tri + thong ke |
| 15 | `POST` | `/admin/shippers/:id/assign-order/:orderId` | Gan don thu cong cho shipper |
| 16 | `GET` | `/admin/shippers/nearby?lat=&lng=&radius=` | Tim shipper gan vi tri |

---

## 9. Vi du Request/Response

### 9.1. Don hang cho nhan (Shipper)

**Request:**

```http
GET /shipper/orders/available
Authorization: Bearer <shipper_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6615d5e6f7a8b9c0d1e2f3a4",
      "orderNumber": "FV-20260402-0003",
      "shippingAddress": {
        "fullName": "Nguyen Van B",
        "phone": "0901234567",
        "street": "123 Nguyen Hue",
        "ward": "Ben Nghe",
        "district": "Quan 1",
        "province": "Ho Chi Minh"
      },
      "totalAmount": 8500000,
      "paymentMethod": "cod",
      "paymentStatus": "pending",
      "items": [
        {
          "productId": {
            "_id": "6615a2b3c4d5e6f7a8b9c0d1",
            "name": "Sofa go oc cho chu L",
            "images": ["https://drive.google.com/uc?id=abc123&export=view"]
          },
          "quantity": 1
        }
      ],
      "createdAt": "2026-04-02T08:00:00.000Z"
    }
  ]
}
```

### 9.2. Nhan don hang (Shipper)

**Request:**

```http
POST /shipper/orders/6615d5e6f7a8b9c0d1e2f3a4/accept
Authorization: Bearer <shipper_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da nhan don FV-20260402-0003",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0003",
    "status": "shipping",
    "shipperId": "6615c1d2e3f4a5b6c7d8e9f0",
    "shippingAddress": {
      "fullName": "Nguyen Van B",
      "phone": "0901234567",
      "street": "123 Nguyen Hue",
      "ward": "Ben Nghe",
      "district": "Quan 1",
      "province": "Ho Chi Minh"
    },
    "totalAmount": 8500000,
    "paymentMethod": "cod"
  }
}
```

### 9.3. Tu choi don hang (Shipper)

**Request:**

```http
POST /shipper/orders/6615d5e6f7a8b9c0d1e2f3a4/reject
Authorization: Bearer <shipper_jwt_token>
Content-Type: application/json
```

```json
{
  "reason": "Dia chi giao qua xa, khong kip giao trong ngay"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da tu choi don FV-20260402-0003",
  "reason": "Dia chi giao qua xa, khong kip giao trong ngay"
}
```

### 9.4. Xac nhan da giao (Shipper, voi anh chung minh)

**Request:**

```http
POST /shipper/orders/6615d5e6f7a8b9c0d1e2f3a4/deliver
Authorization: Bearer <shipper_jwt_token>
Content-Type: application/json
```

```json
{
  "proofImage": "https://drive.google.com/uc?id=proof123&export=view",
  "note": "Giao tai cong chinh, nguoi nhan la bao ve toa nha"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da giao don FV-20260402-0003 thanh cong",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0003",
    "status": "delivered",
    "deliveredAt": "2026-04-02T14:30:00.000Z",
    "deliveryProofImage": "https://drive.google.com/uc?id=proof123&export=view",
    "deliveryNote": "Giao tai cong chinh, nguoi nhan la bao ve toa nha",
    "paymentStatus": "paid"
  }
}
```

### 9.5. Cap nhat vi tri GPS (Shipper)

**Request:**

```http
POST /shipper/location
Authorization: Bearer <shipper_jwt_token>
Content-Type: application/json
```

```json
{
  "lat": 10.7769,
  "lng": 106.7009,
  "accuracy": 15,
  "currentOrderId": "6615d5e6f7a8b9c0d1e2f3a4"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6615h1i2j3k4l5m6n7o8p9q0",
    "shipperId": "6615c1d2e3f4a5b6c7d8e9f0",
    "location": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    },
    "accuracy": 15,
    "currentOrderId": "6615d5e6f7a8b9c0d1e2f3a4",
    "status": "busy",
    "updatedAt": "2026-04-02T14:15:00.000Z"
  }
}
```

### 9.6. Thong ke shipper

**Request:**

```http
GET /shipper/stats?period=month
Authorization: Bearer <shipper_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalOrders": 47,
    "totalEarnings": 2820000,
    "totalCodCollected": 156000000,
    "completionRate": 94,
    "totalAssigned": 50,
    "totalDelivered": 47
  }
}
```

### 9.7. Doanh thu chi tiet (Shipper)

**Request:**

```http
GET /shipper/earnings?groupBy=day&startDate=2026-04-01&endDate=2026-04-02
Authorization: Bearer <shipper_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "groupBy": "day",
    "startDate": "2026-04-01T00:00:00.000Z",
    "endDate": "2026-04-02T00:00:00.000Z",
    "earnings": [
      {
        "_id": "2026-04-02",
        "totalOrders": 5,
        "totalEarnings": 300000,
        "totalCodCollected": 42500000
      },
      {
        "_id": "2026-04-01",
        "totalOrders": 3,
        "totalEarnings": 180000,
        "totalCodCollected": 25600000
      }
    ],
    "summary": {
      "totalOrders": 8,
      "totalEarnings": 480000,
      "totalCodCollected": 68100000
    }
  }
}
```

### 9.8. Tong hop COD (Shipper)

**Request:**

```http
GET /shipper/cod-summary
Authorization: Bearer <shipper_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalOrders": 3,
    "totalCodToSettle": 25600000,
    "orders": [
      {
        "_id": "6615d5e6f7a8b9c0d1e2f3a4",
        "orderNumber": "FV-20260402-0003",
        "totalAmount": 8500000,
        "deliveredAt": "2026-04-02T14:30:00.000Z"
      },
      {
        "_id": "6615d6f7a8b9c0d1e2f3a4b5",
        "orderNumber": "FV-20260402-0005",
        "totalAmount": 12100000,
        "deliveredAt": "2026-04-02T16:00:00.000Z"
      },
      {
        "_id": "6615d7a8b9c0d1e2f3a4b5c6",
        "orderNumber": "FV-20260401-0012",
        "totalAmount": 5000000,
        "deliveredAt": "2026-04-01T17:20:00.000Z"
      }
    ]
  }
}
```

### 9.9. Admin: Danh sach shipper

**Request:**

```http
GET /admin/shippers?status=available&page=1&limit=10
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6615c1d2e3f4a5b6c7d8e9f0",
      "fullName": "Tran Van Shipper",
      "email": "shipper1@noithatvn.com",
      "phone": "0912345678",
      "avatar": "https://drive.google.com/uc?id=avatar1&export=view",
      "shipperStatus": "available",
      "createdAt": "2026-03-15T08:00:00.000Z",
      "activeOrders": 0,
      "deliveredOrders": 47
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 9.10. Admin: Vi tri tat ca shipper (cho ban do)

**Request:**

```http
GET /admin/shippers/locations
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6615h1i2j3k4l5m6n7o8p9q0",
      "shipperId": {
        "_id": "6615c1d2e3f4a5b6c7d8e9f0",
        "fullName": "Tran Van Shipper",
        "phone": "0912345678",
        "avatar": "https://drive.google.com/uc?id=avatar1&export=view"
      },
      "location": {
        "type": "Point",
        "coordinates": [106.7009, 10.7769]
      },
      "accuracy": 15,
      "status": "available",
      "currentOrderId": null,
      "updatedAt": "2026-04-02T14:15:00.000Z"
    },
    {
      "_id": "6615h2j3k4l5m6n7o8p9q0r1",
      "shipperId": {
        "_id": "6615c2e3f4a5b6c7d8e9f0g1",
        "fullName": "Le Thi Giao Hang",
        "phone": "0923456789",
        "avatar": null
      },
      "location": {
        "type": "Point",
        "coordinates": [106.6523, 10.8012]
      },
      "accuracy": 10,
      "status": "busy",
      "currentOrderId": "6615d8b9c0d1e2f3a4b5c6d7",
      "updatedAt": "2026-04-02T14:20:00.000Z"
    }
  ]
}
```

### 9.11. Admin: Tim shipper gan vi tri

**Request:**

```http
GET /admin/shippers/nearby?lat=10.7769&lng=106.7009&radius=3
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6615h1i2j3k4l5m6n7o8p9q0",
      "shipperId": {
        "_id": "6615c1d2e3f4a5b6c7d8e9f0",
        "fullName": "Tran Van Shipper",
        "phone": "0912345678",
        "avatar": "https://drive.google.com/uc?id=avatar1&export=view"
      },
      "location": {
        "type": "Point",
        "coordinates": [106.7009, 10.7769]
      },
      "status": "available",
      "distanceKm": 0.12
    }
  ],
  "meta": {
    "searchCenter": { "lat": 10.7769, "lng": 106.7009 },
    "radiusKm": 3,
    "found": 1
  }
}
```

### 9.12. Admin: Gan don thu cong cho shipper

**Request:**

```http
POST /admin/shippers/6615c1d2e3f4a5b6c7d8e9f0/assign-order/6615d5e6f7a8b9c0d1e2f3a4
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da gan don FV-20260402-0003 cho shipper Tran Van Shipper",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0003",
    "status": "shipping",
    "shipperId": "6615c1d2e3f4a5b6c7d8e9f0"
  }
}
```

---

> **Ghi chu quan trong:**
>
> 1. **2 Controller trong 1 module:** `ShipperController` (prefix `/shipper`) dung cho shipper app, `AdminShipperController` (prefix `/admin/shippers`) dung cho admin dashboard. Ca 2 cung dung ShipperService va ShipperLocationService.
>
> 2. **GeoJSON format:** MongoDB 2dsphere yeu cau format `[longitude, latitude]` (KHONG phai `[lat, lng]`). DTO nhan `lat, lng` rieng roi service chuyen thanh `coordinates: [lng, lat]`.
>
> 3. **currentOrderId trong location:** [FIXED] Truong nay truoc day bi thieu, khien frontend khong hien thi duoc vi tri shipper tren tracking map cua khach hang. Bay gio moi lan shipper cap nhat GPS, se gui kem currentOrderId.
>
> 4. **TTL Index:** ShipperLocation co TTL 24h (`expireAfterSeconds: 86400`). Vi tri cua shipper offline qua 24h se tu dong bi xoa boi MongoDB.
>
> 5. **1 shipper = 1 don:** Moi shipper chi duoc giao 1 don tai mot thoi diem. Phai hoan thanh don hien tai truoc khi nhan don moi. Logic nay duoc kiem tra trong `acceptOrder()`.
>
> 6. **Socket.IO events:**
> ```
> order:shipper-assigned  -> Khi shipper nhan don (thong bao khach hang)
> order:shipper-rejected  -> Khi shipper tu choi (thong bao admin)
> order:delivered          -> Khi giao thanh cong (thong bao khach hang)
> ```
