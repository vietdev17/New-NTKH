# REPORTS MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module bao cao thong ke - Dashboard, doanh thu, ton kho, shipper, coupon
> FIXED: Inject Model truc tiep, khong phu thuoc ordersService
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [DTOs](#3-dtos)
4. [ReportsService](#4-reportsservice)
5. [ReportsController](#5-reportscontroller)
6. [Bang API Endpoints](#6-bang-api-endpoints)
7. [Vi du Request/Response](#7-vi-du-requestresponse)

---

## 1. Tong quan

Module Reports cung cap cac bao cao thong ke cho admin:

- **Dashboard**: Tong quan nhanh (doanh thu, don hang, khach hang, ton kho)
- **Revenue**: Doanh thu theo ngay/tuan/thang, co filter khoang thoi gian
- **Orders**: Thong ke don hang theo trang thai, phuong thuc thanh toan, kenh ban
- **Products**: Top san pham ban chay theo doanh thu hoac so luong
- **Inventory**: Bao cao ton kho, canh bao het hang
- **Customers**: Khach hang moi, top khach hang, ty le giu chan
- **Shipper Performance**: Hieu suat giao hang cua shipper
- **Coupon**: Thong ke su dung ma giam gia
- **Export**: Xuat bao cao ra file Excel (exceljs)

**Quan trong:** Module nay inject truc tiep OrderModel, ProductModel, UserModel, CouponModel
thay vi dung ordersService de tranh circular dependency va co toan quyen truy van aggregation.

---

## 2. Cau truc module

```
apps/api/src/modules/reports/
├── reports.module.ts
├── reports.service.ts
├── reports.controller.ts
└── dto/
    └── report-query.dto.ts
```

### Module Registration

```typescript
// reports.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Coupon, CouponSchema } from '../../schemas/coupon.schema';
import { ShipperLocation, ShipperLocationSchema } from '../../schemas/shipper-location.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: ShipperLocation.name, schema: ShipperLocationSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
```

---

## 3. DTOs

### ReportQueryDto

```typescript
// dto/report-query.dto.ts
import { IsOptional, IsDateString, IsEnum, IsNumberString } from 'class-validator';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string; // ISO date: '2026-03-01'

  @IsOptional()
  @IsDateString()
  endDate?: string; // ISO date: '2026-03-31'

  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month'; // Default: 'day'

  @IsOptional()
  @IsNumberString()
  limit?: string; // Default: '10' (cho top products, top customers)
}
```

---

## 4. ReportsService

```typescript
// reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Coupon, CouponDocument } from '../../schemas/coupon.schema';
import { ShipperLocation, ShipperLocationDocument } from '../../schemas/shipper-location.schema';
import { ReportQueryDto } from './dto/report-query.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(ShipperLocation.name) private shipperLocationModel: Model<ShipperLocationDocument>,
  ) {}

  // ============================================================
  // Helper: Tao date range filter
  // ============================================================

  private getDateRange(query: ReportQueryDto) {
    const now = new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = query.endDate ? new Date(query.endDate) : now;
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  private getGroupByFormat(groupBy: string = 'day') {
    switch (groupBy) {
      case 'week':
        return { $isoWeek: '$createdAt' };
      case 'month':
        return { $month: '$createdAt' };
      default:
        return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }
  }

  // ============================================================
  // 1. Dashboard - Tong quan
  // ============================================================

  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Doanh thu theo cac moc thoi gian
    const [revenueToday, revenueWeek, revenueMonth] = await Promise.all([
      this.getRevenueInPeriod(todayStart, now),
      this.getRevenueInPeriod(weekStart, now),
      this.getRevenueInPeriod(monthStart, now),
    ]);

    // Dem don hang theo trang thai
    const ordersByStatus = await this.orderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Khach hang moi trong thang
    const newCustomers = await this.userModel.countDocuments({
      role: 'customer',
      createdAt: { $gte: monthStart },
    });

    // San pham sap het hang (stock < 10)
    const lowStockCount = await this.productModel.countDocuments({
      'variants.stock': { $lt: 10 },
      isActive: true,
    });

    // Tong san pham
    const totalProducts = await this.productModel.countDocuments({ isActive: true });

    // Tong khach hang
    const totalCustomers = await this.userModel.countDocuments({ role: 'customer' });

    return {
      revenue: {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
      },
      orders: {
        byStatus: ordersByStatus.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {},
        ),
        total: ordersByStatus.reduce((sum, item) => sum + item.count, 0),
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomers,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockCount,
      },
    };
  }

  private async getRevenueInPeriod(start: Date, end: Date): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['delivered', 'confirmed', 'shipping'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return result[0]?.total || 0;
  }

  // ============================================================
  // 2. Bao cao doanh thu
  // ============================================================

  async getRevenueReport(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const groupBy = this.getGroupByFormat(query.groupBy);

    const revenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['delivered', 'confirmed', 'shipping'] },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Tong doanh thu trong khoang thoi gian
    const totalRevenue = revenue.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = revenue.reduce((sum, item) => sum + item.orderCount, 0);

    return {
      period: { startDate, endDate, groupBy: query.groupBy || 'day' },
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      data: revenue.map((item) => ({
        period: item._id,
        revenue: item.revenue,
        orderCount: item.orderCount,
        avgOrderValue: Math.round(item.avgOrderValue),
      })),
    };
  }

  // ============================================================
  // 3. Thong ke don hang
  // ============================================================

  async getOrdersSummary(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const [byStatus, byPaymentMethod, byChannel] = await Promise.all([
      // Theo trang thai
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),

      // Theo phuong thuc thanh toan
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),

      // Theo kenh ban (web vs POS)
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$channel', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      period: { startDate, endDate },
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count, revenue: s.revenue })),
      byPaymentMethod: byPaymentMethod.map((p) => ({
        method: p._id,
        count: p.count,
        revenue: p.revenue,
      })),
      byChannel: byChannel.map((c) => ({ channel: c._id, count: c.count, revenue: c.revenue })),
    };
  }

  // ============================================================
  // 4. Top san pham
  // ============================================================

  async getTopProducts(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const limit = parseInt(query.limit) || 10;

    const topByRevenue = await this.orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    const topByQuantity = await this.orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]);

    return {
      period: { startDate, endDate },
      topByRevenue,
      topByQuantity,
    };
  }

  // ============================================================
  // 5. Bao cao ton kho
  // ============================================================

  async getInventoryReport() {
    const products = await this.productModel
      .find({ isActive: true })
      .select('name sku variants.sku variants.stock variants.color variants.dimension')
      .lean();

    const inventory = products.map((product) => {
      const totalStock = product.variants.reduce((sum: number, v: any) => sum + v.stock, 0);
      const lowStockVariants = product.variants.filter((v: any) => v.stock < 10 && v.stock > 0);
      const outOfStockVariants = product.variants.filter((v: any) => v.stock === 0);

      return {
        productId: product._id,
        name: product.name,
        totalStock,
        variantCount: product.variants.length,
        lowStockVariants: lowStockVariants.map((v: any) => ({
          sku: v.sku,
          stock: v.stock,
          color: v.color?.name,
          dimension: v.dimension?.label,
        })),
        outOfStockVariants: outOfStockVariants.map((v: any) => ({
          sku: v.sku,
          color: v.color?.name,
          dimension: v.dimension?.label,
        })),
        status: outOfStockVariants.length > 0
          ? 'out_of_stock'
          : lowStockVariants.length > 0
            ? 'low_stock'
            : 'in_stock',
      };
    });

    const summary = {
      totalProducts: inventory.length,
      inStock: inventory.filter((i) => i.status === 'in_stock').length,
      lowStock: inventory.filter((i) => i.status === 'low_stock').length,
      outOfStock: inventory.filter((i) => i.status === 'out_of_stock').length,
    };

    return { summary, products: inventory };
  }

  // ============================================================
  // 6. Bao cao khach hang
  // ============================================================

  async getCustomerReport(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const limit = parseInt(query.limit) || 10;

    // Khach hang moi theo thoi gian
    const groupBy = this.getGroupByFormat(query.groupBy);
    const newCustomers = await this.userModel.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top khach hang theo tong chi tieu
    const topCustomers = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          customerId: '$_id',
          name: '$user.name',
          email: '$user.email',
          phone: '$user.phone',
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 0] },
        },
      },
    ]);

    // Ty le giu chan: so khach quay lai / tong khach
    const totalCustomersInPeriod = await this.orderModel.distinct('customer', {
      createdAt: { $gte: startDate, $lte: endDate },
    });
    const returningCustomers = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
        },
      },
      { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gte: 2 } } },
    ]);

    const retentionRate = totalCustomersInPeriod.length > 0
      ? Math.round((returningCustomers.length / totalCustomersInPeriod.length) * 100)
      : 0;

    return {
      period: { startDate, endDate },
      newCustomersByPeriod: newCustomers,
      topCustomers,
      retention: {
        totalCustomers: totalCustomersInPeriod.length,
        returningCustomers: returningCustomers.length,
        retentionRate: `${retentionRate}%`,
      },
    };
  }

  // ============================================================
  // 7. Hieu suat shipper (NEW)
  // ============================================================

  async getShipperPerformance(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const performance = await this.orderModel.aggregate([
      {
        $match: {
          shipper: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$shipper',
          totalDeliveries: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          totalCOD: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$paymentMethod', 'cod'] }, { $eq: ['$status', 'delivered'] }] },
                '$totalAmount',
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'shipper',
        },
      },
      { $unwind: '$shipper' },
      {
        $lookup: {
          from: 'shipperlocations',
          localField: '_id',
          foreignField: 'shipper',
          as: 'locationInfo',
        },
      },
      {
        $project: {
          shipperId: '$_id',
          name: '$shipper.name',
          phone: '$shipper.phone',
          totalDeliveries: 1,
          delivered: 1,
          onTimeRate: {
            $cond: [
              { $gt: ['$totalDeliveries', 0] },
              { $round: [{ $multiply: [{ $divide: ['$delivered', '$totalDeliveries'] }, 100] }, 1] },
              0,
            ],
          },
          totalCOD: 1,
          currentStatus: { $arrayElemAt: ['$locationInfo.status', 0] },
        },
      },
      { $sort: { delivered: -1 } },
    ]);

    return {
      period: { startDate, endDate },
      shippers: performance,
      summary: {
        totalShippers: performance.length,
        totalDeliveries: performance.reduce((sum, s) => sum + s.totalDeliveries, 0),
        totalDelivered: performance.reduce((sum, s) => sum + s.delivered, 0),
        totalCODCollected: performance.reduce((sum, s) => sum + s.totalCOD, 0),
      },
    };
  }

  // ============================================================
  // 8. Bao cao coupon (NEW)
  // ============================================================

  async getCouponReport(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // Thong ke su dung coupon tu don hang
    const couponUsage = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          coupon: { $exists: true, $ne: null },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$coupon',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$discount' },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'coupons',
          localField: '_id',
          foreignField: '_id',
          as: 'couponInfo',
        },
      },
      { $unwind: '$couponInfo' },
      {
        $project: {
          code: '$couponInfo.code',
          type: '$couponInfo.type',
          value: '$couponInfo.value',
          usageCount: 1,
          totalDiscount: 1,
          totalRevenue: 1,
          maxUsage: '$couponInfo.maxUsage',
          currentUsage: '$couponInfo.currentUsage',
          isActive: '$couponInfo.isActive',
        },
      },
      { $sort: { usageCount: -1 } },
    ]);

    const summary = {
      totalCouponsUsed: couponUsage.length,
      totalDiscountGiven: couponUsage.reduce((sum, c) => sum + c.totalDiscount, 0),
      totalRevenueWithCoupon: couponUsage.reduce((sum, c) => sum + c.totalRevenue, 0),
    };

    return {
      period: { startDate, endDate },
      summary,
      coupons: couponUsage,
    };
  }

  // ============================================================
  // 9. Export Excel
  // ============================================================

  async exportToExcel(type: string, query: ReportQueryDto, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FurnitureVN';
    workbook.created = new Date();

    let sheet: ExcelJS.Worksheet;
    let filename: string;

    switch (type) {
      case 'revenue': {
        const data = await this.getRevenueReport(query);
        sheet = workbook.addWorksheet('Doanh thu');
        sheet.columns = [
          { header: 'Thoi gian', key: 'period', width: 20 },
          { header: 'Doanh thu (VND)', key: 'revenue', width: 20 },
          { header: 'So don hang', key: 'orderCount', width: 15 },
          { header: 'Gia tri TB (VND)', key: 'avgOrderValue', width: 20 },
        ];
        data.data.forEach((row) => sheet.addRow(row));
        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filename = `revenue-report-${Date.now()}.xlsx`;
        break;
      }

      case 'inventory': {
        const data = await this.getInventoryReport();
        sheet = workbook.addWorksheet('Ton kho');
        sheet.columns = [
          { header: 'San pham', key: 'name', width: 35 },
          { header: 'Tong ton kho', key: 'totalStock', width: 15 },
          { header: 'So bien the', key: 'variantCount', width: 15 },
          { header: 'Trang thai', key: 'status', width: 15 },
        ];
        data.products.forEach((row) =>
          sheet.addRow({
            name: row.name,
            totalStock: row.totalStock,
            variantCount: row.variantCount,
            status: row.status,
          }),
        );
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filename = `inventory-report-${Date.now()}.xlsx`;
        break;
      }

      case 'customers': {
        const data = await this.getCustomerReport(query);
        sheet = workbook.addWorksheet('Khach hang');
        sheet.columns = [
          { header: 'Ten', key: 'name', width: 25 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'SDT', key: 'phone', width: 15 },
          { header: 'Tong chi tieu (VND)', key: 'totalSpent', width: 20 },
          { header: 'So don', key: 'orderCount', width: 12 },
        ];
        data.topCustomers.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filename = `customer-report-${Date.now()}.xlsx`;
        break;
      }

      case 'shipper-performance': {
        const data = await this.getShipperPerformance(query);
        sheet = workbook.addWorksheet('Shipper');
        sheet.columns = [
          { header: 'Ten shipper', key: 'name', width: 25 },
          { header: 'SDT', key: 'phone', width: 15 },
          { header: 'Tong don', key: 'totalDeliveries', width: 12 },
          { header: 'Da giao', key: 'delivered', width: 12 },
          { header: 'Ty le (%)', key: 'onTimeRate', width: 12 },
          { header: 'COD thu (VND)', key: 'totalCOD', width: 20 },
        ];
        data.shippers.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filename = `shipper-performance-${Date.now()}.xlsx`;
        break;
      }

      case 'coupons': {
        const data = await this.getCouponReport(query);
        sheet = workbook.addWorksheet('Coupon');
        sheet.columns = [
          { header: 'Ma', key: 'code', width: 20 },
          { header: 'Loai', key: 'type', width: 12 },
          { header: 'Gia tri', key: 'value', width: 12 },
          { header: 'So lan dung', key: 'usageCount', width: 15 },
          { header: 'Tong giam (VND)', key: 'totalDiscount', width: 20 },
          { header: 'Doanh thu (VND)', key: 'totalRevenue', width: 20 },
        ];
        data.coupons.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        filename = `coupon-report-${Date.now()}.xlsx`;
        break;
      }

      default:
        filename = 'report.xlsx';
        sheet = workbook.addWorksheet('Empty');
        sheet.addRow(['Loai bao cao khong hop le']);
    }

    // Set headers va gui file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
```

---

## 5. ReportsController

```typescript
// reports.controller.ts
import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
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
```

---

## 6. Bang API Endpoints

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| GET | `/reports/dashboard` | Admin | Tong quan: doanh thu, don hang, khach hang, ton kho |
| GET | `/reports/revenue` | Admin | Doanh thu theo ngay/tuan/thang |
| GET | `/reports/orders-summary` | Admin | Don hang theo trang thai, thanh toan, kenh |
| GET | `/reports/top-products` | Admin | Top san pham ban chay |
| GET | `/reports/inventory` | Admin | Bao cao ton kho |
| GET | `/reports/customers` | Admin | Bao cao khach hang, retention |
| GET | `/reports/shipper-performance` | Admin | Hieu suat shipper |
| GET | `/reports/coupons` | Admin | Thong ke su dung coupon |
| GET | `/reports/export/:type` | Admin | Xuat Excel (tra ve file .xlsx) |

> **Luu y:** Tat ca endpoint yeu cau role `admin`.

---

## 7. Vi du Request/Response

### GET /reports/dashboard

**Request:**
```http
GET /api/reports/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "revenue": {
    "today": 25500000,
    "week": 189000000,
    "month": 756000000
  },
  "orders": {
    "byStatus": {
      "pending": 12,
      "confirmed": 8,
      "shipping": 5,
      "delivered": 156,
      "cancelled": 3
    },
    "total": 184
  },
  "customers": {
    "total": 1250,
    "newThisMonth": 87
  },
  "products": {
    "total": 342,
    "lowStock": 15
  }
}
```

### GET /reports/revenue?startDate=2026-03-01&endDate=2026-03-31&groupBy=day

**Request:**
```http
GET /api/reports/revenue?startDate=2026-03-01&endDate=2026-03-31&groupBy=day
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-03-31T23:59:59.999Z",
    "groupBy": "day"
  },
  "summary": {
    "totalRevenue": 756000000,
    "totalOrders": 184,
    "avgOrderValue": 4108696
  },
  "data": [
    { "period": "2026-03-01", "revenue": 28500000, "orderCount": 7, "avgOrderValue": 4071429 },
    { "period": "2026-03-02", "revenue": 31200000, "orderCount": 8, "avgOrderValue": 3900000 },
    { "period": "2026-03-03", "revenue": 19800000, "orderCount": 5, "avgOrderValue": 3960000 }
  ]
}
```

### GET /reports/shipper-performance?startDate=2026-03-01&endDate=2026-03-31

**Request:**
```http
GET /api/reports/shipper-performance?startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-03-31T23:59:59.999Z"
  },
  "shippers": [
    {
      "shipperId": "660f1a2b3c4d5e6f7a8b9c10",
      "name": "Tran Van Binh",
      "phone": "0901234567",
      "totalDeliveries": 45,
      "delivered": 42,
      "onTimeRate": 93.3,
      "totalCOD": 125000000,
      "currentStatus": "online"
    },
    {
      "shipperId": "660f1a2b3c4d5e6f7a8b9c11",
      "name": "Le Minh Duc",
      "phone": "0912345678",
      "totalDeliveries": 38,
      "delivered": 35,
      "onTimeRate": 92.1,
      "totalCOD": 98000000,
      "currentStatus": "delivering"
    }
  ],
  "summary": {
    "totalShippers": 2,
    "totalDeliveries": 83,
    "totalDelivered": 77,
    "totalCODCollected": 223000000
  }
}
```

### GET /reports/coupons?startDate=2026-03-01&endDate=2026-03-31

**Request:**
```http
GET /api/reports/coupons?startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "period": {
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-03-31T23:59:59.999Z"
  },
  "summary": {
    "totalCouponsUsed": 3,
    "totalDiscountGiven": 15800000,
    "totalRevenueWithCoupon": 198000000
  },
  "coupons": [
    {
      "code": "THANG3-20",
      "type": "percentage",
      "value": 20,
      "usageCount": 45,
      "totalDiscount": 9800000,
      "totalRevenue": 120000000,
      "maxUsage": 100,
      "currentUsage": 45,
      "isActive": true
    },
    {
      "code": "FREESHIP",
      "type": "fixed",
      "value": 50000,
      "usageCount": 32,
      "totalDiscount": 1600000,
      "totalRevenue": 48000000,
      "maxUsage": 50,
      "currentUsage": 32,
      "isActive": true
    }
  ]
}
```

### GET /reports/export/revenue?startDate=2026-03-01&endDate=2026-03-31&groupBy=month

**Request:**
```http
GET /api/reports/export/revenue?startDate=2026-03-01&endDate=2026-03-31&groupBy=month
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=revenue-report-1712067600000.xlsx

[Binary Excel file]
```

### GET /reports/inventory

**Request:**
```http
GET /api/reports/inventory
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "summary": {
    "totalProducts": 342,
    "inStock": 310,
    "lowStock": 15,
    "outOfStock": 17
  },
  "products": [
    {
      "productId": "661a1b2c3d4e5f6a7b8c9d01",
      "name": "Sofa goc chu L vai boc premium",
      "totalStock": 3,
      "variantCount": 4,
      "lowStockVariants": [
        {
          "sku": "SOFA-L-GRY-250",
          "stock": 3,
          "color": "Xam",
          "dimension": "250x160x85cm"
        }
      ],
      "outOfStockVariants": [
        {
          "sku": "SOFA-L-BLU-250",
          "color": "Xanh duong",
          "dimension": "250x160x85cm"
        }
      ],
      "status": "out_of_stock"
    }
  ]
}
```
