import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Ho va ten day du',
    example: 'Nguyen Van An',
  })
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong' })
  @IsString()
  @MaxLength(100, { message: 'Ho ten toi da 100 ky tu' })
  fullName: string;

  @ApiProperty({
    description: 'Dia chi email',
    example: 'nguyenvanan@gmail.com',
  })
  @IsNotEmpty({ message: 'Email khong duoc de trong' })
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @ApiProperty({
    description: 'Mat khau (toi thieu 6 ky tu)',
    example: 'MatKhau@123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong' })
  @IsString()
  @MinLength(6, { message: 'Mat khau phai co it nhat 6 ky tu' })
  @MaxLength(50, { message: 'Mat khau toi da 50 ky tu' })
  password: string;

  @ApiPropertyOptional({
    description: 'So dien thoai (bat dau bang 0 hoac +84)',
    example: '0912345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)[0-9]{9}$/, {
    message: 'So dien thoai khong hop le (VD: 0912345678 hoac +84912345678)',
  })
  phone?: string;
}
