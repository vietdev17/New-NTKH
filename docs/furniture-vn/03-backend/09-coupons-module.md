# COUPONS MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module quan ly ma giam gia (coupon) - Tao, validate, ap dung vao don hang
> Truoc day chi co schema, CHUA CO logic xu ly. Day la module moi hoan toan.
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [DTOs](#3-dtos)
4. [CouponsService](#4-couponsservice)
5. [CouponsController](#5-couponscontroller)
6. [Bang API Endpoints](#6-bang-api-endpoints)
7. [Vi du Request/Response](#7-vi-du-requestresponse)

---

## 1. Tong quan

Module Coupons xu ly toan bo logic ma giam gia:

- **CRUD coupon** (Admin): Tao, sua, xoa, kich hoat/vo hieu hoa
- **Validate coupon** (Customer): Kiem tra coupon hop le truoc khi dat hang
- **Apply coupon** (he thong noi bo): Tinh toan so tien giam khi tao don
- **Scope filtering**: Ho tro 3 loai scope - ALL (toan bo), CATEGORY (theo danh muc), PRODUCT (theo san pham cu the)
- **Usage tracking**: Ghi nhan lich su su dung qua CouponUsage schema, gioi han su dung tong va theo user

**Schemas su dung:**
- Coupon (xem `02-database/01-schemas.md` muc 8)
- CouponUsage (xem `02-database/01-schemas.md` muc 9)
- Product (muc 4), Category (muc 3)

---

## 2. Cau truc module

```
src/modules/coupons/
  ├── coupons.module.ts
  ├── coupons.service.ts
  ├── coupons.controller.ts
  └── dto/
      ├── create-coupon.dto.ts
      ├── update-coupon.dto.ts
      ├── apply-coupon.dto.ts
      └── query-coupon.dto.ts
```

### coupons.module.ts

```typescript
// ============================================================
// modules/coupons/coupons.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from '../../schemas/coupon.schema';
import {
  CouponUsage,
  CouponUsageSchema,
} from '../../schemas/coupon-usage.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponUsage.name, schema: CouponUsageSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
```

---

## 3. DTOs

### CreateCouponDto

```typescript
// ============================================================
// modules/coupons/dto/create-coupon.dto.ts
// ============================================================
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsMongoId,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { DiscountType } from '../../../enums/discount-type.enum';
import { CouponScope } from '../../../enums/coupon-scope.enum';

export class CreateCouponDto {
  @IsNotEmpty({ message: 'Ma coupon khong duoc de trong' })
  @IsString()
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNotEmpty()
  @IsEnum(DiscountType, { message: 'Loai giam gia khong hop le' })
  discountType: DiscountType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Gia tri giam phai >= 0' })
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsNotEmpty({ message: 'Ngay bat dau khong duoc de trong' })
  @IsDateString()
  startDate: string;

  @IsNotEmpty({ message: 'Ngay ket thuc khong duoc de trong' })
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsage?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsagePerUser?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(CouponScope, { message: 'Scope khong hop le' })
  scope?: CouponScope;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  applicableCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  applicableProducts?: string[];
}
```

### UpdateCouponDto

```typescript
// ============================================================
// modules/coupons/dto/update-coupon.dto.ts
// ============================================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupon.dto';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
```

### ApplyCouponDto

```typescript
// ============================================================
// modules/coupons/dto/apply-coupon.dto.ts
// ============================================================
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsMongoId,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CouponOrderItemDto {
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ApplyCouponDto {
  @IsNotEmpty({ message: 'Ma coupon khong duoc de trong' })
  @IsString()
  code: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CouponOrderItemDto)
  items: CouponOrderItemDto[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;
}
```

### QueryCouponDto

```typescript
// ============================================================
// modules/coupons/dto/query-coupon.dto.ts
// ============================================================
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CouponFilter {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ALL = 'all',
}

export class QueryCouponDto {
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
  @IsEnum(CouponFilter)
  filter?: CouponFilter = CouponFilter.ALL;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
```

---

## 4. CouponsService

```typescript
// ============================================================
// modules/coupons/coupons.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from '../../schemas/coupon.schema';
import {
  CouponUsage,
  CouponUsageDocument,
} from '../../schemas/coupon-usage.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { CouponScope } from '../../enums/coupon-scope.enum';
import { DiscountType } from '../../enums/discount-type.enum';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto, CouponFilter } from './dto/query-coupon.dto';
import { CouponOrderItemDto } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name)
    private couponUsageModel: Model<CouponUsageDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // ===== TAO COUPON =====
  async create(dto: CreateCouponDto): Promise<CouponDocument> {
    // Validate ngay bat dau < ngay ket thuc
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'Ngay bat dau phai truoc ngay ket thuc',
      );
    }

    // Validate percentage <= 100
    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException(
        'Phan tram giam gia khong duoc vuot qua 100%',
      );
    }

    // Validate scope + applicable fields
    if (dto.scope === CouponScope.CATEGORY) {
      if (!dto.applicableCategories?.length) {
        throw new BadRequestException(
          'Scope CATEGORY can co it nhat 1 danh muc',
        );
      }
    }
    if (dto.scope === CouponScope.PRODUCT) {
      if (!dto.applicableProducts?.length) {
        throw new BadRequestException(
          'Scope PRODUCT can co it nhat 1 san pham',
        );
      }
    }

    // Kiem tra trung ma
    const existing = await this.couponModel.findOne({
      code: dto.code.toUpperCase(),
    });
    if (existing) {
      throw new ConflictException(
        `Ma coupon "${dto.code}" da ton tai`,
      );
    }

    const coupon = new this.couponModel({
      ...dto,
      code: dto.code.toUpperCase(),
    });
    return coupon.save();
  }

  // ===== DANH SACH COUPON (ADMIN) - CO PHAN TRANG =====
  async findAll(query: QueryCouponDto) {
    const { page = 1, limit = 20, filter, scope, search, isActive } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    // Build filter conditions
    const conditions: any = {};

    // Filter theo trang thai
    if (filter === CouponFilter.ACTIVE) {
      conditions.isActive = true;
      conditions.endDate = { $gte: now };
      conditions.startDate = { $lte: now };
    } else if (filter === CouponFilter.EXPIRED) {
      conditions.$or = [
        { endDate: { $lt: now } },
        { isActive: false },
      ];
    }

    // Filter theo isActive rieng
    if (isActive !== undefined) {
      conditions.isActive = isActive;
    }

    // Filter theo scope
    if (scope) {
      conditions.scope = scope;
    }

    // Tim kiem theo code hoac description
    if (search) {
      conditions.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.couponModel
        .find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.couponModel.countDocuments(conditions),
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

  // ===== CHI TIET COUPON (KEM THONG KE SU DUNG) =====
  async findById(id: string): Promise<any> {
    const coupon = await this.couponModel.findById(id).lean();
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }

    // Lay thong ke su dung
    const usageStats = await this.getUsageStats(id);

    return {
      ...coupon,
      usageStats,
    };
  }

  // ===== TIM THEO CODE =====
  async findByCode(code: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
    });
    if (!coupon) {
      throw new NotFoundException(
        `Coupon "${code}" khong ton tai`,
      );
    }
    return coupon;
  }

  // ===== CAP NHAT COUPON =====
  async update(
    id: string,
    dto: UpdateCouponDto,
  ): Promise<CouponDocument> {
    // Validate ngay neu co cap nhat
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException(
          'Ngay bat dau phai truoc ngay ket thuc',
        );
      }
    }

    // Validate percentage
    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException(
        'Phan tram giam gia khong duoc vuot qua 100%',
      );
    }

    // Kiem tra trung code voi coupon khac
    if (dto.code) {
      const existing = await this.couponModel.findOne({
        code: dto.code.toUpperCase(),
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        throw new ConflictException(
          `Ma coupon "${dto.code}" da ton tai`,
        );
      }
      dto.code = dto.code.toUpperCase();
    }

    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }

    return coupon;
  }

  // ===== KICH HOAT COUPON =====
  async activate(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    );
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }
    return coupon;
  }

  // ===== VO HIEU HOA COUPON =====
  async deactivate(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }
    return coupon;
  }

  // ===== XOA COUPON =====
  async delete(id: string): Promise<void> {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }

    // Kiem tra da co ai su dung chua
    const usageCount = await this.couponUsageModel.countDocuments({
      couponId: new Types.ObjectId(id),
    });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Coupon da duoc su dung ${usageCount} lan, khong the xoa. Hay vo hieu hoa thay vi xoa.`,
      );
    }

    await this.couponModel.findByIdAndDelete(id);
  }

  // =============================================================
  // VALIDATE VA AP DUNG COUPON - LOGIC QUAN TRONG NHAT
  // =============================================================
  async validateAndApply(
    code: string,
    userId: string,
    orderItems: CouponOrderItemDto[],
    subtotal: number,
  ): Promise<{
    isValid: boolean;
    discountAmount: number;
    message: string;
    couponId?: string;
  }> {
    // ----- Buoc 1: Kiem tra coupon ton tai va isActive -----
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
    });

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Ma giam gia "${code}" khong ton tai`,
      };
    }

    if (!coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Ma giam gia da bi vo hieu hoa',
      };
    }

    // ----- Buoc 2: Kiem tra thoi gian hieu luc -----
    const now = new Date();

    if (now < coupon.startDate) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Ma giam gia chua co hieu luc. Bat dau tu ${coupon.startDate.toLocaleDateString('vi-VN')}`,
      };
    }

    if (now > coupon.endDate) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Ma giam gia da het han',
      };
    }

    // ----- Buoc 3: Kiem tra tong so lan su dung -----
    if (coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Ma giam gia da het luot su dung',
      };
    }

    // ----- Buoc 4: Kiem tra so lan su dung cua user nay -----
    const userUsageCount = await this.couponUsageModel.countDocuments({
      couponId: coupon._id,
      userId: new Types.ObjectId(userId),
    });

    if (userUsageCount >= coupon.maxUsagePerUser) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Ban da su dung ma nay ${userUsageCount}/${coupon.maxUsagePerUser} lan`,
      };
    }

    // ----- Buoc 5: Kiem tra gia tri don hang toi thieu -----
    if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Don hang toi thieu ${coupon.minOrderValue.toLocaleString('vi-VN')} VND de su dung ma nay`,
      };
    }

    // ----- Buoc 6: Kiem tra scope va tinh tien giam -----
    let applicableTotal = 0;

    switch (coupon.scope) {
      case CouponScope.ALL:
        // Ap dung cho tat ca san pham
        applicableTotal = subtotal;
        break;

      case CouponScope.CATEGORY:
        // Chi ap dung cho san pham thuoc danh muc chi dinh
        const applicableCategoryIds = coupon.applicableCategories.map(
          (id) => id.toString(),
        );
        for (const item of orderItems) {
          if (applicableCategoryIds.includes(item.categoryId)) {
            applicableTotal += item.price * item.quantity;
          }
        }
        if (applicableTotal === 0) {
          return {
            isValid: false,
            discountAmount: 0,
            message:
              'Khong co san pham nao trong don hang thuoc danh muc duoc ap dung ma giam gia nay',
          };
        }
        break;

      case CouponScope.PRODUCT:
        // Chi ap dung cho san pham cu the
        const applicableProductIds = coupon.applicableProducts.map(
          (id) => id.toString(),
        );
        for (const item of orderItems) {
          if (applicableProductIds.includes(item.productId)) {
            applicableTotal += item.price * item.quantity;
          }
        }
        if (applicableTotal === 0) {
          return {
            isValid: false,
            discountAmount: 0,
            message:
              'Khong co san pham nao trong don hang duoc ap dung ma giam gia nay',
          };
        }
        break;
    }

    // ----- Buoc 7: Tinh toan so tien giam -----
    let discountAmount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      // Giam theo phan tram cua tong gia tri san pham hop le
      discountAmount = Math.round(
        (applicableTotal * coupon.discountValue) / 100,
      );
    } else {
      // Giam co dinh (FIXED)
      discountAmount = coupon.discountValue;
    }

    // ----- Buoc 8: Ap dung gioi han giam toi da -----
    if (
      coupon.maxDiscountAmount !== null &&
      coupon.maxDiscountAmount > 0 &&
      discountAmount > coupon.maxDiscountAmount
    ) {
      discountAmount = coupon.maxDiscountAmount;
    }

    // Dam bao khong giam nhieu hon tong don
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      isValid: true,
      discountAmount,
      message: `Ap dung ma "${coupon.code}" thanh cong. Giam ${discountAmount.toLocaleString('vi-VN')} VND`,
      couponId: coupon._id.toString(),
    };
  }

  // ===== GHI NHAN SU DUNG SAU KHI TAO DON =====
  async recordUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
  ): Promise<void> {
    // Tao ban ghi su dung
    await this.couponUsageModel.create({
      couponId: new Types.ObjectId(couponId),
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
      discountAmount,
      usedAt: new Date(),
    });

    // Tang usedCount trong coupon
    await this.couponModel.findByIdAndUpdate(couponId, {
      $inc: { usedCount: 1 },
    });
  }

  // ===== THONG KE SU DUNG =====
  async getUsageStats(couponId: string) {
    const [totalUsage, uniqueUsers, totalDiscount, recentUsages] =
      await Promise.all([
        // Tong luot su dung
        this.couponUsageModel.countDocuments({
          couponId: new Types.ObjectId(couponId),
        }),
        // So user khac nhau da dung
        this.couponUsageModel.distinct('userId', {
          couponId: new Types.ObjectId(couponId),
        }),
        // Tong tien da giam
        this.couponUsageModel.aggregate([
          {
            $match: {
              couponId: new Types.ObjectId(couponId),
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$discountAmount' },
            },
          },
        ]),
        // 10 lan su dung gan nhat
        this.couponUsageModel
          .find({ couponId: new Types.ObjectId(couponId) })
          .sort({ usedAt: -1 })
          .limit(10)
          .populate('userId', 'fullName email')
          .populate('orderId', 'orderNumber totalAmount')
          .lean(),
      ]);

    return {
      totalUsage,
      uniqueUsers: uniqueUsers.length,
      totalDiscountGiven:
        totalDiscount.length > 0 ? totalDiscount[0].total : 0,
      recentUsages,
    };
  }

  // ===== COUPON DANG HOAT DONG (PUBLIC/CUSTOMER) =====
  async getActiveCoupons() {
    const now = new Date();

    return this.couponModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { maxUsage: null },
          { $expr: { $lt: ['$usedCount', '$maxUsage'] } },
        ],
      })
      .select(
        'code description discountType discountValue minOrderValue maxDiscountAmount startDate endDate scope',
      )
      .sort({ endDate: 1 })
      .lean();
  }
}
```

---

## 5. CouponsController

```typescript
// ============================================================
// modules/coupons/coupons.controller.ts
// ============================================================
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ===== ADMIN: DANH SACH COUPON =====
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: QueryCouponDto) {
    const result = await this.couponsService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  // ===== PUBLIC: COUPON DANG HOAT DONG (CHO KHACH HANG) =====
  @Get('active')
  async getActiveCoupons() {
    const data = await this.couponsService.getActiveCoupons();
    return {
      success: true,
      data,
    };
  }

  // ===== ADMIN: CHI TIET COUPON =====
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    const data = await this.couponsService.findById(id);
    return {
      success: true,
      data,
    };
  }

  // ===== ADMIN: TAO COUPON =====
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCouponDto) {
    const data = await this.couponsService.create(dto);
    return {
      success: true,
      message: 'Tao coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: CAP NHAT COUPON =====
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    const data = await this.couponsService.update(id, dto);
    return {
      success: true,
      message: 'Cap nhat coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: XOA COUPON =====
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.couponsService.delete(id);
    return {
      success: true,
      message: 'Xoa coupon thanh cong',
    };
  }

  // ===== ADMIN: KICH HOAT COUPON =====
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    const data = await this.couponsService.activate(id);
    return {
      success: true,
      message: 'Kich hoat coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: VO HIEU HOA COUPON =====
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    const data = await this.couponsService.deactivate(id);
    return {
      success: true,
      message: 'Vo hieu hoa coupon thanh cong',
      data,
    };
  }

  // ===== CUSTOMER: VALIDATE COUPON (KHONG AP DUNG) =====
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(
    @Request() req,
    @Body() dto: ApplyCouponDto,
  ) {
    const result = await this.couponsService.validateAndApply(
      dto.code,
      req.user._id.toString(),
      dto.items,
      dto.subtotal,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ===== ADMIN: THONG KE SU DUNG COUPON =====
  @Get(':id/usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUsageStats(@Param('id') id: string) {
    const data = await this.couponsService.getUsageStats(id);
    return {
      success: true,
      data,
    };
  }
}
```

---

## 6. Bang API Endpoints

| # | Method | Endpoint | Auth | Role | Mo ta |
|---|--------|----------|------|------|-------|
| 1 | `GET` | `/coupons` | JWT | Admin | Danh sach coupon (phan trang, filter) |
| 2 | `GET` | `/coupons/active` | Khong | Public | Lay coupon dang hoat dong (cho khach) |
| 3 | `GET` | `/coupons/:id` | JWT | Admin | Chi tiet coupon + thong ke su dung |
| 4 | `POST` | `/coupons` | JWT | Admin | Tao coupon moi |
| 5 | `PATCH` | `/coupons/:id` | JWT | Admin | Cap nhat coupon |
| 6 | `DELETE` | `/coupons/:id` | JWT | Admin | Xoa coupon (chi khi chua ai dung) |
| 7 | `PATCH` | `/coupons/:id/activate` | JWT | Admin | Kich hoat coupon |
| 8 | `PATCH` | `/coupons/:id/deactivate` | JWT | Admin | Vo hieu hoa coupon |
| 9 | `POST` | `/coupons/validate` | JWT | Customer | Validate coupon (xem truoc giam bao nhieu) |
| 10 | `GET` | `/coupons/:id/usage` | JWT | Admin | Thong ke su dung coupon |

---

## 7. Vi du Request/Response

### 7.1. Tao coupon (Admin)

**Request:**

```http
POST /coupons
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

```json
{
  "code": "NOITHAT20",
  "description": "Giam 20% cho tat ca san pham noi that, toi da 500k",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderValue": 1000000,
  "maxDiscountAmount": 500000,
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z",
  "maxUsage": 100,
  "maxUsagePerUser": 2,
  "isActive": true,
  "scope": "all"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tao coupon thanh cong",
  "data": {
    "_id": "6615f1a2b3c4d5e6f7a8b9c0",
    "code": "NOITHAT20",
    "description": "Giam 20% cho tat ca san pham noi that, toi da 500k",
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderValue": 1000000,
    "maxDiscountAmount": 500000,
    "startDate": "2026-04-01T00:00:00.000Z",
    "endDate": "2026-04-30T23:59:59.000Z",
    "maxUsage": 100,
    "usedCount": 0,
    "maxUsagePerUser": 2,
    "isActive": true,
    "scope": "all",
    "applicableCategories": [],
    "applicableProducts": [],
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

### 7.2. Tao coupon theo danh muc (Admin)

**Request:**

```http
POST /coupons
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

```json
{
  "code": "SOFA100K",
  "description": "Giam 100k cho danh muc Sofa",
  "discountType": "fixed",
  "discountValue": 100000,
  "minOrderValue": 2000000,
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-05-01T23:59:59.000Z",
  "maxUsage": 50,
  "maxUsagePerUser": 1,
  "scope": "category",
  "applicableCategories": ["6615a1a2b3c4d5e6f7a8b901"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tao coupon thanh cong",
  "data": {
    "_id": "6615f2b3c4d5e6f7a8b9c0d1",
    "code": "SOFA100K",
    "description": "Giam 100k cho danh muc Sofa",
    "discountType": "fixed",
    "discountValue": 100000,
    "minOrderValue": 2000000,
    "maxDiscountAmount": null,
    "startDate": "2026-04-01T00:00:00.000Z",
    "endDate": "2026-05-01T23:59:59.000Z",
    "maxUsage": 50,
    "usedCount": 0,
    "maxUsagePerUser": 1,
    "isActive": true,
    "scope": "category",
    "applicableCategories": ["6615a1a2b3c4d5e6f7a8b901"],
    "applicableProducts": [],
    "createdAt": "2026-04-02T10:30:00.000Z",
    "updatedAt": "2026-04-02T10:30:00.000Z"
  }
}
```

### 7.3. Danh sach coupon (Admin, co filter)

**Request:**

```http
GET /coupons?page=1&limit=10&filter=active&scope=all
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6615f1a2b3c4d5e6f7a8b9c0",
      "code": "NOITHAT20",
      "description": "Giam 20% cho tat ca san pham noi that, toi da 500k",
      "discountType": "percentage",
      "discountValue": 20,
      "minOrderValue": 1000000,
      "maxDiscountAmount": 500000,
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-04-30T23:59:59.000Z",
      "maxUsage": 100,
      "usedCount": 12,
      "isActive": true,
      "scope": "all"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 7.4. Lay coupon dang hoat dong (Public/Customer)

**Request:**

```http
GET /coupons/active
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "code": "NOITHAT20",
      "description": "Giam 20% cho tat ca san pham noi that, toi da 500k",
      "discountType": "percentage",
      "discountValue": 20,
      "minOrderValue": 1000000,
      "maxDiscountAmount": 500000,
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-04-30T23:59:59.000Z",
      "scope": "all"
    },
    {
      "code": "SOFA100K",
      "description": "Giam 100k cho danh muc Sofa",
      "discountType": "fixed",
      "discountValue": 100000,
      "minOrderValue": 2000000,
      "maxDiscountAmount": null,
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-05-01T23:59:59.000Z",
      "scope": "category"
    }
  ]
}
```

### 7.5. Validate coupon (Customer)

**Request:**

```http
POST /coupons/validate
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json
```

```json
{
  "code": "NOITHAT20",
  "items": [
    {
      "productId": "6615a2b3c4d5e6f7a8b9c0d1",
      "categoryId": "6615a1a2b3c4d5e6f7a8b901",
      "price": 8500000,
      "quantity": 1
    },
    {
      "productId": "6615a3c4d5e6f7a8b9c0d1e2",
      "categoryId": "6615a1a2b3c4d5e6f7a8b902",
      "price": 3200000,
      "quantity": 2
    }
  ],
  "subtotal": 14900000
}
```

**Response (200 OK) - Thanh cong:**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "discountAmount": 500000,
    "message": "Ap dung ma \"NOITHAT20\" thanh cong. Giam 500,000 VND",
    "couponId": "6615f1a2b3c4d5e6f7a8b9c0"
  }
}
```

> **Giai thich:** 20% x 14,900,000 = 2,980,000. Nhung maxDiscountAmount = 500,000 nen chi giam 500,000 VND.

**Response (200 OK) - That bai (het han):**

```json
{
  "success": true,
  "data": {
    "isValid": false,
    "discountAmount": 0,
    "message": "Ma giam gia da het han"
  }
}
```

**Response (200 OK) - That bai (chua du gia tri don):**

```json
{
  "success": true,
  "data": {
    "isValid": false,
    "discountAmount": 0,
    "message": "Don hang toi thieu 1,000,000 VND de su dung ma nay"
  }
}
```

**Response (200 OK) - That bai (het luot su dung):**

```json
{
  "success": true,
  "data": {
    "isValid": false,
    "discountAmount": 0,
    "message": "Ban da su dung ma nay 2/2 lan"
  }
}
```

### 7.6. Kich hoat coupon (Admin)

**Request:**

```http
PATCH /coupons/6615f2b3c4d5e6f7a8b9c0d1/activate
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Kich hoat coupon thanh cong",
  "data": {
    "_id": "6615f2b3c4d5e6f7a8b9c0d1",
    "code": "SOFA100K",
    "isActive": true
  }
}
```

### 7.7. Thong ke su dung coupon (Admin)

**Request:**

```http
GET /coupons/6615f1a2b3c4d5e6f7a8b9c0/usage
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalUsage": 12,
    "uniqueUsers": 10,
    "totalDiscountGiven": 4850000,
    "recentUsages": [
      {
        "_id": "6615g1h2i3j4k5l6m7n8o9p0",
        "couponId": "6615f1a2b3c4d5e6f7a8b9c0",
        "userId": {
          "_id": "6615a1a2b3c4d5e6f7a8b9c0",
          "fullName": "Nguyen Van A",
          "email": "nguyenvana@gmail.com"
        },
        "orderId": {
          "_id": "6615d5e6f7a8b9c0d1e2f3a4",
          "orderNumber": "FV-20260402-0001",
          "totalAmount": 14400000
        },
        "discountAmount": 500000,
        "usedAt": "2026-04-02T15:30:00.000Z"
      }
    ]
  }
}
```

### 7.8. Xoa coupon (Admin)

**Request:**

```http
DELETE /coupons/6615f3c4d5e6f7a8b9c0d1e2
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Xoa coupon thanh cong"
}
```

**Response (400 Bad Request) - Coupon da co nguoi dung:**

```json
{
  "statusCode": 400,
  "message": "Coupon da duoc su dung 12 lan, khong the xoa. Hay vo hieu hoa thay vi xoa.",
  "error": "Bad Request"
}
```

---

> **Ghi chu quan trong:**
>
> 1. **validateAndApply** duoc goi tu OrdersService khi tao don hang. Neu isValid = true, OrdersService se tiep tuc tao don va goi `recordUsage()` sau khi don tao thanh cong.
>
> 2. **Scope logic:**
> ```
> scope = ALL      --> Giam tren toan bo subtotal
> scope = CATEGORY --> Chi tinh tien cac item co categoryId nam trong applicableCategories
> scope = PRODUCT  --> Chi tinh tien cac item co productId nam trong applicableProducts
> ```
>
> 3. **Percentage + maxDiscountAmount:** Khi discountType = percentage, luon kiem tra maxDiscountAmount de gioi han so tien giam toi da. Vi du: giam 20% don 14.9 trieu = 2.98 trieu, nhung maxDiscountAmount = 500k thi chi giam 500k.
>
> 4. **Xoa coupon:** Chi cho phep xoa khi usedCount = 0. Neu da co nguoi su dung, chi co the vo hieu hoa (deactivate).
>
> 5. **Module nay duoc export** de OrdersModule co the inject CouponsService qua `forwardRef()`.
