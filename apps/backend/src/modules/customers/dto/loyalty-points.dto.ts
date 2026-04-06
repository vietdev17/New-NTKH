import { IsNotEmpty, IsInt, Min, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoyaltyPointsDto {
  @ApiProperty({ example: 100, description: 'So diem (phai lon hon 0)' })
  @IsNotEmpty()
  @IsInt({ message: 'So diem phai la so nguyen' })
  @Min(1, { message: 'So diem phai lon hon 0' })
  points: number;

  @ApiProperty({ example: 'Thuong don hang #ORD-001', description: 'Ly do dieu chinh diem' })
  @IsNotEmpty({ message: 'Ly do khong duoc de trong' })
  @IsString()
  @MaxLength(200)
  reason: string;
}
