import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { User } from '../users/schemas/user.schema';

// ---- Interfaces ----
export interface TokenPayload {
  sub: string; // userId
  _id?: string; // alias for sub, used in req.user._id
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    avatar: string | null;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // ---- Setup Nodemailer Transporter ----
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.pass'),
      },
    });
  }

  // ============================================================
  // REGISTER - Tao tai khoan moi
  // ============================================================
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Kiem tra email ton tai
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BusinessException(
        'Email da duoc su dung',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiem tra phone ton tai (neu co)
    if (dto.phone) {
      const existingPhone = await this.usersService.findByPhone(dto.phone);
      if (existingPhone) {
        throw new BusinessException(
          'So dien thoai da duoc su dung',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Tao user
    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
    } as Partial<User>);

    // Generate tokens
    const payload: TokenPayload = {
      sub: (user as any)._id.toString(),
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(payload);

    // Luu refresh token
    await this.saveRefreshToken((user as any)._id.toString(), tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        _id: (user as any)._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
      },
      tokens,
    };
  }

  // ============================================================
  // LOGIN - Dang nhap bang email + password
  // ============================================================
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Tim user va lay ca password field (vi password co select: false)
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new BusinessException(
        'Email hoac mat khau khong chinh xac',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiem tra tai khoan Google (khong co password local)
    if (user.isGoogleAuth && !user.password) {
      throw new BusinessException(
        'Tai khoan nay su dung dang nhap Google. Vui long dang nhap bang Google.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiem tra tai khoan bi vo hieu hoa
    if (!user.isActive) {
      throw new BusinessException(
        'Tai khoan da bi vo hieu hoa',
        HttpStatus.FORBIDDEN,
      );
    }

    // Kiem tra tai khoan bi xoa
    if (user.isDeleted) {
      throw new BusinessException(
        'Email hoac mat khau khong chinh xac',
        HttpStatus.BAD_REQUEST,
      );
    }

    // So sanh password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BusinessException(
        'Email hoac mat khau khong chinh xac',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: (user as any)._id.toString(),
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(payload);

    // Luu refresh token + cap nhat lastLoginAt
    await Promise.all([
      this.saveRefreshToken((user as any)._id.toString(), tokens.refreshToken),
      this.usersService.update((user as any)._id.toString(), {
        lastLoginAt: new Date(),
      } as Partial<User>),
    ]);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        _id: (user as any)._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
      },
      tokens,
    };
  }

  // ============================================================
  // REFRESH TOKEN - Lam moi cap token (rotation)
  // ============================================================
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Tim user va lay refresh token tu DB
      const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Refresh token khong hop le');
      }

      // So sanh hash cua refresh token
      const isRefreshValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshValid) {
        // Co the bi tan cong token theft -> xoa tat ca refresh tokens
        await this.usersService.update((user as any)._id.toString(), {
          refreshToken: null,
        } as any);
        this.logger.warn(
          `Possible token theft detected for user: ${user.email}`,
        );
        throw new UnauthorizedException('Refresh token khong hop le');
      }

      // Generate cap token moi (rotation)
      const newPayload: TokenPayload = {
        sub: (user as any)._id.toString(),
        email: user.email,
        role: user.role,
      };
      const tokens = await this.generateTokens(newPayload);

      // Luu refresh token moi
      await this.saveRefreshToken((user as any)._id.toString(), tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token khong hop le hoac da het han');
    }
  }

  // ============================================================
  // LOGOUT - Xoa refresh token
  // ============================================================
  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.update(userId, { refreshToken: null } as any);
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Dang xuat thanh cong' };
  }

  // ============================================================
  // GET CURRENT USER - Lay thong tin user hien tai
  // ============================================================
  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BusinessException('User khong tim thay', HttpStatus.NOT_FOUND);
    }

    return {
      _id: (user as any)._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      addresses: user.addresses,
      loyaltyPoints: user.loyaltyPoints,
      lastLoginAt: user.lastLoginAt,
      createdAt: (user as any).createdAt,
    };
  }

  // ============================================================
  // FORGOT PASSWORD - Gui email dat lai mat khau
  // ============================================================
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    // Luon tra ve thanh cong de tranh lo thong tin email ton tai
    if (!user) {
      this.logger.warn(
        `Forgot password attempt for non-existing email: ${dto.email}`,
      );
      return {
        message:
          'Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau.',
      };
    }

    // Kiem tra Google auth
    if (user.isGoogleAuth && !user.password) {
      return {
        message:
          'Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau.',
      };
    }

    // Tao reset token (random 32 bytes -> hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Luu token va thoi gian het han (30 phut)
    await this.usersService.update((user as any)._id.toString(), {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
    } as Partial<User>);

    // Tao link reset password
    const frontendUrl = this.configService.get<string>('frontend.url');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Gui email
    try {
      await this.transporter.sendMail({
        from: `"Furniture VN" <${this.configService.get<string>('email.user')}>`,
        to: user.email,
        subject: 'Dat lai mat khau - Furniture VN',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2C3E50;">Dat lai mat khau</h2>
            <p>Xin chao <strong>${user.fullName}</strong>,</p>
            <p>Ban da yeu cau dat lai mat khau. Nhan vao nut ben duoi de tiep tuc:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #3498DB; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; font-size: 16px;">
                Dat lai mat khau
              </a>
            </div>
            <p style="color: #7F8C8D; font-size: 14px;">
              Link nay se het han sau 30 phut.<br>
              Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.
            </p>
            <hr style="border: 1px solid #ECF0F1;">
            <p style="color: #BDC3C7; font-size: 12px;">
              Furniture VN - He thong thuong mai dien tu noi that
            </p>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reset email to: ${user.email}`,
        (error as Error).stack,
      );
      // Khong throw error ra client, van tra ve thanh cong
    }

    return {
      message:
        'Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau.',
    };
  }

  // ============================================================
  // RESET PASSWORD - Dat lai mat khau bang token
  // ============================================================
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Hash token nhan duoc de so sanh voi DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    // Tim user co token hop le va chua het han
    const user = await this.usersService.findByResetToken(hashedToken);

    if (!user) {
      throw new BusinessException(
        'Token khong hop le hoac da het han',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new BusinessException(
        'Token da het han',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash mat khau moi
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    // Cap nhat password va xoa reset token
    await this.usersService.update((user as any)._id.toString(), {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null, // Xoa refresh token -> buoc dang nhap lai
    } as any);

    this.logger.log(`Password reset successful for: ${user.email}`);

    return { message: 'Dat lai mat khau thanh cong. Vui long dang nhap lai.' };
  }

  // ============================================================
  // VALIDATE GOOGLE USER - Xu ly Google OAuth callback
  // ============================================================
  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<AuthResponse> {
    // Tim user theo googleId
    let user: User | null = await this.usersService.findByGoogleId(
      profile.googleId,
    );

    if (!user) {
      // Tim theo email - co the user da dang ky bang email truoc do
      user = await this.usersService.findByEmail(profile.email);

      if (user) {
        // Link Google vao tai khoan hien tai
        await this.usersService.update((user as any)._id.toString(), {
          googleId: profile.googleId,
          isGoogleAuth: true,
          avatar: user.avatar || profile.avatar,
        } as Partial<User>);
        // Reload user
        user = await this.usersService.findById((user as any)._id.toString());
      } else {
        // Tao tai khoan moi tu Google profile
        user = await this.usersService.create({
          fullName: profile.fullName,
          email: profile.email,
          googleId: profile.googleId,
          isGoogleAuth: true,
          avatar: profile.avatar,
          isActive: true,
          phone: `google_${profile.googleId}`,
        } as Partial<User>);
      }
    }

    // Kiem tra tai khoan bi vo hieu hoa
    if (!user.isActive) {
      throw new BusinessException(
        'Tai khoan da bi vo hieu hoa',
        HttpStatus.FORBIDDEN,
      );
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: (user as any)._id.toString(),
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(payload);

    // Luu refresh token + cap nhat lastLoginAt
    await Promise.all([
      this.saveRefreshToken((user as any)._id.toString(), tokens.refreshToken),
      this.usersService.update((user as any)._id.toString(), {
        lastLoginAt: new Date(),
      } as Partial<User>),
    ]);

    this.logger.log(`Google user authenticated: ${user.email}`);

    return {
      user: {
        _id: (user as any)._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
      },
      tokens,
    };
  }

  // ============================================================
  // VERIFY TOKEN - Decode JWT va tra ve payload
  // CRITICAL: Duoc su dung boi Socket.IO gateway de xac thuc
  //           WebSocket connections.
  // ============================================================
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Kiem tra user van ton tai va active
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive || user.isDeleted) {
        throw new UnauthorizedException('User khong hop le');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token khong hop le hoac da het han');
    }
  }

  // ============================================================
  // GENERATE TOKENS - Tao cap access + refresh token
  // ============================================================
  async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.accessExpires', '30d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpires',
          '1y',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ============================================================
  // SAVE REFRESH TOKEN - Luu hash cua refresh token vao DB
  // ============================================================
  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hashedToken = await bcrypt.hash(refreshToken, salt);

    await this.usersService.update(userId, {
      refreshToken: hashedToken,
    } as Partial<User>);
  }
}
