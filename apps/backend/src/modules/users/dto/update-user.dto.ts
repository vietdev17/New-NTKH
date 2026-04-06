import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * UpdateUserDto ke thua tat ca truong tu CreateUserDto nhung:
 * - Tat ca optional (PartialType)
 * - Khong co email, googleId, isGoogleAuth (OmitType)
 * AuthService co the goi usersService.update() voi cac truong internal
 * nhu refreshToken, resetPasswordToken, lastLoginAt thong qua generic update.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'googleId', 'isGoogleAuth'] as const),
) {}
