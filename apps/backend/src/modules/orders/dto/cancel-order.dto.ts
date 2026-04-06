import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Khach hang doi y khong muon mua nua', maxLength: 500 })
  @IsNotEmpty({ message: 'Ly do huy don khong duoc de trong' })
  @IsString()
  @MaxLength(500)
  reason: string;
}
