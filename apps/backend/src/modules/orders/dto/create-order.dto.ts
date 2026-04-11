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
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/order.schema';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiPropertyOptional({ description: 'Variant SKU (null = san pham khong co bien the)' })
  @IsOptional()
  @IsString()
  variantSku?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'So luong phai >= 1' })
  quantity: number;
}

export class ShippingAddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Nguyen Hue' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: 'Phuong Ben Nghe' })
  @IsNotEmpty()
  @IsString()
  ward: string;

  @ApiProperty({ example: 'Quan 1' })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ example: 'Ho Chi Minh' })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ example: 10.8231 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 106.6297 })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Don hang phai co it nhat 1 san pham' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  @IsNotEmpty()
  @IsEnum(PaymentMethod, { message: 'Phuong thuc thanh toan khong hop le' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'NOITHAT20' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Giao trong gio hanh chinh', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
