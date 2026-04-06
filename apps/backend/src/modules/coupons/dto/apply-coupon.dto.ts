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
import { ApiProperty } from '@nestjs/swagger';

export class CouponOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiProperty({ description: 'Category ID cua san pham' })
  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @ApiProperty({ example: 2500000, minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'NOITHAT20' })
  @IsNotEmpty({ message: 'Ma coupon khong duoc de trong' })
  @IsString()
  code: string;

  @ApiProperty({ type: [CouponOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CouponOrderItemDto)
  items: CouponOrderItemDto[];

  @ApiProperty({ example: 5000000, minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;
}
