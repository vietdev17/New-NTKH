import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email tai khoan can lay lai mat khau',
    example: 'nguyenvanan@gmail.com',
  })
  @IsNotEmpty({ message: 'Email khong duoc de trong' })
  @IsEmail({}, { message: 'Email khong hop le' })
  email: string;
}
