import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseShiftDto {
  @ApiProperty({ description: 'Số tiền mặt cuối ca', example: 1500000 })
  @IsNumber({}, { message: 'Số tiền cuối ca phải là số' })
  @Min(0, { message: 'Số tiền cuối ca không được âm' })
  closingBalance: number;

  @ApiPropertyOptional({ description: 'Ghi chú ca làm' })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  note?: string;
}
