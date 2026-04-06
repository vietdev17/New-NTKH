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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, CouponScope } from '../../coupons/schemas/coupon.schema';

export class CreateCouponDto {
  @ApiProperty({ example: 'NOITHAT20', maxLength: 50 })
  @IsNotEmpty({ message: 'Ma coupon khong duoc de trong' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 'Giam 20% cho tat ca san pham noi that, toi da 500k', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsNotEmpty()
  @IsEnum(DiscountType, { message: 'Loai giam gia khong hop le' })
  discountType: DiscountType;

  @ApiProperty({ example: 20, minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Gia tri giam phai >= 0' })
  discountValue: number;

  @ApiPropertyOptional({ example: 1000000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ example: 500000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @IsNotEmpty({ message: 'Ngay bat dau khong duoc de trong' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-04-30T23:59:59.000Z' })
  @IsNotEmpty({ message: 'Ngay ket thuc khong duoc de trong' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 100, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsage?: number;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: CouponScope, example: CouponScope.ALL })
  @IsOptional()
  @IsEnum(CouponScope, { message: 'Scope khong hop le' })
  scope?: CouponScope;

  @ApiPropertyOptional({ type: [String], description: 'Danh sach category ID (khi scope = CATEGORY)' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  applicableCategories?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Danh sach product ID (khi scope = PRODUCT)' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  applicableProducts?: string[];
}
