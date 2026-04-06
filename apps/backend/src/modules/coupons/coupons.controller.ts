import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ===== ADMIN: DANH SACH COUPON =====
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sach coupon (Admin)' })
  async findAll(@Query() query: QueryCouponDto) {
    const result = await this.couponsService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  // ===== PUBLIC: COUPON DANG HOAT DONG =====
  @Get('active')
  @ApiOperation({ summary: 'Lay coupon dang hoat dong (Public)' })
  async getActiveCoupons() {
    const data = await this.couponsService.getActiveCoupons();
    return {
      success: true,
      data,
    };
  }

  // ===== CUSTOMER: VALIDATE COUPON =====
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate coupon truoc khi dat hang (Customer)' })
  async validateCoupon(@Request() req, @Body() dto: ApplyCouponDto) {
    const result = await this.couponsService.validateAndApply(
      dto.code,
      req.user._id.toString(),
      dto.items,
      dto.subtotal,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ===== ADMIN: TAO COUPON =====
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao coupon moi (Admin)' })
  async create(@Body() dto: CreateCouponDto) {
    const data = await this.couponsService.create(dto);
    return {
      success: true,
      message: 'Tao coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: CHI TIET COUPON =====
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiet coupon + thong ke su dung (Admin)' })
  async findById(@Param('id') id: string) {
    const data = await this.couponsService.findById(id);
    return {
      success: true,
      data,
    };
  }

  // ===== ADMIN: CAP NHAT COUPON =====
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat coupon (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    const data = await this.couponsService.update(id, dto);
    return {
      success: true,
      message: 'Cap nhat coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: KICH HOAT COUPON =====
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kich hoat coupon (Admin)' })
  async activate(@Param('id') id: string) {
    const data = await this.couponsService.activate(id);
    return {
      success: true,
      message: 'Kich hoat coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: VO HIEU HOA COUPON =====
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vo hieu hoa coupon (Admin)' })
  async deactivate(@Param('id') id: string) {
    const data = await this.couponsService.deactivate(id);
    return {
      success: true,
      message: 'Vo hieu hoa coupon thanh cong',
      data,
    };
  }

  // ===== ADMIN: THONG KE SU DUNG COUPON =====
  @Get(':id/usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thong ke su dung coupon (Admin)' })
  async getUsageStats(@Param('id') id: string) {
    const data = await this.couponsService.getUsageStats(id);
    return {
      success: true,
      data,
    };
  }

  // ===== ADMIN: XOA COUPON =====
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoa coupon (chi khi chua ai dung) (Admin)' })
  async delete(@Param('id') id: string) {
    await this.couponsService.delete(id);
    return {
      success: true,
      message: 'Xoa coupon thanh cong',
    };
  }
}
