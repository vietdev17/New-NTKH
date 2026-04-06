# USERS MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module quan ly nguoi dung: CRUD, phan quyen, quan ly staff/shipper
> Phien ban: 2.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Cau truc thu muc](#1-cau-truc-thu-muc)
2. [users.module.ts](#2-usersmodulets)
3. [DTOs](#3-dtos)
4. [UsersService](#4-usersservice)
5. [UsersController](#5-userscontroller)
6. [Bang API Endpoints](#6-bang-api-endpoints)
7. [Vi du Request / Response](#7-vi-du-request--response)

---

## 1. Cau truc thu muc

```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    └── query-user.dto.ts
```

---

## 2. users.module.ts

```typescript
// ============================================================
// src/modules/users/users.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // Export de AuthModule su dung
})
export class UsersModule {}
```

---

## 3. DTOs

### 3.1 CreateUserDto

> Dung boi admin de tao user thu cong (staff, shipper, ...).
> Khac voi RegisterDto (chi tao customer).

```typescript
// ============================================================
// src/modules/users/dto/create-user.dto.ts
// ============================================================
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../enums/user-role.enum';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyen Van An' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0912345678' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/)
  phone: string;

  @ApiProperty({ example: '456 Le Loi' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: 'Phuong Ben Thanh' })
  @IsNotEmpty()
  @IsString()
  ward: string;

  @ApiProperty({ example: 'Quan 1' })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ example: 'TP Ho Chi Minh' })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Ho va ten day du',
    example: 'Le Van Shipper',
  })
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Email (unique)',
    example: 'shipper01@furniture-vn.com',
  })
  @IsNotEmpty({ message: 'Email khong duoc de trong' })
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @ApiPropertyOptional({
    description: 'Mat khau (bo qua neu tao tu Google OAuth)',
    example: 'MatKhau@123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({
    description: 'So dien thoai',
    example: '0912345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, {
    message: 'So dien thoai khong hop le',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL avatar',
    example: 'https://res.cloudinary.com/furniture-vn/avatars/user1.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Vai tro nguoi dung',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role khong hop le' })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Trang thai active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Danh sach dia chi' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses?: CreateAddressDto[];

  // ---- Staff fields ----
  @ApiPropertyOptional({
    description: 'Ma nhan vien (chi cho staff)',
    example: 'NV-001',
  })
  @IsOptional()
  @IsString()
  staffCode?: string;

  // ---- Shipper fields ----
  @ApiPropertyOptional({
    description: 'Loai phuong tien (chi cho shipper)',
    example: 'Xe may',
  })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({
    description: 'Bien so xe (chi cho shipper)',
    example: '59-X1 12345',
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  // ---- Google OAuth fields (internal use) ----
  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsBoolean()
  isGoogleAuth?: boolean;
}
```

### 3.2 UpdateUserDto

```typescript
// ============================================================
// src/modules/users/dto/update-user.dto.ts
// ============================================================
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * PartialType: tat ca truong tro thanh optional.
 * OmitType: loai bo cac truong khong duoc phep update truc tiep.
 *   - email: khong cho doi email (de dam bao unique + bao mat)
 *   - googleId: chi set tu Google OAuth flow
 *   - isGoogleAuth: chi set tu Google OAuth flow
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'googleId', 'isGoogleAuth'] as const),
) {}
```

> **Luu y:** UpdateUserDto ke thua tat ca truong tu CreateUserDto nhung:
> - Tat ca optional (PartialType)
> - Khong co `email`, `googleId`, `isGoogleAuth` (OmitType)
> - Ngoai ra, AuthService co the goi `usersService.update()` voi cac truong internal
>   nhu `refreshToken`, `resetPasswordToken`, `lastLoginAt` thong qua generic update.

### 3.3 QueryUserDto

```typescript
// ============================================================
// src/modules/users/dto/query-user.dto.ts
// ============================================================
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '../../../enums/user-role.enum';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Loc theo role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Loc theo trang thai active',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Hien thi ca user da xoa (mac dinh: false)',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Tim kiem theo ten hoac email',
    example: 'nguyen',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## 4. UsersService

> Service chinh cho CRUD nguoi dung.
> Duoc su dung boi AuthModule (export) va UsersController.

```typescript
// ============================================================
// src/modules/users/users.service.ts
// ============================================================
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';

import { User, UserDocument } from '../../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserRole } from '../../enums/user-role.enum';
import { ShipperStatus } from '../../enums/shipper-status.enum';
import {
  PaginatedResponse,
  paginate,
} from '../../common/dto/paginated-response.dto';
import {
  BusinessException,
  BusinessErrors,
} from '../../common/exceptions/business.exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ============================================================
  // FIND ALL - Danh sach users voi phan trang va filter
  // ============================================================
  async findAll(query: QueryUserDto): Promise<PaginatedResponse<User>> {
    const filter: FilterQuery<User> = {};

    // Mac dinh khong hien thi user da soft delete
    if (!query.includeDeleted) {
      filter.isDeleted = false;
    }

    // Loc theo role
    if (query.role) {
      filter.role = query.role;
    }

    // Loc theo active status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    // Tim kiem theo ten hoac email
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    return paginate(this.userModel, query, filter, {
      select: '-password -refreshToken -resetPasswordToken -resetPasswordExpires',
      lean: true,
    });
  }

  // ============================================================
  // FIND BY ID
  // ============================================================
  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();
  }

  // ============================================================
  // FIND BY EMAIL
  // ============================================================
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();
  }

  // ============================================================
  // FIND BY EMAIL WITH PASSWORD (cho AuthService.login)
  // ============================================================
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean()
      .exec();
  }

  // ============================================================
  // FIND BY ID WITH REFRESH TOKEN (cho AuthService.refreshToken)
  // ============================================================
  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .select('+refreshToken')
      .lean()
      .exec();
  }

  // ============================================================
  // FIND BY PHONE
  // ============================================================
  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ phone, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();
  }

  // ============================================================
  // FIND BY GOOGLE ID (cho Google OAuth)
  // ============================================================
  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ googleId, isDeleted: false })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();
  }

  // ============================================================
  // FIND BY RESET TOKEN (cho forgot/reset password)
  // ============================================================
  async findByResetToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
        isDeleted: false,
      })
      .select('+resetPasswordToken +resetPasswordExpires')
      .lean()
      .exec();
  }

  // ============================================================
  // CREATE - Tao user moi
  // ============================================================
  async create(dto: CreateUserDto): Promise<UserDocument> {
    // Kiem tra email trung
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new BusinessException(BusinessErrors.EMAIL_EXISTS);
    }

    // Kiem tra phone trung (neu co)
    if (dto.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: dto.phone,
        isDeleted: false,
      });
      if (existingPhone) {
        throw new BusinessException(BusinessErrors.PHONE_EXISTS);
      }
    }

    const user = new this.userModel({
      ...dto,
      email: dto.email.toLowerCase(),
      role: dto.role || UserRole.CUSTOMER,
      isActive: dto.isActive ?? true,
    });

    const savedUser = await user.save();
    this.logger.log(`User created: ${savedUser.email} (role: ${savedUser.role})`);

    // Tra ve user khong co password va tokens
    return this.findById(savedUser._id.toString());
  }

  // ============================================================
  // UPDATE - Cap nhat thong tin user
  // ============================================================
  async update(id: string, dto: Partial<UpdateUserDto> & Record<string, any>): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    // Kiem tra phone trung khi cap nhat (neu co)
    if (dto.phone) {
      const existingPhone = await this.userModel.findOne({
        phone: dto.phone,
        _id: { $ne: id },
        isDeleted: false,
      });
      if (existingPhone) {
        throw new BusinessException(BusinessErrors.PHONE_EXISTS);
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true, runValidators: true },
      )
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .lean()
      .exec();

    if (!updatedUser) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    this.logger.log(`User updated: ${updatedUser.email}`);
    return updatedUser;
  }

  // ============================================================
  // SOFT DELETE - Xoa mem (dat isDeleted = true)
  // ============================================================
  async softDelete(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    if (user.isDeleted) {
      throw new BusinessException({
        code: 'USER_ALREADY_DELETED',
        message: 'Nguoi dung da bi xoa truoc do',
      });
    }

    // Khong cho xoa chinh minh (se duoc kiem tra o controller)
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;
    user.refreshToken = null;

    await user.save();
    this.logger.log(`User soft-deleted: ${user.email}`);

    return this.findById(id);
  }

  // ============================================================
  // CHANGE ROLE - Thay doi vai tro user (admin only)
  // ============================================================
  async changeRole(id: string, role: UserRole): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    const user = await this.userModel.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    // Khong cho doi role cua admin khac (bao ve)
    if (user.role === UserRole.ADMIN) {
      throw new BusinessException({
        code: 'CANNOT_CHANGE_ADMIN_ROLE',
        message: 'Khong the thay doi role cua admin khac',
      });
    }

    // Neu chuyen thanh shipper, set trang thai mac dinh
    if (role === UserRole.SHIPPER && user.role !== UserRole.SHIPPER) {
      user.status = ShipperStatus.OFFLINE;
    }

    // Neu chuyen tu shipper sang role khac, xoa cac truong shipper
    if (user.role === UserRole.SHIPPER && role !== UserRole.SHIPPER) {
      user.status = null;
      user.vehicleType = null;
      user.licensePlate = null;
    }

    user.role = role;
    await user.save();

    this.logger.log(`User role changed: ${user.email} -> ${role}`);

    return this.findById(id);
  }

  // ============================================================
  // GET STAFF - Danh sach staff va manager
  // ============================================================
  async getStaff(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        role: { $in: [UserRole.STAFF, UserRole.MANAGER] },
        isDeleted: false,
      })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .sort({ role: 1, fullName: 1 })
      .lean()
      .exec();
  }

  // ============================================================
  // GET SHIPPERS - Danh sach shipper
  // ============================================================
  async getShippers(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        role: UserRole.SHIPPER,
        isDeleted: false,
      })
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .sort({ isActive: -1, status: 1, fullName: 1 })
      .lean()
      .exec();
  }

  // ============================================================
  // ACTIVATE SHIPPER - Kich hoat tai khoan shipper
  // ============================================================
  async activateShipper(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: id,
      role: UserRole.SHIPPER,
      isDeleted: false,
    });

    if (!user) {
      throw new BusinessException({
        code: 'SHIPPER_NOT_FOUND',
        message: 'Shipper khong ton tai',
      });
    }

    if (user.isActive) {
      throw new BusinessException({
        code: 'SHIPPER_ALREADY_ACTIVE',
        message: 'Shipper da duoc kich hoat',
      });
    }

    user.isActive = true;
    user.status = ShipperStatus.OFFLINE;
    await user.save();

    this.logger.log(`Shipper activated: ${user.email}`);

    return this.findById(id);
  }

  // ============================================================
  // DEACTIVATE SHIPPER - Vo hieu hoa tai khoan shipper
  // ============================================================
  async deactivateShipper(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({
      _id: id,
      role: UserRole.SHIPPER,
      isDeleted: false,
    });

    if (!user) {
      throw new BusinessException({
        code: 'SHIPPER_NOT_FOUND',
        message: 'Shipper khong ton tai',
      });
    }

    if (!user.isActive) {
      throw new BusinessException({
        code: 'SHIPPER_ALREADY_INACTIVE',
        message: 'Shipper da bi vo hieu hoa',
      });
    }

    user.isActive = false;
    user.status = ShipperStatus.OFFLINE;
    user.refreshToken = null; // Buoc dang xuat
    await user.save();

    this.logger.log(`Shipper deactivated: ${user.email}`);

    return this.findById(id);
  }
}
```

---

## 5. UsersController

> Controller quan ly user - chi danh cho Admin (va mot so endpoint cho Manager).
> Tat ca endpoint yeu cau JWT + RolesGuard.

```typescript
// ============================================================
// src/modules/users/users.controller.ts
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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { TokenPayload } from '../auth/auth.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---- GET ALL USERS (Admin) ----
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Danh sach tat ca nguoi dung (Admin)' })
  @ApiResponse({ status: 200, description: 'Danh sach user co phan trang' })
  @ApiResponse({ status: 403, description: 'Forbidden - Khong phai Admin' })
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  // ---- GET STAFF LIST (Admin, Manager) ----
  // Luu y: Route nay phai dat TRUOC route /:id de tranh conflict
  @Get('staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Danh sach staff va manager' })
  @ApiResponse({ status: 200, description: 'Danh sach staff' })
  async getStaff() {
    return this.usersService.getStaff();
  }

  // ---- GET SHIPPERS LIST (Admin, Manager) ----
  @Get('shippers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Danh sach shipper' })
  @ApiResponse({ status: 200, description: 'Danh sach shipper' })
  async getShippers() {
    return this.usersService.getShippers();
  }

  // ---- GET USER BY ID (Admin) ----
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lay thong tin user theo ID (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Thong tin user' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('Nguoi dung khong ton tai');
    }
    return user;
  }

  // ---- CREATE USER (Admin) ----
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tao nguoi dung moi (Admin)' })
  @ApiResponse({ status: 201, description: 'User da duoc tao' })
  @ApiResponse({ status: 400, description: 'Email/Phone da ton tai' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ---- UPDATE USER (Admin) ----
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cap nhat thong tin user (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User da duoc cap nhat' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  // ---- DELETE USER - Soft delete (Admin) ----
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoa nguoi dung - soft delete (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User da bi xoa' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    // Khong cho admin tu xoa chinh minh
    if (user.sub === id) {
      throw new ForbiddenException('Khong the tu xoa tai khoan cua minh');
    }
    return this.usersService.softDelete(id);
  }

  // ---- CHANGE ROLE (Admin) ----
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Thay doi role cua user (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role da duoc cap nhat' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser() user: TokenPayload,
  ) {
    // Khong cho admin tu doi role cua minh
    if (user.sub === id) {
      throw new ForbiddenException('Khong the tu thay doi role cua minh');
    }
    return this.usersService.changeRole(id, role);
  }

  // ---- ACTIVATE SHIPPER (Admin, Manager) ----
  @Patch(':id/activate-shipper')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Kich hoat tai khoan shipper' })
  @ApiParam({ name: 'id', description: 'Shipper User ID' })
  @ApiResponse({ status: 200, description: 'Shipper da duoc kich hoat' })
  async activateShipper(@Param('id') id: string) {
    return this.usersService.activateShipper(id);
  }

  // ---- DEACTIVATE SHIPPER (Admin, Manager) ----
  @Patch(':id/deactivate-shipper')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Vo hieu hoa tai khoan shipper' })
  @ApiParam({ name: 'id', description: 'Shipper User ID' })
  @ApiResponse({ status: 200, description: 'Shipper da bi vo hieu hoa' })
  async deactivateShipper(@Param('id') id: string) {
    return this.usersService.deactivateShipper(id);
  }
}
```

---

## 6. Bang API Endpoints

| Method | Endpoint | Auth | Role | Mo ta |
|--------|----------|------|------|-------|
| `GET` | `/api/v1/users` | JWT | Admin | Danh sach users (phan trang, filter) |
| `GET` | `/api/v1/users/staff` | JWT | Admin, Manager | Danh sach staff va manager |
| `GET` | `/api/v1/users/shippers` | JWT | Admin, Manager | Danh sach shipper |
| `GET` | `/api/v1/users/:id` | JWT | Admin | Chi tiet user theo ID |
| `POST` | `/api/v1/users` | JWT | Admin | Tao user moi (staff, shipper, ...) |
| `PATCH` | `/api/v1/users/:id` | JWT | Admin | Cap nhat thong tin user |
| `DELETE` | `/api/v1/users/:id` | JWT | Admin | Xoa user (soft delete) |
| `PATCH` | `/api/v1/users/:id/role` | JWT | Admin | Thay doi role cua user |
| `PATCH` | `/api/v1/users/:id/activate-shipper` | JWT | Admin, Manager | Kich hoat shipper |
| `PATCH` | `/api/v1/users/:id/deactivate-shipper` | JWT | Admin, Manager | Vo hieu hoa shipper |

### Query Parameters cho GET /users

| Parameter | Type | Default | Mo ta |
|-----------|------|---------|-------|
| `page` | number | 1 | So trang |
| `limit` | number | 10 | So item moi trang (1-100) |
| `sortBy` | string | createdAt | Truong sap xep |
| `sortOrder` | string | desc | asc / desc |
| `search` | string | - | Tim kiem theo ten, email, phone |
| `role` | string | - | Loc theo role (admin, manager, staff, customer, shipper) |
| `isActive` | boolean | - | Loc theo trang thai active |
| `includeDeleted` | boolean | false | Hien thi ca user da xoa |

---

## 7. Vi du Request / Response

### 7.1 Danh sach users (phan trang + filter)

**Request:**
```http
GET /api/v1/users?page=1&limit=5&role=customer&search=nguyen&sortBy=createdAt&sortOrder=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "660a1b2c3d4e5f6a7b8c9d0e",
        "fullName": "Nguyen Thi Lan",
        "email": "nguyenlan@gmail.com",
        "phone": "0912345678",
        "avatar": null,
        "role": "customer",
        "isActive": true,
        "isDeleted": false,
        "addresses": [],
        "loyaltyPoints": 2500,
        "lastLoginAt": "2026-04-01T14:20:00.000Z",
        "createdAt": "2026-03-20T10:00:00.000Z",
        "updatedAt": "2026-04-01T14:20:00.000Z"
      },
      {
        "_id": "660b2c3d4e5f6a7b8c9d0e1f",
        "fullName": "Nguyen Van Binh",
        "email": "vanbinh@gmail.com",
        "phone": "0987654321",
        "avatar": "https://res.cloudinary.com/furniture-vn/avatars/binh.jpg",
        "role": "customer",
        "isActive": true,
        "isDeleted": false,
        "addresses": [
          {
            "fullName": "Nguyen Van Binh",
            "phone": "0987654321",
            "street": "789 Tran Hung Dao",
            "ward": "Pham Ngu Lao",
            "district": "Quan 1",
            "province": "TP Ho Chi Minh",
            "isDefault": true
          }
        ],
        "loyaltyPoints": 800,
        "lastLoginAt": "2026-03-30T09:15:00.000Z",
        "createdAt": "2026-03-18T08:30:00.000Z",
        "updatedAt": "2026-03-30T09:15:00.000Z"
      }
    ],
    "meta": {
      "currentPage": 1,
      "itemsPerPage": 5,
      "totalItems": 23,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:30:00.000Z"
}
```

### 7.2 Tao user moi (shipper)

**Request:**
```http
POST /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "fullName": "Pham Van Tai Xe",
  "email": "taixe01@furniture-vn.com",
  "password": "Shipper@123",
  "phone": "0909123456",
  "role": "shipper",
  "vehicleType": "Xe may",
  "licensePlate": "59-X1 12345"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "660c3d4e5f6a7b8c9d0e1f2a",
    "fullName": "Pham Van Tai Xe",
    "email": "taixe01@furniture-vn.com",
    "phone": "0909123456",
    "avatar": null,
    "role": "shipper",
    "isActive": true,
    "isDeleted": false,
    "addresses": [],
    "loyaltyPoints": 0,
    "vehicleType": "Xe may",
    "licensePlate": "59-X1 12345",
    "status": null,
    "lastLoginAt": null,
    "createdAt": "2026-04-02T10:35:00.000Z",
    "updatedAt": "2026-04-02T10:35:00.000Z"
  },
  "message": "Tao thanh cong",
  "timestamp": "2026-04-02T10:35:00.000Z"
}
```

### 7.3 Cap nhat user

**Request:**
```http
PATCH /api/v1/users/660a1b2c3d4e5f6a7b8c9d0e
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "fullName": "Nguyen Thi Lan Anh",
  "phone": "0912345999",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "660a1b2c3d4e5f6a7b8c9d0e",
    "fullName": "Nguyen Thi Lan Anh",
    "email": "nguyenlan@gmail.com",
    "phone": "0912345999",
    "avatar": null,
    "role": "customer",
    "isActive": true,
    "isDeleted": false,
    "addresses": [],
    "loyaltyPoints": 2500,
    "lastLoginAt": "2026-04-01T14:20:00.000Z",
    "createdAt": "2026-03-20T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:40:00.000Z"
  },
  "message": "Cap nhat thanh cong",
  "timestamp": "2026-04-02T10:40:00.000Z"
}
```

### 7.4 Thay doi role

**Request:**
```http
PATCH /api/v1/users/660b2c3d4e5f6a7b8c9d0e1f/role
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "role": "staff"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "660b2c3d4e5f6a7b8c9d0e1f",
    "fullName": "Nguyen Van Binh",
    "email": "vanbinh@gmail.com",
    "phone": "0987654321",
    "role": "staff",
    "isActive": true,
    "createdAt": "2026-03-18T08:30:00.000Z",
    "updatedAt": "2026-04-02T10:42:00.000Z"
  },
  "message": "Cap nhat thanh cong",
  "timestamp": "2026-04-02T10:42:00.000Z"
}
```

**Response (400) - Doi role admin:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Khong the thay doi role cua admin khac",
  "errorCode": "CANNOT_CHANGE_ADMIN_ROLE"
}
```

### 7.5 Soft delete user

**Request:**
```http
DELETE /api/v1/users/660a1b2c3d4e5f6a7b8c9d0e
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "660a1b2c3d4e5f6a7b8c9d0e",
    "fullName": "Nguyen Thi Lan Anh",
    "email": "nguyenlan@gmail.com",
    "role": "customer",
    "isActive": false,
    "isDeleted": true,
    "deletedAt": "2026-04-02T10:45:00.000Z"
  },
  "message": "Xoa thanh cong",
  "timestamp": "2026-04-02T10:45:00.000Z"
}
```

**Response (403) - Tu xoa chinh minh:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Khong the tu xoa tai khoan cua minh"
}
```

### 7.6 Danh sach staff

**Request:**
```http
GET /api/v1/users/staff
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "660d4e5f6a7b8c9d0e1f2a3b",
      "fullName": "Tran Van Quan Ly",
      "email": "quanly@furniture-vn.com",
      "phone": "0901111111",
      "role": "manager",
      "isActive": true,
      "staffCode": "QL-001",
      "lastLoginAt": "2026-04-02T08:00:00.000Z"
    },
    {
      "_id": "660e5f6a7b8c9d0e1f2a3b4c",
      "fullName": "Le Thi Nhan Vien",
      "email": "nhanvien01@furniture-vn.com",
      "phone": "0902222222",
      "role": "staff",
      "isActive": true,
      "staffCode": "NV-001",
      "lastLoginAt": "2026-04-02T07:30:00.000Z"
    }
  ],
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:50:00.000Z"
}
```

### 7.7 Danh sach shippers

**Request:**
```http
GET /api/v1/users/shippers
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "660c3d4e5f6a7b8c9d0e1f2a",
      "fullName": "Pham Van Tai Xe",
      "email": "taixe01@furniture-vn.com",
      "phone": "0909123456",
      "role": "shipper",
      "isActive": true,
      "vehicleType": "Xe may",
      "licensePlate": "59-X1 12345",
      "status": "available",
      "lastLoginAt": "2026-04-02T06:00:00.000Z"
    },
    {
      "_id": "660f6a7b8c9d0e1f2a3b4c5d",
      "fullName": "Hoang Van Giao",
      "email": "taixe02@furniture-vn.com",
      "phone": "0909654321",
      "role": "shipper",
      "isActive": true,
      "vehicleType": "Xe tai nho",
      "licensePlate": "51D-12345",
      "status": "busy",
      "lastLoginAt": "2026-04-02T07:00:00.000Z"
    },
    {
      "_id": "6610a7b8c9d0e1f2a3b4c5d6",
      "fullName": "Vo Minh Tam",
      "email": "taixe03@furniture-vn.com",
      "phone": "0909111222",
      "role": "shipper",
      "isActive": false,
      "vehicleType": "Xe may",
      "licensePlate": "59-C1 67890",
      "status": "offline",
      "lastLoginAt": "2026-03-28T10:00:00.000Z"
    }
  ],
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:55:00.000Z"
}
```

### 7.8 Kich hoat shipper

**Request:**
```http
PATCH /api/v1/users/6610a7b8c9d0e1f2a3b4c5d6/activate-shipper
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "6610a7b8c9d0e1f2a3b4c5d6",
    "fullName": "Vo Minh Tam",
    "email": "taixe03@furniture-vn.com",
    "phone": "0909111222",
    "role": "shipper",
    "isActive": true,
    "vehicleType": "Xe may",
    "licensePlate": "59-C1 67890",
    "status": "offline",
    "lastLoginAt": "2026-03-28T10:00:00.000Z",
    "updatedAt": "2026-04-02T11:00:00.000Z"
  },
  "message": "Cap nhat thanh cong",
  "timestamp": "2026-04-02T11:00:00.000Z"
}
```

### 7.9 Vo hieu hoa shipper

**Request:**
```http
PATCH /api/v1/users/660c3d4e5f6a7b8c9d0e1f2a/deactivate-shipper
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "660c3d4e5f6a7b8c9d0e1f2a",
    "fullName": "Pham Van Tai Xe",
    "email": "taixe01@furniture-vn.com",
    "phone": "0909123456",
    "role": "shipper",
    "isActive": false,
    "vehicleType": "Xe may",
    "licensePlate": "59-X1 12345",
    "status": "offline",
    "updatedAt": "2026-04-02T11:05:00.000Z"
  },
  "message": "Cap nhat thanh cong",
  "timestamp": "2026-04-02T11:05:00.000Z"
}
```

**Response (400) - Shipper da bi vo hieu hoa:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Shipper da bi vo hieu hoa",
  "errorCode": "SHIPPER_ALREADY_INACTIVE"
}
```
