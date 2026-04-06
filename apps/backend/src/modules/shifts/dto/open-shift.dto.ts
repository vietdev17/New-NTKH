import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({ description: 'Số tiền mặt đầu ca', example: 500000 })
  @IsNumber({}, { message: 'Số tiền đầu ca phải là số' })
  @Min(0, { message: 'Số tiền đầu ca không được âm' })
  openingBalance: number;
}
