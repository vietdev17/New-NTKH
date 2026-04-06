# ORDERS MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module QUAN TRONG NHAT - Quan ly don hang, thanh toan, van chuyen, tra hang/hoan tien
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [Constants - Phi van chuyen](#3-constants---phi-van-chuyen)
4. [DTOs](#4-dtos)
5. [Orders Service](#5-orders-service)
6. [Returns Service](#6-returns-service)
7. [Orders Controller](#7-orders-controller)
8. [Bang API Endpoints](#8-bang-api-endpoints)
9. [Vi du Request/Response](#9-vi-du-requestresponse)

---

## 1. Tong quan

Module Orders la module phuc tap nhat trong he thong, xu ly:

**Don hang:**
- Tao don tu website (customer) va POS (staff)
- Validate san pham, bien the, ton kho
- Reserve stock bang MongoDB transaction (atomic)
- Tinh phi van chuyen theo tinh/thanh pho
- Ap dung coupon giam gia
- Sinh ma don hang FV-YYYYMMDD-XXXX
- Cap nhat trang thai don voi validation chuyen trang thai
- Gan shipper, huy don, xac nhan thanh toan chuyen khoan
- Phat Socket.IO event realtime

**Tra hang / Hoan tien:**
- Tao yeu cau tra hang (trong 7 ngay tu khi giao)
- Admin duyet/tu choi tra hang
- Xu ly hoan tien, cap nhat ton kho

**Schemas su dung:**
- Order (xem `02-database/01-schemas.md` muc 5)
- Return (xem `02-database/01-schemas.md` muc 12)
- Product (muc 4), User (muc 2)

---

## 2. Cau truc module

```
src/modules/orders/
  ├── orders.module.ts
  ├── orders.service.ts
  ├── orders.controller.ts
  ├── returns.service.ts
  ├── constants/
  │   └── shipping-fees.constant.ts
  ├── helpers/
  │   └── order-number.helper.ts
  └── dto/
      ├── create-order.dto.ts
      ├── create-pos-order.dto.ts
      ├── update-order-status.dto.ts
      ├── cancel-order.dto.ts
      ├── create-return.dto.ts
      ├── query-order.dto.ts
      └── query-return.dto.ts
```

### orders.module.ts

```typescript
// ============================================================
// modules/orders/orders.module.ts
// ============================================================
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Return, ReturnSchema } from '../../schemas/return.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { OrdersService } from './orders.service';
import { ReturnsService } from './returns.service';
import { OrdersController } from './orders.controller';
import { CouponsModule } from '../coupons/coupons.module';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Return.name, schema: ReturnSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => CouponsModule),
    SocketModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ReturnsService],
  exports: [OrdersService, ReturnsService],
})
export class OrdersModule {}
```

---

## 3. Constants - Phi van chuyen

```typescript
// ============================================================
// modules/orders/constants/shipping-fees.constant.ts
// ============================================================

// Phi van chuyen theo khu vuc (don vi: VND)
// Co the cau hinh lai tu admin dashboard trong phien ban sau

export const SHIPPING_FEES = {
  // Noi thanh HCM va Ha Noi - mien phi hoac phi thap
  HCM_HN: 30000,

  // Mien Nam (ngoai HCM): Binh Duong, Dong Nai, Long An, Can Tho, ...
  MIEN_NAM: 50000,

  // Mien Bac (ngoai HN): Hai Phong, Quang Ninh, Bac Ninh, ...
  MIEN_BAC: 50000,

  // Mien Trung: Da Nang, Hue, Quang Nam, Khanh Hoa, ...
  MIEN_TRUNG: 60000,
};

// Danh sach tinh/thanh theo khu vuc
export const PROVINCE_REGIONS: Record<string, keyof typeof SHIPPING_FEES> = {
  // === HCM & Ha Noi ===
  'Ho Chi Minh': 'HCM_HN',
  'Ha Noi': 'HCM_HN',

  // === Mien Nam ===
  'Binh Duong': 'MIEN_NAM',
  'Dong Nai': 'MIEN_NAM',
  'Long An': 'MIEN_NAM',
  'Ba Ria - Vung Tau': 'MIEN_NAM',
  'Tay Ninh': 'MIEN_NAM',
  'Binh Phuoc': 'MIEN_NAM',
  'Can Tho': 'MIEN_NAM',
  'An Giang': 'MIEN_NAM',
  'Kien Giang': 'MIEN_NAM',
  'Tien Giang': 'MIEN_NAM',
  'Ben Tre': 'MIEN_NAM',
  'Vinh Long': 'MIEN_NAM',
  'Dong Thap': 'MIEN_NAM',
  'Tra Vinh': 'MIEN_NAM',
  'Soc Trang': 'MIEN_NAM',
  'Hau Giang': 'MIEN_NAM',
  'Bac Lieu': 'MIEN_NAM',
  'Ca Mau': 'MIEN_NAM',
  'Lam Dong': 'MIEN_NAM',
  'Binh Thuan': 'MIEN_NAM',
  'Ninh Thuan': 'MIEN_NAM',

  // === Mien Bac ===
  'Hai Phong': 'MIEN_BAC',
  'Quang Ninh': 'MIEN_BAC',
  'Bac Ninh': 'MIEN_BAC',
  'Hai Duong': 'MIEN_BAC',
  'Hung Yen': 'MIEN_BAC',
  'Vinh Phuc': 'MIEN_BAC',
  'Bac Giang': 'MIEN_BAC',
  'Thai Nguyen': 'MIEN_BAC',
  'Phu Tho': 'MIEN_BAC',
  'Nam Dinh': 'MIEN_BAC',
  'Thai Binh': 'MIEN_BAC',
  'Ninh Binh': 'MIEN_BAC',
  'Ha Nam': 'MIEN_BAC',
  'Hoa Binh': 'MIEN_BAC',
  'Son La': 'MIEN_BAC',
  'Lai Chau': 'MIEN_BAC',
  'Dien Bien': 'MIEN_BAC',
  'Lao Cai': 'MIEN_BAC',
  'Yen Bai': 'MIEN_BAC',
  'Tuyen Quang': 'MIEN_BAC',
  'Ha Giang': 'MIEN_BAC',
  'Cao Bang': 'MIEN_BAC',
  'Bac Kan': 'MIEN_BAC',
  'Lang Son': 'MIEN_BAC',

  // === Mien Trung ===
  'Da Nang': 'MIEN_TRUNG',
  'Thua Thien Hue': 'MIEN_TRUNG',
  'Quang Nam': 'MIEN_TRUNG',
  'Quang Ngai': 'MIEN_TRUNG',
  'Binh Dinh': 'MIEN_TRUNG',
  'Phu Yen': 'MIEN_TRUNG',
  'Khanh Hoa': 'MIEN_TRUNG',
  'Quang Binh': 'MIEN_TRUNG',
  'Quang Tri': 'MIEN_TRUNG',
  'Ha Tinh': 'MIEN_TRUNG',
  'Nghe An': 'MIEN_TRUNG',
  'Thanh Hoa': 'MIEN_TRUNG',
  'Kon Tum': 'MIEN_TRUNG',
  'Gia Lai': 'MIEN_TRUNG',
  'Dak Lak': 'MIEN_TRUNG',
  'Dak Nong': 'MIEN_TRUNG',
};

// ===== HAM TINH PHI VAN CHUYEN =====
export function calculateShippingFee(province: string): number {
  const region = PROVINCE_REGIONS[province];

  if (!region) {
    // Mac dinh mien Trung neu khong tim thay (phi cao nhat)
    return SHIPPING_FEES.MIEN_TRUNG;
  }

  return SHIPPING_FEES[region];
}
```

---

## 4. DTOs

### create-order.dto.ts

```typescript
// ============================================================
// modules/orders/dto/create-order.dto.ts
// ============================================================
import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  ArrayMinSize,
  IsMongoId,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../enums/payment-method.enum';

export class OrderItemDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @IsOptional()
  @IsString()
  variantSku?: string; // null = san pham khong co bien the, dung basePrice

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'So luong phai >= 1' })
  quantity: number;
}

export class ShippingAddressDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  ward: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  province: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Don hang phai co it nhat 1 san pham' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsNotEmpty()
  @IsEnum(PaymentMethod, { message: 'Phuong thuc thanh toan khong hop le' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
```

### create-pos-order.dto.ts

```typescript
// ============================================================
// modules/orders/dto/create-pos-order.dto.ts
// ============================================================
import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../enums/payment-method.enum';

export class PosOrderItemDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @IsOptional()
  @IsString()
  variantSku?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePosOrderDto {
  @IsOptional()
  @IsMongoId()
  customerId?: string; // Co the khong co neu khach vang lai

  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @IsNotEmpty()
  @IsEnum(PaymentMethod, { message: 'Phuong thuc thanh toan: cash | bank_transfer' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashReceived?: number; // Tien khach dua (voi cash)

  @IsOptional()
  @IsString()
  note?: string;
}
```

### update-order-status.dto.ts

```typescript
// ============================================================
// modules/orders/dto/update-order-status.dto.ts
// ============================================================
import { IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus, { message: 'Trang thai don hang khong hop le' })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  deliveryProofImage?: string; // Bat buoc khi chuyen sang DELIVERED
}
```

### cancel-order.dto.ts

```typescript
// ============================================================
// modules/orders/dto/cancel-order.dto.ts
// ============================================================
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @IsNotEmpty({ message: 'Ly do huy don khong duoc de trong' })
  @IsString()
  @MaxLength(500)
  reason: string;
}
```

### create-return.dto.ts

```typescript
// ============================================================
// modules/orders/dto/create-return.dto.ts
// ============================================================
import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsInt,
  Min,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnReason } from '../../../enums/return-reason.enum';

export class ReturnItemDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @IsOptional()
  @IsString()
  variantSku?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(ReturnReason, { message: 'Ly do tra hang khong hop le' })
  reason: ReturnReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateReturnDto {
  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Phai co it nhat 1 san pham tra hang' })
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNote?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
```

### query-order.dto.ts

```typescript
// ============================================================
// modules/orders/dto/query-order.dto.ts
// ============================================================
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../enums/order-status.enum';
import { PaymentStatus } from '../../../enums/payment-status.enum';

export class QueryOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  search?: string; // Tim theo orderNumber, customerName, customerPhone

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

### query-return.dto.ts

```typescript
// ============================================================
// modules/orders/dto/query-return.dto.ts
// ============================================================
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnStatus } from '../../../enums/return-status.enum';

export class QueryReturnDto {
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

---

## 5. Orders Service

```typescript
// ============================================================
// modules/orders/orders.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { OrderStatus } from '../../enums/order-status.enum';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { PaymentStatus } from '../../enums/payment-status.enum';
import { UserRole } from '../../enums/user-role.enum';
import { CouponsService } from '../coupons/coupons.service';
import { SocketGateway } from '../socket/socket.gateway';
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
  ) {}

  // ================================================================
  // TAO DON HANG (CUSTOMER - TU WEBSITE)
  // ================================================================
  async create(
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderDocument> {
    // ----- Bat dau MongoDB session (transaction) -----
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // ----- 1. Lay thong tin customer -----
      const customer = await this.userModel
        .findById(customerId)
        .session(session);

      if (!customer) {
        throw new NotFoundException('Khong tim thay khach hang');
      }

      // ----- 2. Validate va tinh gia tung item -----
      const orderItems = [];
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

        let unitPrice = product.basePrice;
        let variantInfo = { colorName: null, dimensionLabel: null };
        let productImage = product.images?.[0] || null;

        // Neu co variant (SKU)
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

          // Kiem tra ton kho
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
            {
              $inc: { 'variants.$.stock': -item.quantity },
            },
            { session },
          );

          unitPrice = variant.price;
          productImage = variant.image || productImage;

          // Lay thong tin mau + kich thuoc
          const color = product.colors?.find(
            (c) => c.id === variant.colorId,
          );
          const dimension = product.dimensions?.find(
            (d) => d.id === variant.dimensionId,
          );
          variantInfo = {
            colorName: color?.name || null,
            dimensionLabel: dimension?.label || null,
          };
        } else {
          // San pham khong co bien the - kiem tra ton kho tong
          const totalStock = product.variants?.reduce(
            (sum, v) => sum + v.stock,
            0,
          ) || 0;

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

      // ----- 3. Tinh phi van chuyen -----
      const shippingFee = calculateShippingFee(dto.shippingAddress.province);

      // ----- 4. Ap dung coupon (neu co) -----
      let discountAmount = 0;
      let discountReason = null;

      if (dto.couponCode) {
        try {
          const couponResult = await this.couponsService.validateAndApply(
            dto.couponCode,
            customerId,
            subtotal,
            orderItems.map((i) => i.productId.toString()),
          );

          discountAmount = couponResult.discountAmount;
          discountReason = `Ma giam gia: ${dto.couponCode.toUpperCase()}`;
        } catch (error) {
          throw new BadRequestException(
            `Ma giam gia khong hop le: ${error.message}`,
          );
        }
      }

      // ----- 5. Tinh tong cong -----
      const total = subtotal - discountAmount + shippingFee;

      // ----- 6. Sinh ma don hang -----
      const orderNumber = await this.generateOrderNumber(session);

      // ----- 7. Tao don hang -----
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
            paymentStatus:
              dto.paymentMethod === PaymentMethod.CASH
                ? PaymentStatus.PENDING
                : PaymentStatus.PENDING,
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

      // ----- 8. Commit transaction -----
      await session.commitTransaction();

      // ----- 9. Emit Socket.IO event -----
      this.socketGateway.server.emit('order:created', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.customerName,
        status: order.status,
      });

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
      // Validate items va tinh gia (tuong tu create nhung don gian hon)
      const orderItems = [];
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

        let unitPrice = product.basePrice;
        let variantInfo = { colorName: null, dimensionLabel: null };
        let productImage = product.images?.[0] || null;

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

          const color = product.colors?.find((c) => c.id === variant.colorId);
          const dimension = product.dimensions?.find(
            (d) => d.id === variant.dimensionId,
          );
          variantInfo = {
            colorName: color?.name || null,
            dimensionLabel: dimension?.label || null,
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
      let discountReason = null;

      if (dto.couponCode) {
        try {
          const couponResult = await this.couponsService.validateAndApply(
            dto.couponCode,
            dto.customerId || null,
            subtotal,
            orderItems.map((i) => i.productId.toString()),
          );
          discountAmount = couponResult.discountAmount;
          discountReason = `Ma giam gia POS: ${dto.couponCode.toUpperCase()}`;
        } catch (error) {
          throw new BadRequestException(`Ma giam gia loi: ${error.message}`);
        }
      }

      // POS: khong co phi van chuyen
      const total = subtotal - discountAmount;

      // Tinh tien thua (voi thanh toan tien mat)
      let changeAmount = null;
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

      this.socketGateway.server.emit('order:created', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.customerName,
        status: order.status,
        isPosOrder: true,
      });

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
      this.orderModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      items,
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

    return order;
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
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ================================================================
  // CAP NHAT TRANG THAI DON HANG
  // ================================================================
  // Quy tac chuyen trang thai:
  //   PENDING      -> CONFIRMED     (admin)
  //   CONFIRMED    -> PREPARING     (admin/staff)
  //   PREPARING    -> SHIPPING      (admin/staff - doi ten tu WAITING_PICKUP)
  //   SHIPPING     -> DELIVERED     (shipper - can deliveryProofImage)
  //   Any          -> CANCELLED     (admin, hoac customer neu PENDING)
  //   DELIVERED    -> RETURNED      (admin - sau khi duyet return)
  //   RETURNED     -> (xu ly boi ReturnsService)
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

    const currentStatus = order.status;
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
      order.deliveredAt = new Date();
      order.deliveryProofImage = dto.deliveryProofImage;
      // COD: cap nhat thanh toan khi giao thanh cong
      if (order.paymentMethod === PaymentMethod.COD) {
        order.paymentStatus = PaymentStatus.PAID;
      }
    }

    if (newStatus === OrderStatus.CANCELLED) {
      order.cancelReason = dto.note || 'Khong ro ly do';
    }

    await order.save();

    // Emit Socket.IO event
    this.socketGateway.server.emit('order:statusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: newStatus,
      customerId: order.customerId?.toString(),
    });

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
      [OrderStatus.PREPARING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.RETURNED]: [], // Xu ly boi ReturnsService
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[current]?.includes(next)) {
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

    // SHIPPING -> DELIVERED: chi shipper duoc gan cho don nay
    if (
      current === OrderStatus.SHIPPING &&
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

    order.shipperId = new Types.ObjectId(shipperId);
    order.shipperName = shipper.fullName;
    order.shipperPhone = shipper.phone;

    await order.save();

    // Emit Socket.IO cho shipper
    this.socketGateway.server
      .to(`shipper:${shipperId}`)
      .emit('order:assigned', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        shippingAddress: `${order.shippingStreet}, ${order.shippingWard}, ${order.shippingDistrict}, ${order.shippingProvince}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      });

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
        if (item.variantSku) {
          await this.productModel.updateOne(
            {
              _id: item.productId,
              'variants.sku': item.variantSku,
            },
            {
              $inc: { 'variants.$.stock': item.quantity },
            },
            { session },
          );
        }
      }

      order.status = OrderStatus.CANCELLED;
      order.cancelReason = dto.reason;
      order.statusHistory.push({
        status: OrderStatus.CANCELLED,
        changedBy: new Types.ObjectId(userId),
        changedAt: new Date(),
        note: `Huy don: ${dto.reason}`,
      } as any);

      await order.save({ session });
      await session.commitTransaction();

      // Emit event
      this.socketGateway.server.emit('order:cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });

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

    if (order.bankTransferConfirmed) {
      throw new BadRequestException('Da xac nhan chuyen khoan truoc do');
    }

    order.bankTransferConfirmed = true;
    order.bankTransferConfirmedBy = new Types.ObjectId(adminId);
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
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [statusCounts, todayRevenue, weekRevenue, monthRevenue, totalOrders] =
      await Promise.all([
        // Dem theo trang thai
        this.orderModel.aggregate([
          { $match: { isDeleted: false } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Doanh thu hom nay
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
        // Doanh thu tuan nay
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
        // Doanh thu thang nay
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
        // Tong don hang
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
      .lean();
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

    // Tim don hang cuoi cung trong ngay
    const lastOrder = await this.orderModel
      .findOne({ orderNumber: { $regex: `^${prefix}` } })
      .sort({ orderNumber: -1 })
      .select('orderNumber')
      .session(session || null)
      .lean();

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
```

---

## 6. Returns Service

```typescript
// ============================================================
// modules/orders/returns.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Return, ReturnDocument } from '../../schemas/return.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { OrderStatus } from '../../enums/order-status.enum';
import { PaymentStatus } from '../../enums/payment-status.enum';
import { ReturnStatus } from '../../enums/return-status.enum';
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
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24),
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
          (oi.variantSku || null) === (returnItem.variantSku || null),
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
      status: { $in: [ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.PROCESSING] },
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
          (oi.variantSku || null) === (returnItem.variantSku || null),
      );
      refundAmount += orderItem.unitPrice * returnItem.quantity;
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
      status: ReturnStatus.PENDING,
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
      items,
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
      .lean();
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

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException(
        'Chi duoc duyet yeu cau o trang thai PENDING',
      );
    }

    returnRequest.status = ReturnStatus.APPROVED;
    returnRequest.processedBy = new Types.ObjectId(adminId);
    returnRequest.processedAt = new Date();

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

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException(
        'Chi duoc tu choi yeu cau o trang thai PENDING',
      );
    }

    returnRequest.status = ReturnStatus.REJECTED;
    returnRequest.adminNote = reason;
    returnRequest.processedBy = new Types.ObjectId(adminId);
    returnRequest.processedAt = new Date();

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
        if (item.variantSku) {
          await this.productModel.updateOne(
            {
              _id: item.productId,
              'variants.sku': item.variantSku,
            },
            {
              $inc: { 'variants.$.stock': item.quantity },
            },
            { session },
          );
        }
      }

      // 2. Cap nhat trang thai return
      returnRequest.status = ReturnStatus.COMPLETED;
      returnRequest.refundMethod = 'bank_transfer';
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
      const lastSeq = parseInt(lastReturn.returnNumber.split('-')[2], 10);
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}
```

---

## 7. Orders Controller

```typescript
// ============================================================
// modules/orders/orders.controller.ts
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
import { OrdersService } from './orders.service';
import { ReturnsService } from './returns.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryReturnDto } from './dto/query-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly returnsService: ReturnsService,
  ) {}

  // =================================================================
  // DON HANG
  // =================================================================

  // ===== TAO DON HANG (CUSTOMER) =====
  @Post('orders')
  @Roles(UserRole.CUSTOMER)
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(req.user._id, dto);
    return {
      success: true,
      message: 'Tao don hang thanh cong',
      data: order,
    };
  }

  // ===== TAO DON POS (STAFF) =====
  @Post('orders/pos')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createPosOrder(@Request() req, @Body() dto: CreatePosOrderDto) {
    const order = await this.ordersService.createPosOrder(req.user._id, dto);
    return {
      success: true,
      message: 'Tao don POS thanh cong',
      data: order,
    };
  }

  // ===== DANH SACH DON HANG (ADMIN) =====
  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Query() query: QueryOrderDto) {
    const result = await this.ordersService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== DON HANG CUA TOI (CUSTOMER) =====
  @Get('orders/my-orders')
  @Roles(UserRole.CUSTOMER)
  async findMyOrders(@Request() req, @Query() query: QueryOrderDto) {
    const result = await this.ordersService.findMyOrders(req.user._id, query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== DON HANG GAN DAY (ADMIN DASHBOARD) =====
  @Get('orders/recent')
  @Roles(UserRole.ADMIN)
  async getRecentOrders(@Query('limit') limit?: number) {
    const orders = await this.ordersService.getRecentOrders(limit || 10);
    return {
      success: true,
      data: orders,
    };
  }

  // ===== THONG KE DON HANG (ADMIN) =====
  @Get('orders/stats')
  @Roles(UserRole.ADMIN)
  async getOrderStats() {
    const stats = await this.ordersService.getOrderStats();
    return {
      success: true,
      data: stats,
    };
  }

  // ===== CHI TIET DON HANG =====
  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  async findById(@Param('id') id: string, @Request() req) {
    const order = await this.ordersService.findById(id);

    // Customer chi xem don cua minh
    if (
      req.user.role === UserRole.CUSTOMER &&
      order.customerId?.toString() !== req.user._id.toString()
    ) {
      return { success: false, message: 'Khong co quyen xem don nay' };
    }

    return {
      success: true,
      data: order,
    };
  }

  // ===== CAP NHAT TRANG THAI DON HANG =====
  @Patch('orders/:id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SHIPPER, UserRole.CUSTOMER)
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      req.user._id,
      req.user.role,
      dto,
    );
    return {
      success: true,
      message: `Cap nhat trang thai thanh cong: ${dto.status}`,
      data: order,
    };
  }

  // ===== GAN SHIPPER =====
  @Post('orders/:id/assign-shipper')
  @Roles(UserRole.ADMIN)
  async assignShipper(
    @Param('id') id: string,
    @Body('shipperId') shipperId: string,
  ) {
    const order = await this.ordersService.assignShipper(id, shipperId);
    return {
      success: true,
      message: `Da gan shipper ${order.shipperName} cho don ${order.orderNumber}`,
      data: order,
    };
  }

  // ===== HUY DON HANG =====
  @Post('orders/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  async cancelOrder(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: CancelOrderDto,
  ) {
    const order = await this.ordersService.cancelOrder(
      id,
      req.user._id,
      dto,
    );
    return {
      success: true,
      message: 'Da huy don hang',
      data: order,
    };
  }

  // ===== XAC NHAN CHUYEN KHOAN =====
  @Post('orders/:id/confirm-payment')
  @Roles(UserRole.ADMIN)
  async confirmBankTransfer(@Param('id') id: string, @Request() req) {
    const order = await this.ordersService.confirmBankTransfer(
      id,
      req.user._id,
    );
    return {
      success: true,
      message: 'Da xac nhan chuyen khoan ngan hang',
      data: order,
    };
  }

  // =================================================================
  // TRA HANG / HOAN TIEN
  // =================================================================

  // ===== TAO YEU CAU TRA HANG (CUSTOMER) =====
  @Post('returns')
  @Roles(UserRole.CUSTOMER)
  async createReturn(@Request() req, @Body() dto: CreateReturnDto) {
    const returnRequest = await this.returnsService.createReturn(
      req.user._id,
      dto,
    );
    return {
      success: true,
      message: 'Tao yeu cau tra hang thanh cong',
      data: returnRequest,
    };
  }

  // ===== DANH SACH TRA HANG (ADMIN) =====
  @Get('returns')
  @Roles(UserRole.ADMIN)
  async getReturns(@Query() query: QueryReturnDto) {
    const result = await this.returnsService.getReturns(query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== YEU CAU TRA HANG CUA TOI (CUSTOMER) =====
  @Get('returns/my-returns')
  @Roles(UserRole.CUSTOMER)
  async getMyReturns(@Request() req) {
    const returns = await this.returnsService.getMyReturns(req.user._id);
    return {
      success: true,
      data: returns,
    };
  }

  // ===== DUYET TRA HANG (ADMIN) =====
  @Patch('returns/:id/approve')
  @Roles(UserRole.ADMIN)
  async approveReturn(@Param('id') id: string, @Request() req) {
    const returnRequest = await this.returnsService.approveReturn(
      id,
      req.user._id,
    );
    return {
      success: true,
      message: 'Da duyet yeu cau tra hang',
      data: returnRequest,
    };
  }

  // ===== TU CHOI TRA HANG (ADMIN) =====
  @Patch('returns/:id/reject')
  @Roles(UserRole.ADMIN)
  async rejectReturn(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    const returnRequest = await this.returnsService.rejectReturn(
      id,
      req.user._id,
      reason,
    );
    return {
      success: true,
      message: 'Da tu choi yeu cau tra hang',
      data: returnRequest,
    };
  }

  // ===== XU LY HOAN TIEN (ADMIN) =====
  @Post('returns/:id/refund')
  @Roles(UserRole.ADMIN)
  async processRefund(@Param('id') id: string, @Request() req) {
    const returnRequest = await this.returnsService.processRefund(
      id,
      req.user._id,
    );
    return {
      success: true,
      message: `Da hoan tien ${returnRequest.refundAmount.toLocaleString('vi-VN')} VND`,
      data: returnRequest,
    };
  }
}
```

---

## 8. Bang API Endpoints

### Don hang

| #  | Method  | Endpoint                          | Auth                        | Mo ta                                |
|----|---------|-----------------------------------|-----------------------------|--------------------------------------|
| 1  | `POST`  | `/orders`                         | Customer JWT                | Tao don hang tu website              |
| 2  | `POST`  | `/orders/pos`                     | Admin, Staff JWT            | Tao don hang POS (tai quay)          |
| 3  | `GET`   | `/orders`                         | Admin, Staff                | Danh sach don hang (phan trang, loc) |
| 4  | `GET`   | `/orders/my-orders`               | Customer JWT                | Don hang cua toi                     |
| 5  | `GET`   | `/orders/recent`                  | Admin                       | Don hang gan day (dashboard)         |
| 6  | `GET`   | `/orders/stats`                   | Admin                       | Thong ke don hang + doanh thu        |
| 7  | `GET`   | `/orders/:id`                     | Admin, Staff, Customer(own) | Chi tiet don hang                    |
| 8  | `PATCH` | `/orders/:id/status`              | Admin, Staff, Shipper, Customer | Cap nhat trang thai              |
| 9  | `POST`  | `/orders/:id/assign-shipper`      | Admin                       | Gan shipper cho don                  |
| 10 | `POST`  | `/orders/:id/cancel`              | Admin, Customer(own)        | Huy don hang                         |
| 11 | `POST`  | `/orders/:id/confirm-payment`     | Admin                       | Xac nhan chuyen khoan ngan hang      |

### Tra hang / Hoan tien

| #  | Method  | Endpoint                     | Auth          | Mo ta                            |
|----|---------|------------------------------|---------------|----------------------------------|
| 12 | `POST`  | `/returns`                   | Customer JWT  | Tao yeu cau tra hang             |
| 13 | `GET`   | `/returns`                   | Admin         | Danh sach yeu cau tra hang       |
| 14 | `GET`   | `/returns/my-returns`        | Customer JWT  | Yeu cau tra hang cua toi         |
| 15 | `PATCH` | `/returns/:id/approve`       | Admin         | Duyet yeu cau tra hang           |
| 16 | `PATCH` | `/returns/:id/reject`        | Admin         | Tu choi yeu cau tra hang         |
| 17 | `POST`  | `/returns/:id/refund`        | Admin         | Xu ly hoan tien                  |

---

## 9. Vi du Request/Response

### 9.1. Tao don hang (LUONG DAY DU)

Day la vi du hoan chinh nhat, the hien toan bo logic tinh toan.

**Request:**

```http
POST /orders
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "6615a2b3c4d5e6f7a8b9c0d1",
      "variantSku": "SOFA-L-DEN-180",
      "quantity": 1
    },
    {
      "productId": "6615a2b3c4d5e6f7a8b9c0d2",
      "variantSku": null,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "fullName": "Nguyen Van An",
    "phone": "0901234567",
    "street": "123 Nguyen Hue",
    "ward": "Ben Nghe",
    "district": "Quan 1",
    "province": "Ho Chi Minh"
  },
  "paymentMethod": "bank_transfer",
  "couponCode": "SALE10",
  "note": "Giao buoi chieu sau 14h"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tao don hang thanh cong",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0001",
    "customerId": "6615a1a2b3c4d5e6f7a8b9c0",
    "customerName": "Nguyen Van An",
    "customerPhone": "0901234567",
    "customerEmail": "nguyenvanan@gmail.com",
    "items": [
      {
        "productId": "6615a2b3c4d5e6f7a8b9c0d1",
        "productName": "Sofa goc chu L vai boc cao cap",
        "productImage": "https://drive.google.com/file/sofa-l-den.jpg",
        "variantSku": "SOFA-L-DEN-180",
        "variantInfo": {
          "colorName": "Den",
          "dimensionLabel": "180x90x85 cm"
        },
        "quantity": 1,
        "unitPrice": 16500000,
        "totalPrice": 16500000
      },
      {
        "productId": "6615a2b3c4d5e6f7a8b9c0d2",
        "productName": "Goi tua lung bong ep",
        "productImage": "https://drive.google.com/file/goi-tua.jpg",
        "variantSku": null,
        "variantInfo": {
          "colorName": null,
          "dimensionLabel": null
        },
        "quantity": 2,
        "unitPrice": 350000,
        "totalPrice": 700000
      }
    ],
    "subtotal": 17200000,
    "discountAmount": 1720000,
    "discountReason": "Ma giam gia: SALE10",
    "shippingFee": 30000,
    "total": 15510000,
    "status": "pending",
    "paymentMethod": "bank_transfer",
    "paymentStatus": "pending",
    "bankTransferConfirmed": false,
    "bankTransferConfirmedBy": null,
    "shippingFullName": "Nguyen Van An",
    "shippingPhone": "0901234567",
    "shippingStreet": "123 Nguyen Hue",
    "shippingWard": "Ben Nghe",
    "shippingDistrict": "Quan 1",
    "shippingProvince": "Ho Chi Minh",
    "shippingNote": "Giao buoi chieu sau 14h",
    "shipperId": null,
    "shipperName": null,
    "shipperPhone": null,
    "couponCode": "SALE10",
    "isPosOrder": false,
    "createdBy": null,
    "deliveryProofImage": null,
    "deliveredAt": null,
    "statusHistory": [
      {
        "status": "pending",
        "changedBy": "6615a1a2b3c4d5e6f7a8b9c0",
        "changedAt": "2026-04-02T10:00:00.000Z",
        "note": "Don hang moi tao"
      }
    ],
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

**Giai thich cac so lieu:**

```
subtotal      = 16,500,000 + 700,000           = 17,200,000 VND
discountAmount = 17,200,000 x 10% (SALE10)     =  1,720,000 VND
shippingFee   = 30,000 (Ho Chi Minh = HCM_HN)  =     30,000 VND
total         = 17,200,000 - 1,720,000 + 30,000 = 15,510,000 VND
```

---

### 9.2. Tao don POS

**Request:**

```http
POST /orders/pos
Authorization: Bearer <staff_jwt_token>
Content-Type: application/json

{
  "customerId": "6615a1a2b3c4d5e6f7a8b9c0",
  "customerName": "Nguyen Van An",
  "customerPhone": "0901234567",
  "items": [
    {
      "productId": "6615a2b3c4d5e6f7a8b9c0d2",
      "quantity": 4
    }
  ],
  "paymentMethod": "cash",
  "cashReceived": 1500000,
  "note": "Khach quen - giam 5%"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tao don POS thanh cong",
  "data": {
    "_id": "6615d6e7f8a9b0c1d2e3f4a5",
    "orderNumber": "FV-20260402-0002",
    "customerId": "6615a1a2b3c4d5e6f7a8b9c0",
    "customerName": "Nguyen Van An",
    "customerPhone": "0901234567",
    "items": [
      {
        "productId": "6615a2b3c4d5e6f7a8b9c0d2",
        "productName": "Goi tua lung bong ep",
        "productImage": "https://drive.google.com/file/goi-tua.jpg",
        "variantSku": null,
        "variantInfo": { "colorName": null, "dimensionLabel": null },
        "quantity": 4,
        "unitPrice": 350000,
        "totalPrice": 1400000
      }
    ],
    "subtotal": 1400000,
    "discountAmount": 0,
    "shippingFee": 0,
    "total": 1400000,
    "status": "confirmed",
    "paymentMethod": "cash",
    "paymentStatus": "paid",
    "isPosOrder": true,
    "createdBy": "6615b2c3d4e5f6a7b8c9d0e1",
    "cashReceived": 1500000,
    "changeAmount": 100000,
    "statusHistory": [
      {
        "status": "confirmed",
        "changedBy": "6615b2c3d4e5f6a7b8c9d0e1",
        "changedAt": "2026-04-02T10:15:00.000Z",
        "note": "Don POS - xac nhan ngay"
      }
    ],
    "createdAt": "2026-04-02T10:15:00.000Z",
    "updatedAt": "2026-04-02T10:15:00.000Z"
  }
}
```

---

### 9.3. Cap nhat trang thai don hang

**Request (Admin xac nhan don):**

```http
PATCH /orders/6615d5e6f7a8b9c0d1e2f3a4/status
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "status": "confirmed",
  "note": "Da kiem tra thanh toan"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Cap nhat trang thai thanh cong: confirmed",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0001",
    "status": "confirmed",
    "statusHistory": [
      {
        "status": "pending",
        "changedBy": "6615a1a2b3c4d5e6f7a8b9c0",
        "changedAt": "2026-04-02T10:00:00.000Z",
        "note": "Don hang moi tao"
      },
      {
        "status": "confirmed",
        "changedBy": "6615b0c1d2e3f4a5b6c7d8e9",
        "changedAt": "2026-04-02T10:30:00.000Z",
        "note": "Da kiem tra thanh toan"
      }
    ]
  }
}
```

**Request (Shipper xac nhan giao hang):**

```http
PATCH /orders/6615d5e6f7a8b9c0d1e2f3a4/status
Authorization: Bearer <shipper_jwt_token>
Content-Type: application/json

{
  "status": "delivered",
  "deliveryProofImage": "https://drive.google.com/file/proof-001.jpg",
  "note": "Khach da nhan hang, ky xac nhan"
}
```

---

### 9.4. Gan shipper cho don hang

**Request:**

```http
POST /orders/6615d5e6f7a8b9c0d1e2f3a4/assign-shipper
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "shipperId": "6615c4d5e6f7a8b9c0d1e2f3"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da gan shipper Tran Van Tai cho don FV-20260402-0001",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0001",
    "shipperId": "6615c4d5e6f7a8b9c0d1e2f3",
    "shipperName": "Tran Van Tai",
    "shipperPhone": "0978123456"
  }
}
```

---

### 9.5. Huy don hang

**Request:**

```http
POST /orders/6615d5e6f7a8b9c0d1e2f3a4/cancel
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "reason": "Toi muon thay doi san pham khac"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da huy don hang",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0001",
    "status": "cancelled",
    "cancelReason": "Toi muon thay doi san pham khac"
  }
}
```

---

### 9.6. Xac nhan chuyen khoan ngan hang

**Request:**

```http
POST /orders/6615d5e6f7a8b9c0d1e2f3a4/confirm-payment
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da xac nhan chuyen khoan ngan hang",
  "data": {
    "_id": "6615d5e6f7a8b9c0d1e2f3a4",
    "orderNumber": "FV-20260402-0001",
    "paymentMethod": "bank_transfer",
    "paymentStatus": "paid",
    "bankTransferConfirmed": true,
    "bankTransferConfirmedBy": "6615b0c1d2e3f4a5b6c7d8e9"
  }
}
```

---

### 9.7. Thong ke don hang

**Request:**

```http
GET /orders/stats
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "byStatus": {
      "pending": 12,
      "confirmed": 8,
      "preparing": 5,
      "shipping": 15,
      "delivered": 234,
      "cancelled": 18,
      "returned": 3
    },
    "revenue": {
      "today": 45600000,
      "thisWeek": 312500000,
      "thisMonth": 1250000000
    },
    "totalOrders": 295
  }
}
```

---

### 9.8. Tao yeu cau tra hang

**Request:**

```http
POST /returns
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "orderId": "6615d5e6f7a8b9c0d1e2f3a4",
  "items": [
    {
      "productId": "6615a2b3c4d5e6f7a8b9c0d1",
      "variantSku": "SOFA-L-DEN-180",
      "quantity": 1,
      "reason": "defective",
      "note": "Chan sofa bi gay khi lap rap"
    }
  ],
  "customerNote": "San pham bi loi, chan sofa khong chac chan",
  "images": [
    "https://drive.google.com/file/return-img-1.jpg",
    "https://drive.google.com/file/return-img-2.jpg"
  ]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tao yeu cau tra hang thanh cong",
  "data": {
    "_id": "6615e7f8a9b0c1d2e3f4a5b6",
    "returnNumber": "RT-20260402-0001",
    "orderId": "6615d5e6f7a8b9c0d1e2f3a4",
    "customerId": "6615a1a2b3c4d5e6f7a8b9c0",
    "items": [
      {
        "productId": "6615a2b3c4d5e6f7a8b9c0d1",
        "variantSku": "SOFA-L-DEN-180",
        "quantity": 1,
        "reason": "defective",
        "note": "Chan sofa bi gay khi lap rap"
      }
    ],
    "status": "pending",
    "refundAmount": 16500000,
    "refundMethod": null,
    "customerNote": "San pham bi loi, chan sofa khong chac chan",
    "adminNote": null,
    "images": [
      "https://drive.google.com/file/return-img-1.jpg",
      "https://drive.google.com/file/return-img-2.jpg"
    ],
    "processedBy": null,
    "processedAt": null,
    "createdAt": "2026-04-02T14:00:00.000Z",
    "updatedAt": "2026-04-02T14:00:00.000Z"
  }
}
```

---

### 9.9. Xu ly hoan tien

**Request:**

```http
POST /returns/6615e7f8a9b0c1d2e3f4a5b6/refund
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da hoan tien 16,500,000 VND",
  "data": {
    "_id": "6615e7f8a9b0c1d2e3f4a5b6",
    "returnNumber": "RT-20260402-0001",
    "status": "completed",
    "refundAmount": 16500000,
    "refundMethod": "bank_transfer",
    "processedBy": "6615b0c1d2e3f4a5b6c7d8e9",
    "processedAt": "2026-04-02T16:00:00.000Z"
  }
}
```

---

> **Ghi chu quan trong:**
>
> 1. **MongoDB Transaction**: Tao don hang va huy don deu su dung `session.startTransaction()` de dam bao atomic. Neu bat ky buoc nao loi, toan bo thay doi se rollback (stock khong bi tru sai).
>
> 2. **Luong trang thai don hang:**
> ```
> PENDING --> CONFIRMED --> PREPARING --> SHIPPING --> DELIVERED
>    |           |            |            |
>    +--- CANCELLED (admin hoac customer neu PENDING) ---+
>                                                         |
>                                    DELIVERED --> RETURNED (admin duyet return)
>                                                     |
>                                                 REFUNDED (xu ly hoan tien)
> ```
>
> 3. **Phi van chuyen** duoc tinh tu dong theo tinh/thanh cua dia chi giao hang. Co the cau hinh lai trong `shipping-fees.constant.ts`.
>
> 4. **Socket.IO events** duoc emit tai cac thoi diem quan trong: tao don, cap nhat trang thai, gan shipper, huy don, hoan tien. Frontend lang nghe cac event nay de cap nhat realtime.
>
> 5. **POS order** khac online order: khong co phi van chuyen, bat dau tu CONFIRMED, thanh toan ngay (paymentStatus = paid), co thong tin tien khach dua va tien thua.
>
> 6. **Tra hang** chi cho phep trong 7 ngay sau khi giao. Phai la don DELIVERED. So luong tra khong duoc vuot qua so luong mua.
