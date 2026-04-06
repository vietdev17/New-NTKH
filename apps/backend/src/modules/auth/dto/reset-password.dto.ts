import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token dat lai mat khau (nhan qua email)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsNotEmpty({ message: 'Token khong duoc de trong' })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Mat khau moi (toi thieu 6 ky tu)',
    example: 'MatKhauMoi@456',
  })
  @IsNotEmpty({ message: 'Mat khau moi khong duoc de trong' })
  @IsString()
  @MinLength(6, { message: 'Mat khau moi phai co it nhat 6 ky tu' })
  @MaxLength(50, { message: 'Mat khau moi toi da 50 ky tu' })
  newPassword: string;
}
