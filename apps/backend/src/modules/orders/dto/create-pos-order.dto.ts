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

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsNotEmpty()
  @IsEnum(PaymentMethod, {
    message: 'Phuong thuc thanh toan: cash | bank_transfer',
  })
  paymentMethod: PaymentMethod;

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
}
