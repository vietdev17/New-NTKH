import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    // Kiem tra user van ton tai va active
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User khong ton tai');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tai khoan da bi vo hieu hoa');
    }

    if (user.isDeleted) {
      throw new UnauthorizedException('Tai khoan da bi xoa');
    }

    return {
      sub: payload.sub,
      _id: payload.sub, // alias de tuong thich voi req.user._id
      email: payload.email,
      role: user.role, // Lay role tu DB (co the da thay doi)
    };
  }
}
