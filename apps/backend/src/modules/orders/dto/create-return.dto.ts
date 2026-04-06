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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReturnReason } from '../schemas/return.schema';

export class ReturnItemDto {
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
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: ReturnReason, example: ReturnReason.DEFECTIVE })
  @IsNotEmpty()
  @IsEnum(ReturnReason, { message: 'Ly do tra hang khong hop le' })
  reason: ReturnReason;

  @ApiPropertyOptional({ example: 'San pham bi vo goc', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateReturnDto {
  @ApiProperty({ description: 'Order ID' })
  @IsNotEmpty()
  @IsMongoId()
  orderId: string;

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phai co it nhat 1 san pham tra hang' })
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @ApiPropertyOptional({ example: 'San pham bi hong khi nhan', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNote?: string;

  @ApiPropertyOptional({ type: [String], description: 'URL anh chung minh' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
