import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CouponFilter {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ALL = 'all',
}

export class QueryCouponDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CouponFilter, default: CouponFilter.ALL })
  @IsOptional()
  @IsEnum(CouponFilter)
  filter?: CouponFilter = CouponFilter.ALL;

  @ApiPropertyOptional({ example: 'all', description: 'Loc theo scope: all | category | product' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ example: 'NOITHAT', description: 'Tim kiem theo code hoac mo ta' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
