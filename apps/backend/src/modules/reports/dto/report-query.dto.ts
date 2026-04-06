import { IsOptional, IsDateString, IsEnum, IsNumberString } from 'class-validator';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string; // ISO date: '2026-03-01'

  @IsOptional()
  @IsDateString()
  endDate?: string; // ISO date: '2026-03-31'

  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month'; // Default: 'day'

  @IsOptional()
  @IsNumberString()
  limit?: string; // Default: '10' (cho top products, top customers)
}
