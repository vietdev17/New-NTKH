import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Dia chi email',
    example: 'nguyenvanan@gmail.com',
  })
  @IsNotEmpty({ message: 'Email khong duoc de trong' })
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;

  @ApiProperty({
    description: 'Mat khau',
    example: 'MatKhau@123',
  })
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong' })
  @IsString()
  @MinLength(6, { message: 'Mat khau phai co it nhat 6 ky tu' })
  password: string;
}
