import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * GET /reports/dashboard
   * Tong quan nhanh: doanh thu, don hang, khach hang, ton kho
   */
  @Get('dashboard')
  async getDashboard() {
    return this.reportsService.getDashboard();
  }

  /**
   * GET /reports/revenue?startDate=2026-03-01&endDate=2026-03-31&groupBy=day
   * Bao cao doanh thu theo thoi gian
   */
  @Get('revenue')
  async getRevenue(@Query() query: ReportQueryDto) {
    return this.reportsService.getRevenueReport(query);
  }

  /**
   * GET /reports/orders-summary?startDate=2026-03-01&endDate=2026-03-31
   * Thong ke don hang theo trang thai, thanh toan, kenh ban
   */
  @Get('orders-summary')
  async getOrdersSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getOrdersSummary(query);
  }

  /**
   * GET /reports/top-products?startDate=2026-03-01&endDate=2026-03-31&limit=10
   * Top san pham ban chay
   */
  @Get('top-products')
  async getTopProducts(@Query() query: ReportQueryDto) {
    return this.reportsService.getTopProducts(query);
  }

  /**
   * GET /reports/inventory
   * Bao cao ton kho toan bo san pham
   */
  @Get('inventory')
  async getInventory() {
    return this.reportsService.getInventoryReport();
  }

  /**
   * GET /reports/customers?startDate=2026-03-01&endDate=2026-03-31&groupBy=month&limit=10
   * Bao cao khach hang
   */
  @Get('customers')
  async getCustomers(@Query() query: ReportQueryDto) {
    return this.reportsService.getCustomerReport(query);
  }

  /**
   * GET /reports/shipper-performance?startDate=2026-03-01&endDate=2026-03-31
   * Hieu suat giao hang cua shipper
   */
  @Get('shipper-performance')
  async getShipperPerformance(@Query() query: ReportQueryDto) {
    return this.reportsService.getShipperPerformance(query);
  }

  /**
   * GET /reports/coupons?startDate=2026-03-01&endDate=2026-03-31
   * Thong ke su dung coupon
   */
  @Get('coupons')
  async getCoupons(@Query() query: ReportQueryDto) {
    return this.reportsService.getCouponReport(query);
  }

  /**
   * GET /reports/pos/today
   * Báo cáo POS hôm nay: doanh thu, đơn hàng, top sản phẩm
   */
  @Get('pos/today')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getPosToday() {
    return this.reportsService.getPosToday();
  }

  /**
   * GET /reports/export/:type?startDate=2026-03-01&endDate=2026-03-31
   * Export bao cao ra file Excel
   * type: revenue | inventory | customers | shipper-performance | coupons
   */
  @Get('export/:type')
  async exportExcel(
    @Param('type') type: string,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    return this.reportsService.exportToExcel(type, query, res);
  }
}
