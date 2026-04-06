import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ShipperOrderFilter {
  ACTIVE = 'active',       // Don dang giao (in_transit)
  COMPLETED = 'completed', // Don da giao (delivered)
  ALL = 'all',
}

export class QueryShipperOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ShipperOrderFilter)
  filter?: ShipperOrderFilter = ShipperOrderFilter.ALL;
}
