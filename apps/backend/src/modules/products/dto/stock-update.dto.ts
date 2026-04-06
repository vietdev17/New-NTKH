import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StockOperation {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
}

export class StockUpdateDto {
  @ApiProperty({ description: 'SKU cua variant can cap nhat ton kho' })
  @IsString()
  variantSku: string;

  @ApiProperty({ description: 'So luong', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Loai phep tinh ton kho', enum: StockOperation })
  @IsEnum(StockOperation)
  operation: StockOperation;
}
