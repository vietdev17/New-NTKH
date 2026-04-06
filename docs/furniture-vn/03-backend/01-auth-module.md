# AUTH MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module xac thuc: JWT, Google OAuth, Refresh Token rotation, Forgot/Reset Password
> Phien ban: 2.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Cau truc thu muc](#1-cau-truc-thu-muc)
2. [auth.module.ts](#2-authmodulets)
3. [DTOs](#3-dtos)
4. [AuthService](#4-authservice)
5. [AuthController](#5-authcontroller)
6. [JWT Strategy](#6-jwt-strategy)
7. [Google Strategy](#7-google-strategy)
8. [Guards](#8-guards)
9. [Decorators](#9-decorators)
10. [Bang API Endpoints](#10-bang-api-endpoints)
11. [Vi du Request / Response](#11-vi-du-request--response)

---

## 1. Cau truc thu muc

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   └── reset-password.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── jwt-refresh.strategy.ts
│   └── google.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── jwt-refresh.guard.ts
│   ├── roles.guard.ts
│   └── optional-jwt.guard.ts
└── decorators/
    ├── current-user.decorator.ts
    └── roles.decorator.ts
```

---

## 2. auth.module.ts

```typescript
// ============================================================
// src/modules/auth/auth.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessExpiration', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

---

## 3. DTOs

### 3.1 RegisterDto

```typescript
// ============================================================
// src/modules/auth/dto/register.dto.ts
// ============================================================
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
```

### 3.2 LoginDto

```typescript
// ============================================================
// src/modules/auth/dto/login.dto.ts
// ============================================================
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
```

### 3.3 RefreshTokenDto

```typescript
// ============================================================
// src/modules/auth/dto/refresh-token.dto.ts
// ============================================================
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token nhan duoc khi login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'Refresh token khong duoc de trong' })
  @IsString()
  refreshToken: string;
}
```

### 3.4 ForgotPasswordDto

```typescript
// ============================================================
// src/modules/auth/dto/forgot-password.dto.ts
// ============================================================
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
```

### 3.5 ResetPasswordDto

```typescript
// ============================================================
// src/modules/auth/dto/reset-password.dto.ts
// ============================================================
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
```

---

## 4. AuthService

> Service chinh xu ly toan bo logic xac thuc.
> Bao gom: register, login, token management, forgot/reset password, Google OAuth.

```typescript
// ============================================================
// src/modules/auth/auth.service.ts
// ============================================================
import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

import { UsersService } from '../users/users.service';
import { UserDocument } from '../../schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  BusinessException,
  BusinessErrors,
} from '../../common/exceptions/business.exception';

// ---- Interfaces ----
export interface TokenPayload {
  sub: string;      // userId
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
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
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
      throw new BusinessException(BusinessErrors.EMAIL_EXISTS);
    }

    // Kiem tra phone ton tai (neu co)
    if (dto.phone) {
      const existingPhone = await this.usersService.findByPhone(dto.phone);
      if (existingPhone) {
        throw new BusinessException(BusinessErrors.PHONE_EXISTS);
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
    });

    // Generate tokens
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(payload);

    // Luu refresh token
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
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
      throw new BusinessException(BusinessErrors.INVALID_CREDENTIALS);
    }

    // Kiem tra tai khoan Google (khong co password local)
    if (user.isGoogleAuth && !user.password) {
      throw new BusinessException({
        code: 'GOOGLE_AUTH_ONLY',
        message: 'Tai khoan nay su dung dang nhap Google. Vui long dang nhap bang Google.',
      });
    }

    // Kiem tra tai khoan bi vo hieu hoa
    if (!user.isActive) {
      throw new BusinessException(BusinessErrors.ACCOUNT_DEACTIVATED);
    }

    // Kiem tra tai khoan bi xoa
    if (user.isDeleted) {
      throw new BusinessException(BusinessErrors.INVALID_CREDENTIALS);
    }

    // So sanh password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BusinessException(BusinessErrors.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(payload);

    // Luu refresh token + cap nhat lastLoginAt
    await Promise.all([
      this.saveRefreshToken(user._id.toString(), tokens.refreshToken),
      this.usersService.update(user._id.toString(), {
        lastLoginAt: new Date(),
      }),
    ]);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
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
        await this.usersService.update(user._id.toString(), {
          refreshToken: null,
        });
        this.logger.warn(
          `Possible token theft detected for user: ${user.email}`,
        );
        throw new UnauthorizedException('Refresh token khong hop le');
      }

      // Generate cap token moi (rotation)
      const newPayload: TokenPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };
      const tokens = await this.generateTokens(newPayload);

      // Luu refresh token moi
      await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BusinessException(BusinessErrors.TOKEN_INVALID);
    }
  }

  // ============================================================
  // LOGOUT - Xoa refresh token
  // ============================================================
  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.update(userId, { refreshToken: null });
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Dang xuat thanh cong' };
  }

  // ============================================================
  // GET CURRENT USER - Lay thong tin user hien tai
  // ============================================================
  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BusinessException(BusinessErrors.USER_NOT_FOUND);
    }

    return {
      _id: user._id,
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
      this.logger.warn(`Forgot password attempt for non-existing email: ${dto.email}`);
      return {
        message: 'Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau.',
      };
    }

    // Kiem tra Google auth
    if (user.isGoogleAuth && !user.password) {
      return {
        message: 'Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau.',
      };
    }

    // Tao reset token (random 32 bytes -> hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Luu token va thoi gian het han (30 phut)
    await this.usersService.update(user._id.toString(), {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
    });

    // Tao link reset password
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Gui email
    try {
      await this.transporter.sendMail({
        from: `"Furniture VN" <${this.configService.get<string>('mail.from')}>`,
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
      this.logger.error(`Failed to send reset email to: ${user.email}`, error.stack);
      // Khong throw error ra client, van tra ve thanh cong
    }

    return {
      message: 'Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau.',
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
      throw new BusinessException(BusinessErrors.TOKEN_INVALID);
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BusinessException(BusinessErrors.TOKEN_EXPIRED);
    }

    // Hash mat khau moi
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    // Cap nhat password va xoa reset token
    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null, // Xoa refresh token -> buoc dang nhap lai
    });

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
    let user: UserDocument | null = await this.usersService.findByGoogleId(
      profile.googleId,
    );

    if (!user) {
      // Tim theo email - co the user da dang ky bang email truoc do
      user = await this.usersService.findByEmail(profile.email);

      if (user) {
        // Link Google vao tai khoan hien tai
        await this.usersService.update(user._id.toString(), {
          googleId: profile.googleId,
          isGoogleAuth: true,
          avatar: user.avatar || profile.avatar,
        });
        // Reload user
        user = await this.usersService.findById(user._id.toString());
      } else {
        // Tao tai khoan moi tu Google profile
        user = await this.usersService.create({
          fullName: profile.fullName,
          email: profile.email,
          googleId: profile.googleId,
          isGoogleAuth: true,
          avatar: profile.avatar,
          isActive: true,
        });
      }
    }

    // Kiem tra tai khoan bi vo hieu hoa
    if (!user.isActive) {
      throw new BusinessException(BusinessErrors.ACCOUNT_DEACTIVATED);
    }

    // Generate tokens
    const payload: TokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const tokens = await this.generateTokens(payload);

    // Luu refresh token + cap nhat lastLoginAt
    await Promise.all([
      this.saveRefreshToken(user._id.toString(), tokens.refreshToken),
      this.usersService.update(user._id.toString(), {
        lastLoginAt: new Date(),
      }),
    ]);

    this.logger.log(`Google user authenticated: ${user.email}`);

    return {
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
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
        secret: this.configService.get<string>('jwt.accessSecret'),
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
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiration', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiration',
          '7d',
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
    });
  }
}
```

---

## 5. AuthController

```typescript
// ============================================================
// src/modules/auth/auth.controller.ts
// ============================================================
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ---- REGISTER ----
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dang ky tai khoan moi' })
  @ApiResponse({ status: 201, description: 'Dang ky thanh cong' })
  @ApiResponse({ status: 400, description: 'Email da ton tai / Validation error' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ---- LOGIN ----
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dang nhap bang email va mat khau' })
  @ApiResponse({ status: 200, description: 'Dang nhap thanh cong' })
  @ApiResponse({ status: 400, description: 'Email hoac mat khau sai' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ---- REFRESH TOKEN ----
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lam moi access token bang refresh token' })
  @ApiResponse({ status: 200, description: 'Token moi' })
  @ApiResponse({ status: 401, description: 'Refresh token khong hop le' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // ---- LOGOUT ----
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dang xuat (xoa refresh token)' })
  @ApiResponse({ status: 200, description: 'Dang xuat thanh cong' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  // ---- GET CURRENT USER ----
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lay thong tin user dang dang nhap' })
  @ApiResponse({ status: 200, description: 'Thong tin user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('sub') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  // ---- FORGOT PASSWORD ----
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gui email dat lai mat khau' })
  @ApiResponse({ status: 200, description: 'Email da duoc gui (neu ton tai)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ---- RESET PASSWORD ----
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dat lai mat khau bang token' })
  @ApiResponse({ status: 200, description: 'Mat khau da duoc cap nhat' })
  @ApiResponse({ status: 400, description: 'Token khong hop le hoac het han' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ---- GOOGLE OAUTH - INITIATE ----
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Bat dau dang nhap Google OAuth' })
  @ApiResponse({ status: 302, description: 'Redirect den Google' })
  async googleAuth() {
    // Guard se redirect den Google
  }

  // ---- GOOGLE OAUTH - CALLBACK ----
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect ve frontend voi tokens' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);

    // Redirect ve frontend voi tokens trong URL params
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const params = new URLSearchParams({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });

    return res.redirect(`${frontendUrl}/auth/google/success?${params.toString()}`);
  }
}
```

---

## 6. JWT Strategy

### 6.1 JWT Access Strategy

```typescript
// ============================================================
// src/modules/auth/strategies/jwt.strategy.ts
// ============================================================
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
      secretOrKey: configService.get<string>('jwt.accessSecret'),
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
      email: payload.email,
      role: user.role, // Lay role tu DB (co the da thay doi)
    };
  }
}
```

### 6.2 JWT Refresh Strategy

```typescript
// ============================================================
// src/modules/auth/strategies/jwt-refresh.strategy.ts
// ============================================================
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

---

## 7. Google Strategy

```typescript
// ============================================================
// src/modules/auth/strategies/google.strategy.ts
// ============================================================
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, displayName, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails[0].value,
      fullName: displayName,
      avatar: photos?.[0]?.value || null,
    };

    done(null, user);
  }
}
```

---

## 8. Guards

### 8.1 JwtAuthGuard

```typescript
// ============================================================
// src/modules/auth/guards/jwt-auth.guard.ts
// ============================================================
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error, user: T, info: any): T {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token da het han');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token khong hop le');
      }
      throw new UnauthorizedException('Vui long dang nhap');
    }
    return user;
  }
}
```

### 8.2 JwtRefreshGuard

```typescript
// ============================================================
// src/modules/auth/guards/jwt-refresh.guard.ts
// ============================================================
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

### 8.3 RolesGuard

```typescript
// ============================================================
// src/modules/auth/guards/roles.guard.ts
// ============================================================
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Neu khong co @Roles() decorator -> cho phep truy cap
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchTo<any>().getHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Khong co quyen truy cap');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Yeu cau quyen: ${requiredRoles.join(', ')}. Quyen hien tai: ${user.role}`,
      );
    }

    return true;
  }
}
```

### 8.4 OptionalJwtGuard

> Guard nay KHONG throw error neu khong co token.
> Su dung cho cac route public nhung van can biet user neu co dang nhap
> (vd: danh sach san pham - hien thi icon "da yeu thich" neu dang nhap).

```typescript
// ============================================================
// src/modules/auth/guards/optional-jwt.guard.ts
// ============================================================
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error, user: T): T | null {
    // Khong throw error - tra ve null neu khong co token hop le
    if (err || !user) {
      return null;
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    // Goi parent canActivate de chay strategy
    return super.canActivate(context);
  }
}
```

---

## 9. Decorators

### 9.1 @CurrentUser()

```typescript
// ============================================================
// src/modules/auth/decorators/current-user.decorator.ts
// ============================================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '../auth.service';

/**
 * Lay thong tin user tu JWT payload.
 *
 * Su dung:
 *   @CurrentUser() user: TokenPayload           -> lay toan bo payload
 *   @CurrentUser('sub') userId: string           -> lay userId
 *   @CurrentUser('email') email: string          -> lay email
 *   @CurrentUser('role') role: string            -> lay role
 */
export const CurrentUser = createParamDecorator(
  (field: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchTo<any>().getHttp().getRequest();
    const user = request.user as TokenPayload;

    if (!user) {
      return null;
    }

    return field ? user[field] : user;
  },
);
```

### 9.2 @Roles()

```typescript
// ============================================================
// src/modules/auth/decorators/roles.decorator.ts
// ============================================================
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator gioi han truy cap theo role.
 * Phai su dung kem voi JwtAuthGuard va RolesGuard.
 *
 * Su dung:
 *   @Roles(UserRole.ADMIN)
 *   @Roles(UserRole.ADMIN, UserRole.MANAGER)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### Vi du su dung Guards + Decorators

```typescript
// Endpoint chi danh cho Admin
@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async adminDashboard(@CurrentUser('sub') userId: string) {
  // Chi admin moi vao duoc
}

// Endpoint cho Admin va Manager
@Get('management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
async managementPage(@CurrentUser() user: TokenPayload) {
  // user = { sub: '...', email: '...', role: 'admin' }
}

// Endpoint public, nhung co them info neu dang nhap
@Get('products')
@UseGuards(OptionalJwtGuard)
async getProducts(@CurrentUser() user: TokenPayload | null) {
  // user = null neu chua dang nhap
  // user = { sub, email, role } neu da dang nhap
}
```

---

## 10. Bang API Endpoints

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| `POST` | `/api/v1/auth/register` | Public | Dang ky tai khoan moi |
| `POST` | `/api/v1/auth/login` | Public | Dang nhap bang email + password |
| `POST` | `/api/v1/auth/refresh` | Public | Lam moi access token |
| `POST` | `/api/v1/auth/logout` | JWT | Dang xuat, xoa refresh token |
| `GET` | `/api/v1/auth/me` | JWT | Lay thong tin user hien tai |
| `POST` | `/api/v1/auth/forgot-password` | Public | Gui email dat lai mat khau |
| `POST` | `/api/v1/auth/reset-password` | Public | Dat lai mat khau bang token |
| `GET` | `/api/v1/auth/google` | Public | Redirect den Google OAuth |
| `GET` | `/api/v1/auth/google/callback` | Google | Callback tu Google, redirect ve frontend |

---

## 11. Vi du Request / Response

### 11.1 Register

**Request:**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "fullName": "Tran Thi Bich Ngoc",
  "email": "bichngoc@gmail.com",
  "password": "MatKhau@123",
  "phone": "0987654321"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "660a1b2c3d4e5f6a7b8c9d0e",
      "fullName": "Tran Thi Bich Ngoc",
      "email": "bichngoc@gmail.com",
      "role": "customer",
      "avatar": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhMWIyYzNkNGU1ZjZhN2I4YzlkMGUiLCJlbWFpbCI6ImJpY2huZ29jQGdtYWlsLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTcxMTk1MjAwMCwiZXhwIjoxNzExOTUyOTAwfQ.abc123",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhMWIyYzNkNGU1ZjZhN2I4YzlkMGUiLCJlbWFpbCI6ImJpY2huZ29jQGdtYWlsLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTcxMTk1MjAwMCwiZXhwIjoxNzEyNTU2ODAwfQ.def456"
    }
  },
  "message": "Tao thanh cong",
  "timestamp": "2026-04-02T10:30:00.000Z"
}
```

**Response (400) - Email da ton tai:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email da duoc su dung",
  "errorCode": "EMAIL_EXISTS",
  "field": "email"
}
```

### 11.2 Login

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "bichngoc@gmail.com",
  "password": "MatKhau@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "660a1b2c3d4e5f6a7b8c9d0e",
      "fullName": "Tran Thi Bich Ngoc",
      "email": "bichngoc@gmail.com",
      "role": "customer",
      "avatar": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:31:00.000Z"
}
```

**Response (400) - Sai mat khau:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email hoac mat khau khong chinh xac",
  "errorCode": "INVALID_CREDENTIALS"
}
```

### 11.3 Refresh Token

**Request:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...(new)"
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:35:00.000Z"
}
```

### 11.4 Logout

**Request:**
```http
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Dang xuat thanh cong"
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:36:00.000Z"
}
```

### 11.5 Get Current User

**Request:**
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "660a1b2c3d4e5f6a7b8c9d0e",
    "fullName": "Tran Thi Bich Ngoc",
    "email": "bichngoc@gmail.com",
    "phone": "0987654321",
    "avatar": null,
    "role": "customer",
    "isActive": true,
    "addresses": [
      {
        "fullName": "Tran Thi Bich Ngoc",
        "phone": "0987654321",
        "street": "123 Nguyen Hue",
        "ward": "Ben Nghe",
        "district": "Quan 1",
        "province": "TP Ho Chi Minh",
        "isDefault": true
      }
    ],
    "loyaltyPoints": 1500,
    "lastLoginAt": "2026-04-02T10:31:00.000Z",
    "createdAt": "2026-03-15T08:00:00.000Z"
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:37:00.000Z"
}
```

### 11.6 Forgot Password

**Request:**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "bichngoc@gmail.com"
}
```

**Response (200) - Luon tra ve thanh cong:**
```json
{
  "success": true,
  "data": {
    "message": "Neu email ton tai trong he thong, ban se nhan duoc email huong dan dat lai mat khau."
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:38:00.000Z"
}
```

### 11.7 Reset Password

**Request:**
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "newPassword": "MatKhauMoi@456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Dat lai mat khau thanh cong. Vui long dang nhap lai."
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:40:00.000Z"
}
```

**Response (400) - Token het han:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Token da het han",
  "errorCode": "TOKEN_EXPIRED"
}
```

### 11.8 Google OAuth Flow

**Buoc 1: Redirect den Google**
```
GET /api/v1/auth/google
-> Redirect 302 -> https://accounts.google.com/o/oauth2/v2/auth?...
```

**Buoc 2: Google callback**
```
GET /api/v1/auth/google/callback?code=4/0AX4XfWj...
-> Redirect 302 -> http://localhost:3000/auth/google/success?accessToken=eyJ...&refreshToken=eyJ...
```

**Frontend xu ly:**
```typescript
// pages/auth/google/success.tsx
const searchParams = useSearchParams();
const accessToken = searchParams.get('accessToken');
const refreshToken = searchParams.get('refreshToken');

// Luu tokens vao localStorage/cookie
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Redirect ve trang chu
router.push('/');
```
