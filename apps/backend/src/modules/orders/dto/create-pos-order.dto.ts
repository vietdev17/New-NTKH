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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/order.schema';

export class PosOrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsNotEmpty()
  @IsMongoId()
  productId: string;

  @ApiPropertyOptional({ description: 'Variant SKU' })
  @IsOptional()
  @IsString()
  variantSku?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePosOrderDto {
  @ApiPropertyOptional({ description: 'Customer ID (co the bo trong neu khach vang lai)' })
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({ type: [PosOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @ApiProperty({ enum: ['cash', 'bank_transfer', 'cod', 'deposit_cash', 'deposit_bank'], example: 'cash' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'NOITHAT20' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 5000000, description: 'Tien khach dua (voi thanh toan tien mat)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashReceived?: number;

  @ApiPropertyOptional({ example: 'Khach mua truc tiep tai cua hang' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'So tien dat coc (neu khach dat coc)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  // Shipping address (khi giao hang)
  @ApiPropertyOptional({ example: 'Nguyen Van B' })
  @IsOptional()
  @IsString()
  shippingFullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @ApiPropertyOptional({ example: '123 Nguyen Hue' })
  @IsOptional()
  @IsString()
  shippingStreet?: string;

  @ApiPropertyOptional({ example: 'Phuong Ben Nghe' })
  @IsOptional()
  @IsString()
  shippingWard?: string;

  @ApiPropertyOptional({ example: 'Quan 1' })
  @IsOptional()
  @IsString()
  shippingDistrict?: string;

  @ApiPropertyOptional({ example: 'TP Ho Chi Minh' })
  @IsOptional()
  @IsString()
  shippingProvince?: string;
}
