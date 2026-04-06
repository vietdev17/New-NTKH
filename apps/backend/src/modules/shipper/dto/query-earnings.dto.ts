import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum EarningsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class QueryEarningsDto {
  @IsOptional()
  @IsEnum(EarningsPeriod)
  groupBy?: EarningsPeriod = EarningsPeriod.DAY;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
