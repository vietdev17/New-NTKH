# CUSTOMERS MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module quan ly khach hang, dia chi, loyalty points, thong ke
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [DTOs](#3-dtos)
4. [Customers Service](#4-customers-service)
5. [Customers Controller](#5-customers-controller)
6. [Bang API Endpoints](#6-bang-api-endpoints)
7. [Vi du Request/Response](#7-vi-du-requestresponse)

---

## 1. Tong quan

Module Customers quan ly toan bo thong tin khach hang:
- CRUD khach hang (admin/staff co the tao khach voi chi so dien thoai - phuc vu POS)
- Quan ly dia chi giao hang (them, sua, xoa, dat mac dinh)
- Loyalty points (cong/tru diem, lich su)
- Tra cuu nhanh theo so dien thoai (POS)
- Thong ke khach hang: tong don, tong chi tieu, khach VIP

**Schema su dung:** User (voi role = 'customer') - xem `02-database/01-schemas.md` muc 2

**Dac diem:**
- Customer la User voi `role = 'customer'`
- Staff co the tao customer bang so dien thoai (POS checkout nhanh)
- Dia chi luu embedded trong User.addresses[]
- Loyalty points theo don hang (1000 VND = 1 diem)

---

## 2. Cau truc module

```
src/modules/customers/
  ├── customers.module.ts
  ├── customers.service.ts
  ├── customers.controller.ts
  └── dto/
      ├── create-customer.dto.ts
      ├── update-customer.dto.ts
      ├── address.dto.ts
      ├── query-customer.dto.ts
      └── loyalty-points.dto.ts
```

### customers.module.ts

```typescript
// ============================================================
// modules/customers/customers.module.ts
// ============================================================
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
```

---

## 3. DTOs

### create-customer.dto.ts

```typescript
// ============================================================
// modules/customers/dto/create-customer.dto.ts
// ============================================================
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsNotEmpty({ message: 'So dien thoai khong duoc de trong' })
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, {
    message: 'So dien thoai khong hop le (VD: 0901234567 hoac +84901234567)',
  })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email khong hop le' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
```

### update-customer.dto.ts

```typescript
// ============================================================
// modules/customers/dto/update-customer.dto.ts
// ============================================================
import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, {
    message: 'So dien thoai khong hop le',
  })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email khong hop le' })
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### address.dto.ts

```typescript
// ============================================================
// modules/customers/dto/address.dto.ts
// ============================================================
import { IsNotEmpty, IsString, IsOptional, IsBoolean, Matches } from 'class-validator';

export class AddressDto {
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'So dien thoai khong duoc de trong' })
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, { message: 'So dien thoai khong hop le' })
  phone: string;

  @IsNotEmpty({ message: 'Dia chi duong khong duoc de trong' })
  @IsString()
  street: string;

  @IsNotEmpty({ message: 'Phuong/Xa khong duoc de trong' })
  @IsString()
  ward: string;

  @IsNotEmpty({ message: 'Quan/Huyen khong duoc de trong' })
  @IsString()
  district: string;

  @IsNotEmpty({ message: 'Tinh/Thanh pho khong duoc de trong' })
  @IsString()
  province: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
```

### query-customer.dto.ts

```typescript
// ============================================================
// modules/customers/dto/query-customer.dto.ts
// ============================================================
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCustomerDto {
  @IsOptional()
  @IsString()
  search?: string; // Tim theo ten, phone, email

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
  sortBy?: string = 'createdAt'; // createdAt | loyaltyPoints | fullName

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

### loyalty-points.dto.ts

```typescript
// ============================================================
// modules/customers/dto/loyalty-points.dto.ts
// ============================================================
import { IsNotEmpty, IsInt, Min, IsString, MaxLength } from 'class-validator';

export class LoyaltyPointsDto {
  @IsNotEmpty()
  @IsInt({ message: 'So diem phai la so nguyen' })
  @Min(1, { message: 'So diem phai lon hon 0' })
  points: number;

  @IsNotEmpty({ message: 'Ly do khong duoc de trong' })
  @IsString()
  @MaxLength(200)
  reason: string;
}
```

---

## 4. Customers Service

```typescript
// ============================================================
// modules/customers/customers.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { UserRole } from '../../enums/user-role.enum';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // ===== DANH SACH KHACH HANG (PHAN TRANG + TIM KIEM) =====
  async findAll(query: QueryCustomerDto): Promise<{
    items: UserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      role: UserRole.CUSTOMER,
      isDeleted: false,
    };

    // Tim kiem theo ten, phone, email
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshToken -resetPasswordToken')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== CHI TIET KHACH HANG (KEM SO DON + TONG CHI TIEU) =====
  async findById(id: string): Promise<any> {
    const customer = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id),
        role: UserRole.CUSTOMER,
        isDeleted: false,
      })
      .select('-password -refreshToken -resetPasswordToken')
      .lean();

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    // Tinh tong don hang va tong chi tieu
    const orderStats = await this.orderModel.aggregate([
      {
        $match: {
          customerId: new Types.ObjectId(id),
          isDeleted: false,
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const stats = orderStats[0] || { totalOrders: 0, totalSpent: 0 };

    return {
      ...customer,
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
    };
  }

  // ===== TRA CUU NHANH THEO SO DIEN THOAI (POS) =====
  async findByPhone(phone: string): Promise<UserDocument | null> {
    const customer = await this.userModel
      .findOne({
        phone,
        role: UserRole.CUSTOMER,
        isDeleted: false,
      })
      .select('-password -refreshToken -resetPasswordToken')
      .lean();

    return customer;
  }

  // ===== TAO KHACH HANG MOI =====
  // Staff co the tao voi chi so dien thoai (POS checkout nhanh)
  async create(dto: CreateCustomerDto): Promise<UserDocument> {
    // Kiem tra trung so dien thoai
    const existing = await this.userModel.findOne({
      phone: dto.phone,
      isDeleted: false,
    });

    if (existing) {
      throw new ConflictException('So dien thoai da duoc su dung');
    }

    // Kiem tra trung email neu co
    if (dto.email) {
      const existingEmail = await this.userModel.findOne({
        email: dto.email,
        isDeleted: false,
      });
      if (existingEmail) {
        throw new ConflictException('Email da duoc su dung');
      }
    }

    const customer = new this.userModel({
      fullName: dto.fullName || `Khach ${dto.phone.slice(-4)}`,
      phone: dto.phone,
      email: dto.email || `${dto.phone}@placeholder.local`, // Email tam neu khong co
      role: UserRole.CUSTOMER,
      isActive: true,
    });

    return customer.save();
  }

  // ===== CAP NHAT THONG TIN KHACH HANG =====
  async update(id: string, dto: UpdateCustomerDto): Promise<UserDocument> {
    const customer = await this.userModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        role: UserRole.CUSTOMER,
        isDeleted: false,
      },
      { $set: dto },
      { new: true, runValidators: true },
    ).select('-password -refreshToken -resetPasswordToken');

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    return customer;
  }

  // ===== THEM DIA CHI =====
  async addAddress(customerId: string, dto: AddressDto): Promise<UserDocument> {
    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    // Neu la dia chi dau tien hoac isDefault = true, reset tat ca dia chi khac
    if (dto.isDefault || customer.addresses.length === 0) {
      customer.addresses.forEach((addr) => (addr.isDefault = false));
      dto.isDefault = true;
    }

    customer.addresses.push(dto as any);
    return customer.save();
  }

  // ===== CAP NHAT DIA CHI =====
  async updateAddress(
    customerId: string,
    addressIndex: number,
    dto: AddressDto,
  ): Promise<UserDocument> {
    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
      throw new BadRequestException('Chi so dia chi khong hop le');
    }

    // Cap nhat dia chi tai index
    Object.assign(customer.addresses[addressIndex], dto);

    // Neu dat mac dinh, reset cac dia chi khac
    if (dto.isDefault) {
      customer.addresses.forEach((addr, i) => {
        if (i !== addressIndex) addr.isDefault = false;
      });
    }

    return customer.save();
  }

  // ===== XOA DIA CHI =====
  async removeAddress(
    customerId: string,
    addressIndex: number,
  ): Promise<UserDocument> {
    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
      throw new BadRequestException('Chi so dia chi khong hop le');
    }

    const wasDefault = customer.addresses[addressIndex].isDefault;
    customer.addresses.splice(addressIndex, 1);

    // Neu dia chi bi xoa la mac dinh, dat dia chi dau tien lam mac dinh
    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    return customer.save();
  }

  // ===== DAT DIA CHI MAC DINH =====
  async setDefaultAddress(
    customerId: string,
    addressIndex: number,
  ): Promise<UserDocument> {
    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
      throw new BadRequestException('Chi so dia chi khong hop le');
    }

    customer.addresses.forEach((addr, i) => {
      addr.isDefault = i === addressIndex;
    });

    return customer.save();
  }

  // ===== CONG DIEM LOYALTY =====
  async addLoyaltyPoints(
    customerId: string,
    points: number,
    reason: string,
  ): Promise<{ loyaltyPoints: number }> {
    const customer = await this.userModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(customerId),
        role: UserRole.CUSTOMER,
        isDeleted: false,
      },
      {
        $inc: { loyaltyPoints: points },
      },
      { new: true },
    ).select('loyaltyPoints');

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    // TODO: Luu lich su diem vao collection rieng (LoyaltyHistory)
    // Hien tai log console, phien ban sau se tao schema LoyaltyHistory
    console.log(
      `[Loyalty] +${points} diem cho customer ${customerId}: ${reason}`,
    );

    return { loyaltyPoints: customer.loyaltyPoints };
  }

  // ===== TRU DIEM LOYALTY =====
  async deductLoyaltyPoints(
    customerId: string,
    points: number,
    reason: string,
  ): Promise<{ loyaltyPoints: number }> {
    const customer = await this.userModel.findOne({
      _id: new Types.ObjectId(customerId),
      role: UserRole.CUSTOMER,
      isDeleted: false,
    });

    if (!customer) {
      throw new NotFoundException('Khong tim thay khach hang');
    }

    if (customer.loyaltyPoints < points) {
      throw new BadRequestException(
        `Khong du diem. Hien co: ${customer.loyaltyPoints}, can tru: ${points}`,
      );
    }

    customer.loyaltyPoints -= points;
    await customer.save();

    console.log(
      `[Loyalty] -${points} diem cho customer ${customerId}: ${reason}`,
    );

    return { loyaltyPoints: customer.loyaltyPoints };
  }

  // ===== LICH SU DIEM LOYALTY =====
  // TODO: Khi co LoyaltyHistory schema, query tu collection do
  async getLoyaltyHistory(customerId: string): Promise<any[]> {
    // Tam thoi tra ve mang rong - phien ban sau se implement day du
    // voi LoyaltyHistory collection
    return [];
  }

  // ===== LICH SU DON HANG CUA KHACH =====
  async getOrderHistory(
    customerId: string,
    query: { page?: number; limit?: number },
  ): Promise<{
    items: OrderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter = {
      customerId: new Types.ObjectId(customerId),
      isDeleted: false,
    };

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

  // ===== TOP KHACH HANG THEO TONG CHI TIEU =====
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    const topCustomers = await this.orderModel.aggregate([
      {
        $match: {
          isDeleted: false,
          status: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: '$customerId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $project: {
          _id: '$customer._id',
          fullName: '$customer.fullName',
          phone: '$customer.phone',
          email: '$customer.email',
          avatar: '$customer.avatar',
          loyaltyPoints: '$customer.loyaltyPoints',
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
        },
      },
    ]);

    return topCustomers;
  }

  // ===== THONG KE KHACH HANG =====
  async getCustomerStats(customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate: Date | null;
  }> {
    const stats = await this.orderModel.aggregate([
      {
        $match: {
          customerId: new Types.ObjectId(customerId),
          isDeleted: false,
          status: { $nin: ['cancelled'] },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        lastOrderDate: null,
      };
    }

    return {
      totalOrders: stats[0].totalOrders,
      totalSpent: stats[0].totalSpent,
      avgOrderValue: Math.round(stats[0].avgOrderValue),
      lastOrderDate: stats[0].lastOrderDate,
    };
  }
}
```

---

## 5. Customers Controller

```typescript
// ============================================================
// modules/customers/customers.controller.ts
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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { LoyaltyPointsDto } from './dto/loyalty-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ===== DANH SACH KHACH HANG =====
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(@Query() query: QueryCustomerDto) {
    const result = await this.customersService.findAll(query);
    return {
      success: true,
      message: 'Lay danh sach khach hang thanh cong',
      data: result,
    };
  }

  // ===== TOP KHACH HANG =====
  @Get('top')
  @Roles(UserRole.ADMIN)
  async getTopCustomers(@Query('limit') limit?: number) {
    const result = await this.customersService.getTopCustomers(limit || 10);
    return {
      success: true,
      message: 'Lay top khach hang thanh cong',
      data: result,
    };
  }

  // ===== TRA CUU THEO DIEN THOAI (POS) =====
  @Get('phone/:phone')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findByPhone(@Param('phone') phone: string) {
    const customer = await this.customersService.findByPhone(phone);
    return {
      success: true,
      data: customer, // null neu khong tim thay
    };
  }

  // ===== CHI TIET KHACH HANG =====
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findById(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    return {
      success: true,
      data: customer,
    };
  }

  // ===== TAO KHACH HANG =====
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.customersService.create(dto);
    return {
      success: true,
      message: 'Tao khach hang thanh cong',
      data: customer,
    };
  }

  // ===== CAP NHAT KHACH HANG =====
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const customer = await this.customersService.update(id, dto);
    return {
      success: true,
      message: 'Cap nhat khach hang thanh cong',
      data: customer,
    };
  }

  // ===== THEM DIA CHI =====
  @Post(':id/addresses')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  async addAddress(@Param('id') id: string, @Body() dto: AddressDto, @Request() req) {
    // Customer chi duoc them dia chi cua chinh minh
    if (req.user.role === UserRole.CUSTOMER && req.user._id.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.addAddress(id, dto);
    return {
      success: true,
      message: 'Them dia chi thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // ===== CAP NHAT DIA CHI =====
  @Patch(':id/addresses/:index')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  async updateAddress(
    @Param('id') id: string,
    @Param('index') index: number,
    @Body() dto: AddressDto,
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.updateAddress(id, +index, dto);
    return {
      success: true,
      message: 'Cap nhat dia chi thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // ===== XOA DIA CHI =====
  @Delete(':id/addresses/:index')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  async removeAddress(
    @Param('id') id: string,
    @Param('index') index: number,
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.removeAddress(id, +index);
    return {
      success: true,
      message: 'Xoa dia chi thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // ===== DAT DIA CHI MAC DINH =====
  @Patch(':id/addresses/:index/default')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  async setDefaultAddress(
    @Param('id') id: string,
    @Param('index') index: number,
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.setDefaultAddress(id, +index);
    return {
      success: true,
      message: 'Dat dia chi mac dinh thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // ===== LICH SU DON HANG =====
  @Get(':id/orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  async getOrderHistory(
    @Param('id') id: string,
    @Query() query: { page?: number; limit?: number },
    @Request() req,
  ) {
    // Customer chi xem don cua chinh minh
    if (req.user.role === UserRole.CUSTOMER && req.user._id.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const result = await this.customersService.getOrderHistory(id, query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== THONG KE KHACH HANG =====
  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  async getCustomerStats(@Param('id') id: string) {
    const stats = await this.customersService.getCustomerStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  // ===== CONG DIEM LOYALTY =====
  @Post(':id/loyalty/add')
  @Roles(UserRole.ADMIN)
  async addLoyaltyPoints(
    @Param('id') id: string,
    @Body() dto: LoyaltyPointsDto,
  ) {
    const result = await this.customersService.addLoyaltyPoints(
      id,
      dto.points,
      dto.reason,
    );
    return {
      success: true,
      message: `Da cong ${dto.points} diem loyalty`,
      data: result,
    };
  }

  // ===== TRU DIEM LOYALTY =====
  @Post(':id/loyalty/deduct')
  @Roles(UserRole.ADMIN)
  async deductLoyaltyPoints(
    @Param('id') id: string,
    @Body() dto: LoyaltyPointsDto,
  ) {
    const result = await this.customersService.deductLoyaltyPoints(
      id,
      dto.points,
      dto.reason,
    );
    return {
      success: true,
      message: `Da tru ${dto.points} diem loyalty`,
      data: result,
    };
  }

  // ===== LICH SU DIEM LOYALTY =====
  @Get(':id/loyalty/history')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  async getLoyaltyHistory(@Param('id') id: string, @Request() req) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const history = await this.customersService.getLoyaltyHistory(id);
    return {
      success: true,
      data: history,
    };
  }
}
```

---

## 6. Bang API Endpoints

| #  | Method   | Endpoint                                   | Auth         | Mo ta                                |
|----|----------|--------------------------------------------|--------------|--------------------------------------|
| 1  | `GET`    | `/customers`                               | Admin, Staff | Danh sach khach hang (phan trang, tim kiem) |
| 2  | `GET`    | `/customers/top`                           | Admin        | Top khach hang theo tong chi tieu    |
| 3  | `GET`    | `/customers/phone/:phone`                  | Admin, Staff | Tra cuu nhanh theo SDT (POS)         |
| 4  | `GET`    | `/customers/:id`                           | Admin, Staff | Chi tiet khach hang + thong ke don   |
| 5  | `POST`   | `/customers`                               | Admin, Staff | Tao khach hang moi                   |
| 6  | `PATCH`  | `/customers/:id`                           | Admin, Staff | Cap nhat thong tin khach hang        |
| 7  | `POST`   | `/customers/:id/addresses`                 | Admin, Staff, Customer | Them dia chi giao hang     |
| 8  | `PATCH`  | `/customers/:id/addresses/:index`          | Admin, Staff, Customer | Cap nhat dia chi           |
| 9  | `DELETE` | `/customers/:id/addresses/:index`          | Admin, Staff, Customer | Xoa dia chi                |
| 10 | `PATCH`  | `/customers/:id/addresses/:index/default`  | Admin, Staff, Customer | Dat dia chi mac dinh       |
| 11 | `GET`    | `/customers/:id/orders`                    | Admin, Staff, Customer | Lich su don hang           |
| 12 | `GET`    | `/customers/:id/stats`                     | Admin        | Thong ke khach hang                  |
| 13 | `POST`   | `/customers/:id/loyalty/add`               | Admin        | Cong diem loyalty                    |
| 14 | `POST`   | `/customers/:id/loyalty/deduct`            | Admin        | Tru diem loyalty                     |
| 15 | `GET`    | `/customers/:id/loyalty/history`           | Admin, Customer | Lich su diem loyalty              |

---

## 7. Vi du Request/Response

### 7.1. Danh sach khach hang (tim kiem)

**Request:**

```http
GET /customers?search=Nguyen&page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lay danh sach khach hang thanh cong",
  "data": {
    "items": [
      {
        "_id": "6615a1a2b3c4d5e6f7a8b9c0",
        "fullName": "Nguyen Van An",
        "email": "nguyenvanan@gmail.com",
        "phone": "0901234567",
        "avatar": null,
        "role": "customer",
        "isActive": true,
        "addresses": [
          {
            "fullName": "Nguyen Van An",
            "phone": "0901234567",
            "street": "123 Nguyen Hue",
            "ward": "Ben Nghe",
            "district": "Quan 1",
            "province": "Ho Chi Minh",
            "isDefault": true
          }
        ],
        "loyaltyPoints": 1250,
        "createdAt": "2026-03-15T10:00:00.000Z",
        "updatedAt": "2026-04-01T08:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 7.2. Tra cuu nhanh theo SDT (POS)

**Request:**

```http
GET /customers/phone/0901234567
Authorization: Bearer <staff_jwt_token>
```

**Response (200 OK - tim thay):**

```json
{
  "success": true,
  "data": {
    "_id": "6615a1a2b3c4d5e6f7a8b9c0",
    "fullName": "Nguyen Van An",
    "phone": "0901234567",
    "email": "nguyenvanan@gmail.com",
    "loyaltyPoints": 1250,
    "addresses": [
      {
        "fullName": "Nguyen Van An",
        "phone": "0901234567",
        "street": "123 Nguyen Hue",
        "ward": "Ben Nghe",
        "district": "Quan 1",
        "province": "Ho Chi Minh",
        "isDefault": true
      }
    ]
  }
}
```

**Response (200 OK - khong tim thay):**

```json
{
  "success": true,
  "data": null
}
```

---

### 7.3. Tao khach hang (POS - chi can SDT)

**Request:**

```http
POST /customers
Authorization: Bearer <staff_jwt_token>
Content-Type: application/json

{
  "phone": "0987654321"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Tao khach hang thanh cong",
  "data": {
    "_id": "6615c3d4e5f6a7b8c9d0e1f2",
    "fullName": "Khach 4321",
    "phone": "0987654321",
    "email": "0987654321@placeholder.local",
    "role": "customer",
    "isActive": true,
    "addresses": [],
    "loyaltyPoints": 0,
    "createdAt": "2026-04-02T09:00:00.000Z",
    "updatedAt": "2026-04-02T09:00:00.000Z"
  }
}
```

---

### 7.4. Them dia chi giao hang

**Request:**

```http
POST /customers/6615a1a2b3c4d5e6f7a8b9c0/addresses
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "fullName": "Nguyen Van An",
  "phone": "0901234567",
  "street": "456 Le Loi",
  "ward": "Ben Thanh",
  "district": "Quan 1",
  "province": "Ho Chi Minh",
  "isDefault": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Them dia chi thanh cong",
  "data": {
    "addresses": [
      {
        "fullName": "Nguyen Van An",
        "phone": "0901234567",
        "street": "123 Nguyen Hue",
        "ward": "Ben Nghe",
        "district": "Quan 1",
        "province": "Ho Chi Minh",
        "isDefault": true
      },
      {
        "fullName": "Nguyen Van An",
        "phone": "0901234567",
        "street": "456 Le Loi",
        "ward": "Ben Thanh",
        "district": "Quan 1",
        "province": "Ho Chi Minh",
        "isDefault": false
      }
    ]
  }
}
```

---

### 7.5. Chi tiet khach hang (voi thong ke don)

**Request:**

```http
GET /customers/6615a1a2b3c4d5e6f7a8b9c0
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "6615a1a2b3c4d5e6f7a8b9c0",
    "fullName": "Nguyen Van An",
    "email": "nguyenvanan@gmail.com",
    "phone": "0901234567",
    "avatar": null,
    "role": "customer",
    "isActive": true,
    "addresses": [
      {
        "fullName": "Nguyen Van An",
        "phone": "0901234567",
        "street": "123 Nguyen Hue",
        "ward": "Ben Nghe",
        "district": "Quan 1",
        "province": "Ho Chi Minh",
        "isDefault": true
      }
    ],
    "loyaltyPoints": 1250,
    "totalOrders": 8,
    "totalSpent": 45600000,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-04-01T08:30:00.000Z"
  }
}
```

---

### 7.6. Thong ke khach hang

**Request:**

```http
GET /customers/6615a1a2b3c4d5e6f7a8b9c0/stats
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalOrders": 8,
    "totalSpent": 45600000,
    "avgOrderValue": 5700000,
    "lastOrderDate": "2026-04-01T08:30:00.000Z"
  }
}
```

---

### 7.7. Top khach hang

**Request:**

```http
GET /customers/top?limit=5
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lay top khach hang thanh cong",
  "data": [
    {
      "_id": "6615a1a2b3c4d5e6f7a8b9c0",
      "fullName": "Nguyen Van An",
      "phone": "0901234567",
      "email": "nguyenvanan@gmail.com",
      "avatar": null,
      "loyaltyPoints": 1250,
      "totalOrders": 8,
      "totalSpent": 45600000,
      "lastOrderDate": "2026-04-01T08:30:00.000Z"
    },
    {
      "_id": "6615a1a2b3c4d5e6f7a8b9c1",
      "fullName": "Tran Thi Binh",
      "phone": "0912345678",
      "email": "tranthbinh@gmail.com",
      "avatar": null,
      "loyaltyPoints": 980,
      "totalOrders": 5,
      "totalSpent": 32100000,
      "lastOrderDate": "2026-03-28T14:00:00.000Z"
    }
  ]
}
```

---

> **Ghi chu:**
> - Customer la User voi `role = 'customer'`. Module nay chi thao tac tren nhung user co role nay.
> - Khi staff tao customer qua POS chi can so dien thoai, he thong tu sinh ten tam (`Khach XXXX`) va email placeholder.
> - Customer co the tu quan ly dia chi cua minh, nhung chi duoc thao tac tren chinh account cua ho (kiem tra `req.user._id === id`).
> - Loyalty points hien tai duoc luu truc tiep trong User.loyaltyPoints. Lich su diem se duoc implement trong phien ban sau voi schema LoyaltyHistory rieng.
