import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShipperService } from './shipper.service';
import { ShipperLocationService } from './shipper-location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { UpdateLocationDto } from './dto/update-location.dto';
import { DeliverOrderDto } from './dto/deliver-order.dto';
import { UpdateShipperStatusDto } from './dto/update-shipper-status.dto';
import { RejectOrderDto } from './dto/reject-order.dto';
import { QueryShipperOrdersDto } from './dto/query-shipper-orders.dto';
import { QueryEarningsDto } from './dto/query-earnings.dto';

@ApiTags('Shipper')
@ApiBearerAuth()
@Controller('shipper')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SHIPPER)
export class ShipperController {
  constructor(
    private readonly shipperService: ShipperService,
    private readonly locationService: ShipperLocationService,
  ) {}

  // ===== DASHBOARD =====
  @Get('dashboard')
  async getDashboard(@Request() req) {
    const shipperId = req.user._id.toString();
    let stats: any = {};
    let pendingOrders: any[] = [];
    try {
      [stats, pendingOrders] = await Promise.all([
        this.shipperService.getStats(shipperId, 'day'),
        this.shipperService.getAvailableOrders(shipperId),
      ]);
    } catch {
      // fallback if methods fail
    }
    return {
      success: true,
      data: {
        todayDeliveries: stats?.totalOrders || 0,
        completedToday: stats?.totalOrders || 0,
        todayEarnings: stats?.totalEarnings || 0,
        totalDeliveries: stats?.totalOrders || 0,
        isAvailable: true,
        pendingOrders: (pendingOrders || []).slice(0, 5),
      },
    };
  }

  // ===== DON HANG CHO NHAN =====
  @Get('orders/available')
  async getAvailableOrders(@Request() req) {
    const data = await this.shipperService.getAvailableOrders(
      req.user._id.toString(),
    );
    return {
      success: true,
      data,
    };
  }

  // ===== DON HANG CUA TOI =====
  @Get('orders/my-orders')
  async getMyOrders(
    @Request() req,
    @Query() query: QueryShipperOrdersDto,
  ) {
    const result = await this.shipperService.getMyOrders(
      req.user._id.toString(),
      query,
    );
    return {
      success: true,
      ...result,
    };
  }

  // ===== CHI TIET DON HANG =====
  @Get('orders/:id')
  async getOrderDetail(
    @Request() req,
    @Param('id') orderId: string,
  ) {
    const data = await this.shipperService.getOrderDetail(
      req.user._id.toString(),
      orderId,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== NHAN DON =====
  @Post('orders/:id/accept')
  async acceptOrder(
    @Request() req,
    @Param('id') orderId: string,
  ) {
    const data = await this.shipperService.acceptOrder(
      req.user._id.toString(),
      orderId,
    );
    return {
      success: true,
      message: `Da nhan don ${data.orderNumber}`,
      data,
    };
  }

  // ===== TU CHOI DON =====
  @Post('orders/:id/reject')
  async rejectOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() dto: RejectOrderDto,
  ) {
    const data = await this.shipperService.rejectOrder(
      req.user._id.toString(),
      orderId,
      dto.reason,
    );
    return {
      success: true,
      ...data,
    };
  }

  // ===== XAC NHAN DA GIAO (VOI ANH CHUNG MINH) =====
  @Post('orders/:id/deliver')
  async deliverOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() dto: DeliverOrderDto,
  ) {
    const data = await this.shipperService.updateDeliveryStatus(
      req.user._id.toString(),
      orderId,
      dto,
    );
    return {
      success: true,
      message: `Da giao don ${data.orderNumber} thanh cong`,
      data,
    };
  }

  // ===== CAP NHAT VI TRI GPS =====
  @Post('location')
  async updateLocation(
    @Request() req,
    @Body() dto: UpdateLocationDto,
  ) {
    const data = await this.locationService.updateLocation(
      req.user._id.toString(),
      dto,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== THONG KE =====
  @Get('stats')
  async getStats(
    @Request() req,
    @Query('period') period?: string,
  ) {
    const data = await this.shipperService.getStats(
      req.user._id.toString(),
      period,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== DOANH THU CHI TIET =====
  @Get('earnings')
  async getEarnings(
    @Request() req,
    @Query() query: QueryEarningsDto,
  ) {
    const data = await this.shipperService.getEarnings(
      req.user._id.toString(),
      query,
    );
    return {
      success: true,
      data,
    };
  }

  // ===== TONG HOP COD =====
  @Get('cod-summary')
  async getCodSummary(@Request() req) {
    const data = await this.shipperService.getCodSummary(
      req.user._id.toString(),
    );
    return {
      success: true,
      data,
    };
  }

  // ===== CAP NHAT TRANG THAI (AVAILABLE/BUSY/OFFLINE) =====
  @Patch('status')
  async updateStatus(
    @Request() req,
    @Body() dto: UpdateShipperStatusDto,
  ) {
    const data = await this.locationService.updateStatus(
      req.user._id.toString(),
      dto.status,
    );
    return {
      success: true,
      message: `Trang thai da cap nhat thanh "${dto.status}"`,
      data,
    };
  }
}
