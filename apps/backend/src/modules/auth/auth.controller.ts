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
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

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
  @ApiResponse({
    status: 400,
    description: 'Email da ton tai / Validation error',
  })
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
  @ApiResponse({
    status: 400,
    description: 'Token khong hop le hoac het han',
  })
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
  @ApiResponse({
    status: 302,
    description: 'Redirect ve frontend voi tokens',
  })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateGoogleUser(req.user);

    // Redirect ve frontend voi tokens trong URL params
    const frontendUrl = this.configService.get<string>('frontend.url');
    const params = new URLSearchParams({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });

    return res.redirect(
      `${frontendUrl}/auth/google/success?${params.toString()}`,
    );
  }
}
