import { IsOptional, IsEnum, IsNumberString } from 'class-validator';

export class QueryNotificationDto {
  @IsOptional()
  @IsNumberString()
  page?: string; // Default: '1'

  @IsOptional()
  @IsNumberString()
  limit?: string; // Default: '20'

  @IsOptional()
  @IsEnum(['true', 'false'])
  unreadOnly?: string; // Default: 'false'

  @IsOptional()
  @IsEnum([
    'order_created',
    'order_status_changed',
    'payment_received',
    'shipper_assigned',
    'low_stock',
    'new_review',
    'return_requested',
    'system',
  ])
  type?: string;
}
