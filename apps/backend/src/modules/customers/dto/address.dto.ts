import { IsNotEmpty, IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '0912345678' })
  @IsNotEmpty({ message: 'So dien thoai khong duoc de trong' })
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, { message: 'So dien thoai khong hop le' })
  phone: string;

  @ApiProperty({ example: '123 Nguyen Hue' })
  @IsNotEmpty({ message: 'Dia chi duong khong duoc de trong' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Phuong Ben Thanh' })
  @IsNotEmpty({ message: 'Phuong/Xa khong duoc de trong' })
  @IsString()
  ward: string;

  @ApiProperty({ example: 'Quan 1' })
  @IsNotEmpty({ message: 'Quan/Huyen khong duoc de trong' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'TP Ho Chi Minh' })
  @IsNotEmpty({ message: 'Tinh/Thanh pho khong duoc de trong' })
  @IsString()
  province: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
