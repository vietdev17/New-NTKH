import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShipperService } from './shipper.service';
import { ShipperLocationService } from './shipper-location.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  User,
  UserDocument,
  UserRole,
} from '../users/schemas/user.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';

@ApiTags('Admin Shippers')
@ApiBearerAuth()
@Controller('admin/shippers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminShipperController {
  constructor(
    private readonly shipperService: ShipperService,
    private readonly locationService: ShipperLocationService,
    private readonly ordersService: OrdersService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  // ===== DANH SACH TAT CA SHIPPER =====
  @Get()
  async listShippers(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<any> {
    const skip = (Number(page) - 1) * Number(limit);
    const conditions: any = { role: UserRole.SHIPPER, isDeleted: false };

    if (status) {
      conditions.shipperStatus = status;
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(conditions)
        .select(
          'fullName email phone avatar shipperStatus createdAt',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.userModel.countDocuments(conditions),
    ]);

    // Them thong ke cho moi shipper
    const shippersWithStats = await Promise.all(
      data.map(async (shipper) => {
        const [activeOrders, deliveredOrders] = await Promise.all([
          this.orderModel.countDocuments({
            shipperId: shipper._id,
            status: OrderStatus.IN_TRANSIT,
          }),
          this.orderModel.countDocuments({
            shipperId: shipper._id,
            status: OrderStatus.DELIVERED,
          }),
        ]);
        return {
          ...shipper,
          activeOrders,
          deliveredOrders,
        };
      }),
    );

    return {
      success: true,
      data: shippersWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ===== VI TRI TAT CA SHIPPER DANG HOAT DONG (CHO BAN DO) =====
  @Get('locations')
  async getAllActiveLocations() {
    const data =
      await this.locationService.getAllActiveLocations();
    return {
      success: true,
      data,
    };
  }

  // ===== TIM SHIPPER GAN VI TRI =====
  @Get('nearby')
  async findNearbyShippers(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5,
  ): Promise<any> {
    if (!lat || !lng) {
      throw new BadRequestException(
        'Can truyen toa do lat va lng',
      );
    }

    const data = await this.locationService.getNearbyShippers(
      Number(lat),
      Number(lng),
      Number(radius),
    );

    return {
      success: true,
      data,
      meta: {
        searchCenter: { lat: Number(lat), lng: Number(lng) },
        radiusKm: Number(radius),
        found: data.length,
      },
    };
  }

  // ===== CHI TIET SHIPPER =====
  @Get(':id')
  async getShipperDetail(@Param('id') id: string): Promise<any> {
    const shipper = await this.userModel
      .findOne({
        _id: new Types.ObjectId(id),
        role: UserRole.SHIPPER,
      })
      .select('-password')
      .lean();

    if (!shipper) {
      throw new NotFoundException('Shipper khong ton tai');
    }

    // Lay vi tri hien tai
    let currentLocation = null;
    try {
      currentLocation = await this.locationService.getLocation(id);
    } catch (e) {
      // Shipper chua bao gio cap nhat vi tri
    }

    // Lay thong ke
    const stats = await this.shipperService.getStats(id);

    return {
      success: true,
      data: {
        ...shipper,
        currentLocation,
        stats,
      },
    };
  }

  // ===== GAN DON THU CONG CHO SHIPPER =====
  @Post(':id/assign-order/:orderId')
  async assignOrder(
    @Param('id') shipperId: string,
    @Param('orderId') orderId: string,
  ) {
    // Gọi ordersService.assignShipper — chấp nhận CONFIRMED & PREPARING
    const order = await this.ordersService.assignShipper(orderId, shipperId);

    return {
      success: true,
      message: `Đã gán đơn ${order.orderNumber} cho shipper ${(order as any).shipperName}`,
      data: order,
    };
  }
}
