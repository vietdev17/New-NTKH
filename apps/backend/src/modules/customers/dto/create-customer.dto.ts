import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty({ message: 'So dien thoai khong duoc de trong' })
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, {
    message: 'So dien thoai khong hop le (VD: 0901234567 hoac +84901234567)',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'customer@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email khong hop le' })
  email?: string;

  @ApiPropertyOptional({ example: 'Khach hang VIP' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
