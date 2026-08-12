import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mat khau hien tai' })
  @IsNotEmpty({ message: 'Mat khau hien tai khong duoc de trong' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Mat khau moi', minLength: 6 })
  @IsNotEmpty({ message: 'Mat khau moi khong duoc de trong' })
  @IsString()
  @MinLength(6, { message: 'Mat khau moi phai co it nhat 6 ky tu' })
  @MaxLength(50)
  newPassword: string;
}
