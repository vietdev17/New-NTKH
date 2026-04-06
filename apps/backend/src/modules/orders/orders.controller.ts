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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { ReturnsService } from './returns.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryReturnDto } from './dto/query-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShipperLocation, ShipperLocationDocument } from '../shipper/schemas/shipper-location.schema';

@ApiTags('Orders & Returns')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly returnsService: ReturnsService,
    @InjectModel(ShipperLocation.name)
    private shipperLocationModel: Model<ShipperLocationDocument>,
  ) {}

  // =================================================================
  // DON HANG
  // =================================================================

  // ===== TAO DON HANG (CUSTOMER + ADMIN co the test) =====
  @Post('orders')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao don hang tu website' })
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(req.user._id, dto);
    return {
      success: true,
      message: 'Tao don hang thanh cong',
      data: order,
    };
  }

  // ===== TAO DON POS (STAFF) =====
  @Post('orders/pos')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao don hang POS tai quay (Admin/Staff)' })
  async createPosOrder(@Request() req, @Body() dto: CreatePosOrderDto) {
    const order = await this.ordersService.createPosOrder(req.user._id, dto);
    return {
      success: true,
      message: 'Tao don POS thanh cong',
      data: order,
    };
  }

  // ===== DANH SACH DON HANG (ADMIN) =====
  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sach don hang (Admin/Staff)' })
  async findAll(@Query() query: QueryOrderDto) {
    const result = await this.ordersService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== DON HANG CUA TOI (CUSTOMER) =====
  @Get('orders/my-orders')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Don hang cua toi (Customer)' })
  async findMyOrders(@Request() req, @Query() query: QueryOrderDto) {
    const result = await this.ordersService.findMyOrders(req.user._id, query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== DON HANG GAN DAY (ADMIN DASHBOARD) =====
  @Get('orders/recent')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Don hang gan day - dashboard (Admin)' })
  async getRecentOrders(@Query('limit') limit?: number) {
    const orders = await this.ordersService.getRecentOrders(limit || 10);
    return {
      success: true,
      data: orders,
    };
  }

  // ===== THONG KE DON HANG (ADMIN) =====
  @Get('orders/stats')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thong ke don hang + doanh thu (Admin)' })
  async getOrderStats() {
    const stats = await this.ordersService.getOrderStats();
    return {
      success: true,
      data: stats,
    };
  }

  // ===== VỊ TRÍ SHIPPER CỦA ĐƠN HÀNG (CUSTOMER) =====
  @Get('orders/:id/shipper-location')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy vị trí GPS hiện tại của shipper đang giao đơn' })
  async getShipperLocation(@Param('id') id: string, @Request() req) {
    const order = await this.ordersService.findById(id);
    const rawShipper = (order as any).shipperId;
    if (!rawShipper) {
      return { success: true, data: null };
    }

    // shipperId có thể là populated object hoặc ObjectId
    const shipperIdStr = rawShipper?._id?.toString() || rawShipper.toString();

    const location = await this.shipperLocationModel
      .findOne({ shipperId: new Types.ObjectId(shipperIdStr) })
      .lean();

    if (!location || !location.location?.coordinates) {
      return { success: true, data: null };
    }

    const [lng, lat] = location.location.coordinates;
    return {
      success: true,
      data: { lat, lng, updatedAt: location.updatedAt },
    };
  }

  // ===== CHI TIET DON HANG =====
  @Get('orders/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER, UserRole.SHIPPER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiet don hang' })
  async findById(@Param('id') id: string, @Request() req) {
    const order = await this.ordersService.findById(id);

    // Customer chi xem don cua minh
    const orderCustomerId = (order as any).customerId?._id?.toString() || (order as any).customerId?.toString();
    if (
      req.user.role === UserRole.CUSTOMER &&
      orderCustomerId !== req.user._id.toString()
    ) {
      return { success: false, message: 'Khong co quyen xem don nay' };
    }

    return {
      success: true,
      data: order,
    };
  }

  // ===== CAP NHAT TRANG THAI DON HANG =====
  @Patch('orders/:id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SHIPPER, UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat trang thai don hang' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      req.user._id,
      req.user.role,
      dto,
    );
    return {
      success: true,
      message: `Cap nhat trang thai thanh cong: ${dto.status}`,
      data: order,
    };
  }

  // ===== GAN SHIPPER =====
  @Post('orders/:id/assign-shipper')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gan shipper cho don hang (Admin)' })
  async assignShipper(
    @Param('id') id: string,
    @Body('shipperId') shipperId: string,
  ) {
    const order = await this.ordersService.assignShipper(id, shipperId);
    return {
      success: true,
      message: `Da gan shipper ${(order as any).shipperName} cho don ${(order as any).orderNumber}`,
      data: order,
    };
  }

  // ===== HUY DON HANG =====
  @Post('orders/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Huy don hang (Admin hoac Customer voi don PENDING)' })
  async cancelOrder(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: CancelOrderDto,
  ) {
    const order = await this.ordersService.cancelOrder(
      id,
      req.user._id,
      dto,
    );
    return {
      success: true,
      message: 'Da huy don hang',
      data: order,
    };
  }

  // ===== XAC NHAN CHUYEN KHOAN =====
  @Post('orders/:id/confirm-payment')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xac nhan chuyen khoan ngan hang (Admin)' })
  async confirmBankTransfer(@Param('id') id: string, @Request() req) {
    const order = await this.ordersService.confirmBankTransfer(
      id,
      req.user._id,
    );
    return {
      success: true,
      message: 'Da xac nhan chuyen khoan ngan hang',
      data: order,
    };
  }

  // =================================================================
  // TRA HANG / HOAN TIEN
  // =================================================================

  // ===== TAO YEU CAU TRA HANG (CUSTOMER) =====
  @Post('returns')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao yeu cau tra hang (Customer)' })
  async createReturn(@Request() req, @Body() dto: CreateReturnDto) {
    const returnRequest = await this.returnsService.createReturn(
      req.user._id,
      dto,
    );
    return {
      success: true,
      message: 'Tao yeu cau tra hang thanh cong',
      data: returnRequest,
    };
  }

  // ===== DANH SACH TRA HANG (ADMIN) =====
  @Get('returns')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sach yeu cau tra hang (Admin)' })
  async getReturns(@Query() query: QueryReturnDto) {
    const result = await this.returnsService.getReturns(query);
    return {
      success: true,
      data: result,
    };
  }

  // ===== YEU CAU TRA HANG CUA TOI (CUSTOMER) =====
  @Get('returns/my-returns')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeu cau tra hang cua toi (Customer)' })
  async getMyReturns(@Request() req) {
    const returns = await this.returnsService.getMyReturns(req.user._id);
    return {
      success: true,
      data: returns,
    };
  }

  // ===== DUYET TRA HANG (ADMIN) =====
  @Patch('returns/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duyet yeu cau tra hang (Admin)' })
  async approveReturn(@Param('id') id: string, @Request() req) {
    const returnRequest = await this.returnsService.approveReturn(
      id,
      req.user._id,
    );
    return {
      success: true,
      message: 'Da duyet yeu cau tra hang',
      data: returnRequest,
    };
  }

  // ===== TU CHOI TRA HANG (ADMIN) =====
  @Patch('returns/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tu choi yeu cau tra hang (Admin)' })
  async rejectReturn(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    const returnRequest = await this.returnsService.rejectReturn(
      id,
      req.user._id,
      reason,
    );
    return {
      success: true,
      message: 'Da tu choi yeu cau tra hang',
      data: returnRequest,
    };
  }

  // ===== XU LY HOAN TIEN (ADMIN) =====
  @Post('returns/:id/refund')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xu ly hoan tien (Admin)' })
  async processRefund(@Param('id') id: string, @Request() req) {
    const returnRequest = await this.returnsService.processRefund(
      id,
      req.user._id,
    );
    return {
      success: true,
      message: `Da hoan tien ${returnRequest.refundAmount.toLocaleString('vi-VN')} VND`,
      data: returnRequest,
    };
  }
}
