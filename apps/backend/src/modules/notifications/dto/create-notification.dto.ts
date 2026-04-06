import { IsString, IsEnum, IsOptional, IsMongoId } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  actionUrl?: string; // VD: '/orders/FV-20260402-0001'

  @IsOptional()
  data?: Record<string, any>; // Du lieu bo sung (orderId, productId, ...)
}
