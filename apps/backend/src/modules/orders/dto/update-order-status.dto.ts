import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  @IsNotEmpty()
  @IsEnum(OrderStatus, { message: 'Trang thai don hang khong hop le' })
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Da kiem tra don hang', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ description: 'URL anh chung minh giao hang (bat buoc khi chuyen sang DELIVERED)' })
  @IsOptional()
  @IsString()
  deliveryProofImage?: string;
}
