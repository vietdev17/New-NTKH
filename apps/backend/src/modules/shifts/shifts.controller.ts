import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  /**
   * POST /shifts/open - Mở ca làm mới
   */
  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Mở ca làm mới' })
  async openShift(@Request() req, @Body() dto: OpenShiftDto) {
    return this.shiftsService.openShift(req.user._id, dto.openingBalance);
  }

  /**
   * PATCH /shifts/:id/close - Đóng ca làm
   */
  @Patch(':id/close')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Đóng ca làm' })
  async closeShift(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: CloseShiftDto,
  ) {
    return this.shiftsService.closeShift(
      id,
      req.user._id,
      dto.closingBalance,
      dto.note,
    );
  }

  /**
   * GET /shifts/current - Ca làm hiện tại của tôi
   */
  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy ca làm hiện tại' })
  async getCurrentShift(@Request() req) {
    return this.shiftsService.getCurrentShift(req.user._id);
  }

  /**
   * GET /shifts/my-shifts - Danh sách ca làm của tôi
   */
  @Get('my-shifts')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Danh sách ca làm của tôi' })
  async getMyShifts(
    @Request() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.shiftsService.getMyShifts(
      req.user._id,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }

  /**
   * GET /shifts - Admin: Tất cả ca làm
   */
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Lấy tất cả ca làm' })
  async getAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.shiftsService.getAll(
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
  }

  /**
   * GET /shifts/:id - Chi tiết ca làm
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy chi tiết ca làm theo ID' })
  async getById(@Param('id') id: string) {
    return this.shiftsService.getById(id);
  }
}
