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
import { UserRole } from '../schemas/user.schema';

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
  @ApiProperty({ description: 'Ho va ten day du', example: 'Le Van Shipper' })
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ description: 'Email (unique)', example: 'shipper01@furniture-vn.com' })
  @IsNotEmpty({ message: 'Email khong duoc de trong' })
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @ApiPropertyOptional({ description: 'Mat khau', example: 'MatKhau@123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({ description: 'So dien thoai', example: '0912345678' })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, { message: 'So dien thoai khong hop le' })
  phone?: string;

  @ApiPropertyOptional({ description: 'URL avatar' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Vai tro nguoi dung', enum: UserRole, default: UserRole.CUSTOMER })
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

  @ApiPropertyOptional({ description: 'Ma nhan vien (chi cho staff)', example: 'NV-001' })
  @IsOptional()
  @IsString()
  staffCode?: string;

  @ApiPropertyOptional({ description: 'Loai phuong tien (chi cho shipper)', example: 'Xe may' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ description: 'Bien so xe (chi cho shipper)', example: '59-X1 12345' })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsBoolean()
  isGoogleAuth?: boolean;
}
