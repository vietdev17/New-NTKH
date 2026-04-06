import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Coupon, CouponDocument } from '../coupons/schemas/coupon.schema';
import {
  ShipperLocation,
  ShipperLocationDocument,
} from '../shipper/schemas/shipper-location.schema';
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
    @InjectModel(ShipperLocation.name)
    private shipperLocationModel: Model<ShipperLocationDocument>,
  ) {}

  // ============================================================
  // Helper: Tao date range filter
  // ============================================================

  private getDateRange(query: ReportQueryDto) {
    const now = new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
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
        return {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        };
    }
  }

  // ============================================================
  // 1. Dashboard - Tong quan
  // ============================================================

  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
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
      { $match: { isDeleted: false } },
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
      status: 'active',
    });

    // Tong san pham
    const totalProducts = await this.productModel.countDocuments({
      status: 'active',
    });

    // Tong khach hang
    const totalCustomers = await this.userModel.countDocuments({
      role: 'customer',
    });

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
        total: ordersByStatus.reduce(
          (sum, item) => sum + item.count,
          0,
        ),
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

  private async getRevenueInPeriod(
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: {
            $in: ['delivered', 'confirmed', 'in_transit', 'preparing'],
          },
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
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
          status: {
            $in: ['delivered', 'confirmed', 'in_transit', 'preparing'],
          },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = revenue.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );
    const totalOrders = revenue.reduce(
      (sum, item) => sum + item.orderCount,
      0,
    );

    return {
      period: {
        startDate,
        endDate,
        groupBy: query.groupBy || 'day',
      },
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue:
          totalOrders > 0
            ? Math.round(totalRevenue / totalOrders)
            : 0,
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
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Theo phuong thuc thanh toan
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Theo kenh ban (web vs POS)
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: { $cond: ['$isPosOrder', 'pos', 'web'] },
            count: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      period: { startDate, endDate },
      byStatus: byStatus.map((s) => ({
        status: s._id,
        count: s.count,
        revenue: s.revenue,
      })),
      byPaymentMethod: byPaymentMethod.map((p) => ({
        method: p._id,
        count: p.count,
        revenue: p.revenue,
      })),
      byChannel: byChannel.map((c) => ({
        channel: c._id,
        count: c.count,
        revenue: c.revenue,
      })),
    };
  }

  // ============================================================
  // 4. Top san pham
  // ============================================================

  async getTopProducts(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);
    const limit = parseInt(query.limit) || 10;

    const topByRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          isDeleted: false,
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalRevenue: {
            $sum: {
              $multiply: ['$items.unitPrice', '$items.quantity'],
            },
          },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    const topByQuantity = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          isDeleted: false,
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalRevenue: {
            $sum: {
              $multiply: ['$items.unitPrice', '$items.quantity'],
            },
          },
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
      .find({ status: 'active' })
      .select('name variants')
      .lean();

    const inventory = products.map((product) => {
      const totalStock = product.variants.reduce(
        (sum: number, v: any) => sum + (v.stock || 0),
        0,
      );
      const lowStockVariants = product.variants.filter(
        (v: any) => v.stock < 10 && v.stock > 0,
      );
      const outOfStockVariants = product.variants.filter(
        (v: any) => v.stock === 0,
      );

      return {
        productId: product._id,
        name: product.name,
        totalStock,
        variantCount: product.variants.length,
        lowStockVariants: lowStockVariants.map((v: any) => ({
          sku: v.sku,
          stock: v.stock,
        })),
        outOfStockVariants: outOfStockVariants.map((v: any) => ({
          sku: v.sku,
        })),
        status:
          outOfStockVariants.length > 0
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
      outOfStock: inventory.filter(
        (i) => i.status === 'out_of_stock',
      ).length,
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
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$customerId',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total' },
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
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          customerId: '$_id',
          fullName: '$user.fullName',
          email: '$user.email',
          phone: '$user.phone',
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 0] },
        },
      },
    ]);

    // Ty le giu chan: so khach quay lai / tong khach
    const totalCustomersInPeriod = await this.orderModel.distinct(
      'customerId',
      {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    );
    const returningCustomers = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
        },
      },
      { $match: { orderCount: { $gte: 2 } } },
    ]);

    const retentionRate =
      totalCustomersInPeriod.length > 0
        ? Math.round(
            (returningCustomers.length /
              totalCustomersInPeriod.length) *
              100,
          )
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
  // 7. Hieu suat shipper
  // ============================================================

  async getShipperPerformance(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const performance = await this.orderModel.aggregate([
      {
        $match: {
          shipperId: { $exists: true, $ne: null },
          createdAt: { $gte: startDate, $lte: endDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$shipperId',
          totalDeliveries: { $sum: 1 },
          delivered: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0],
            },
          },
          totalCOD: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$paymentMethod', 'cod'] },
                    { $eq: ['$status', 'delivered'] },
                  ],
                },
                '$total',
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
          foreignField: 'shipperId',
          as: 'locationInfo',
        },
      },
      {
        $project: {
          shipperId: '$_id',
          fullName: '$shipper.fullName',
          phone: '$shipper.phone',
          totalDeliveries: 1,
          delivered: 1,
          onTimeRate: {
            $cond: [
              { $gt: ['$totalDeliveries', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$delivered',
                          '$totalDeliveries',
                        ],
                      },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
          totalCOD: 1,
          currentStatus: {
            $arrayElemAt: ['$locationInfo.status', 0],
          },
        },
      },
      { $sort: { delivered: -1 } },
    ]);

    return {
      period: { startDate, endDate },
      shippers: performance,
      summary: {
        totalShippers: performance.length,
        totalDeliveries: performance.reduce(
          (sum, s) => sum + s.totalDeliveries,
          0,
        ),
        totalDelivered: performance.reduce(
          (sum, s) => sum + s.delivered,
          0,
        ),
        totalCODCollected: performance.reduce(
          (sum, s) => sum + s.totalCOD,
          0,
        ),
      },
    };
  }

  // ============================================================
  // 8. Bao cao coupon
  // ============================================================

  async getCouponReport(query: ReportQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // Thong ke su dung coupon tu don hang
    const couponUsage = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          couponCode: { $exists: true, $ne: null },
          status: { $ne: 'cancelled' },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$couponCode',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
          totalRevenue: { $sum: '$total' },
        },
      },
      {
        $lookup: {
          from: 'coupons',
          localField: '_id',
          foreignField: 'code',
          as: 'couponInfo',
        },
      },
      { $unwind: { path: '$couponInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          code: '$_id',
          discountType: '$couponInfo.discountType',
          discountValue: '$couponInfo.discountValue',
          usageCount: 1,
          totalDiscount: 1,
          totalRevenue: 1,
          maxUsage: '$couponInfo.maxUsage',
          currentUsage: '$couponInfo.usedCount',
          isActive: '$couponInfo.isActive',
        },
      },
      { $sort: { usageCount: -1 } },
    ]);

    const summary = {
      totalCouponsUsed: couponUsage.length,
      totalDiscountGiven: couponUsage.reduce(
        (sum, c) => sum + (c.totalDiscount || 0),
        0,
      ),
      totalRevenueWithCoupon: couponUsage.reduce(
        (sum, c) => sum + (c.totalRevenue || 0),
        0,
      ),
    };

    return {
      period: { startDate, endDate },
      summary,
      coupons: couponUsage,
    };
  }

  // ============================================================
  // 9. Báo cáo POS hôm nay
  // ============================================================

  async getPosToday() {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const posFilter = {
      isPosOrder: true,
      createdAt: { $gte: startOfDay },
      status: { $ne: 'cancelled' },
      isDeleted: false,
    };

    // Tổng hợp doanh thu POS
    const [summary] = await this.orderModel.aggregate([
      { $match: posFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalCash: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0],
            },
          },
          totalBank: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMethod', 'bank_transfer'] },
                '$total',
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalOrders = summary?.totalOrders || 0;
    const totalRevenue = summary?.totalRevenue || 0;
    const totalCash = summary?.totalCash || 0;
    const totalBank = summary?.totalBank || 0;
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Top 5 sản phẩm bán chạy qua POS hôm nay
    const topProducts = await this.orderModel.aggregate([
      { $match: posFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: {
              $multiply: ['$items.unitPrice', '$items.quantity'],
            },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // 10 đơn POS gần nhất hôm nay
    const recentOrders = await this.orderModel
      .find(posFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'orderNumber customerName items total paymentMethod status createdAt',
      )
      .lean()
      .exec();

    return {
      success: true,
      message: 'Báo cáo POS hôm nay',
      data: {
        totalOrders,
        totalRevenue,
        totalCash,
        totalBank,
        averageOrderValue,
        topProducts,
        recentOrders,
      },
    };
  }

  // ============================================================
  // 10. Export Excel
  // ============================================================

  async exportToExcel(
    type: string,
    query: ReportQueryDto,
    res: Response,
  ): Promise<void> {
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
          {
            header: 'Doanh thu (VND)',
            key: 'revenue',
            width: 20,
          },
          {
            header: 'So don hang',
            key: 'orderCount',
            width: 15,
          },
          {
            header: 'Gia tri TB (VND)',
            key: 'avgOrderValue',
            width: 20,
          },
        ];
        data.data.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        filename = `revenue-report-${Date.now()}.xlsx`;
        break;
      }

      case 'inventory': {
        const data = await this.getInventoryReport();
        sheet = workbook.addWorksheet('Ton kho');
        sheet.columns = [
          { header: 'San pham', key: 'name', width: 35 },
          {
            header: 'Tong ton kho',
            key: 'totalStock',
            width: 15,
          },
          {
            header: 'So bien the',
            key: 'variantCount',
            width: 15,
          },
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
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        filename = `inventory-report-${Date.now()}.xlsx`;
        break;
      }

      case 'customers': {
        const data = await this.getCustomerReport(query);
        sheet = workbook.addWorksheet('Khach hang');
        sheet.columns = [
          { header: 'Ten', key: 'fullName', width: 25 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'SDT', key: 'phone', width: 15 },
          {
            header: 'Tong chi tieu (VND)',
            key: 'totalSpent',
            width: 20,
          },
          { header: 'So don', key: 'orderCount', width: 12 },
        ];
        data.topCustomers.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        filename = `customer-report-${Date.now()}.xlsx`;
        break;
      }

      case 'shipper-performance': {
        const data = await this.getShipperPerformance(query);
        sheet = workbook.addWorksheet('Shipper');
        sheet.columns = [
          { header: 'Ten shipper', key: 'fullName', width: 25 },
          { header: 'SDT', key: 'phone', width: 15 },
          {
            header: 'Tong don',
            key: 'totalDeliveries',
            width: 12,
          },
          { header: 'Da giao', key: 'delivered', width: 12 },
          { header: 'Ty le (%)', key: 'onTimeRate', width: 12 },
          {
            header: 'COD thu (VND)',
            key: 'totalCOD',
            width: 20,
          },
        ];
        data.shippers.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        filename = `shipper-performance-${Date.now()}.xlsx`;
        break;
      }

      case 'coupons': {
        const data = await this.getCouponReport(query);
        sheet = workbook.addWorksheet('Coupon');
        sheet.columns = [
          { header: 'Ma', key: 'code', width: 20 },
          { header: 'Loai', key: 'discountType', width: 12 },
          { header: 'Gia tri', key: 'discountValue', width: 12 },
          {
            header: 'So lan dung',
            key: 'usageCount',
            width: 15,
          },
          {
            header: 'Tong giam (VND)',
            key: 'totalDiscount',
            width: 20,
          },
          {
            header: 'Doanh thu (VND)',
            key: 'totalRevenue',
            width: 20,
          },
        ];
        data.coupons.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' },
        };
        filename = `coupon-report-${Date.now()}.xlsx`;
        break;
      }

      default:
        filename = 'report.xlsx';
        sheet = workbook.addWorksheet('Empty');
        sheet.addRow(['Loai bao cao khong hop le']);
    }

    // Set headers va gui file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
