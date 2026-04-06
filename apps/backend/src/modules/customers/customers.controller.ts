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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { LoyaltyPointsDto } from './dto/loyalty-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // GET /customers
  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Danh sach khach hang (phan trang, tim kiem)' })
  @ApiResponse({ status: 200, description: 'Danh sach khach hang' })
  async findAll(@Query() query: QueryCustomerDto) {
    const result = await this.customersService.findAll(query);
    return {
      success: true,
      message: 'Lay danh sach khach hang thanh cong',
      data: result,
    };
  }

  // GET /customers/top - must be before /:id
  @Get('top')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Top khach hang theo tong chi tieu' })
  @ApiResponse({ status: 200, description: 'Danh sach top khach hang' })
  async getTopCustomers(@Query('limit') limit?: number) {
    const result = await this.customersService.getTopCustomers(limit || 10);
    return {
      success: true,
      message: 'Lay top khach hang thanh cong',
      data: result,
    };
  }

  // GET /customers/phone/:phone - must be before /:id
  @Get('phone/:phone')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Tra cuu nhanh theo so dien thoai (POS)' })
  @ApiParam({ name: 'phone', description: 'So dien thoai khach hang' })
  @ApiResponse({ status: 200, description: 'Thong tin khach hang hoac null' })
  async findByPhone(@Param('phone') phone: string) {
    const customer = await this.customersService.findByPhone(phone);
    return {
      success: true,
      data: customer,
    };
  }

  // GET /customers/:id
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Chi tiet khach hang + thong ke don hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Thong tin chi tiet khach hang' })
  @ApiResponse({ status: 404, description: 'Khong tim thay khach hang' })
  async findById(@Param('id') id: string) {
    const customer = await this.customersService.findById(id);
    return {
      success: true,
      data: customer,
    };
  }

  // POST /customers
  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Tao khach hang moi (POS - chi can so dien thoai)' })
  @ApiResponse({ status: 201, description: 'Tao khach hang thanh cong' })
  @ApiResponse({ status: 409, description: 'So dien thoai hoac email da ton tai' })
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.customersService.create(dto);
    return {
      success: true,
      message: 'Tao khach hang thanh cong',
      data: customer,
    };
  }

  // PATCH /customers/:id
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Cap nhat thong tin khach hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Cap nhat thanh cong' })
  @ApiResponse({ status: 404, description: 'Khong tim thay khach hang' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const customer = await this.customersService.update(id, dto);
    return {
      success: true,
      message: 'Cap nhat khach hang thanh cong',
      data: customer,
    };
  }

  // POST /customers/:id/addresses
  @Post(':id/addresses')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Them dia chi giao hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async addAddress(@Param('id') id: string, @Body() dto: AddressDto, @Request() req) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id?.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.addAddress(id, dto);
    return {
      success: true,
      message: 'Them dia chi thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // PATCH /customers/:id/addresses/:index
  @Patch(':id/addresses/:index')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cap nhat dia chi giao hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiParam({ name: 'index', description: 'Chi so dia chi (0-based)' })
  async updateAddress(
    @Param('id') id: string,
    @Param('index') index: number,
    @Body() dto: AddressDto,
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id?.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.updateAddress(id, +index, dto);
    return {
      success: true,
      message: 'Cap nhat dia chi thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // DELETE /customers/:id/addresses/:index
  @Delete(':id/addresses/:index')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Xoa dia chi giao hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiParam({ name: 'index', description: 'Chi so dia chi (0-based)' })
  async removeAddress(
    @Param('id') id: string,
    @Param('index') index: number,
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id?.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.removeAddress(id, +index);
    return {
      success: true,
      message: 'Xoa dia chi thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // PATCH /customers/:id/addresses/:index/default
  @Patch(':id/addresses/:index/default')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Dat dia chi mac dinh' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiParam({ name: 'index', description: 'Chi so dia chi (0-based)' })
  async setDefaultAddress(
    @Param('id') id: string,
    @Param('index') index: number,
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id?.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const customer = await this.customersService.setDefaultAddress(id, +index);
    return {
      success: true,
      message: 'Dat dia chi mac dinh thanh cong',
      data: { addresses: customer.addresses },
    };
  }

  // GET /customers/:id/orders
  @Get(':id/orders')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lich su don hang cua khach' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getOrderHistory(
    @Param('id') id: string,
    @Query() query: { page?: number; limit?: number },
    @Request() req,
  ) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id?.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const result = await this.customersService.getOrderHistory(id, query);
    return {
      success: true,
      data: result,
    };
  }

  // GET /customers/:id/stats
  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Thong ke khach hang (tong don, tong chi tieu, ...)' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getCustomerStats(@Param('id') id: string) {
    const stats = await this.customersService.getCustomerStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  // POST /customers/:id/loyalty/add
  @Post(':id/loyalty/add')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cong diem loyalty cho khach hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async addLoyaltyPoints(@Param('id') id: string, @Body() dto: LoyaltyPointsDto) {
    const result = await this.customersService.addLoyaltyPoints(id, dto.points, dto.reason);
    return {
      success: true,
      message: `Da cong ${dto.points} diem loyalty`,
      data: result,
    };
  }

  // POST /customers/:id/loyalty/deduct
  @Post(':id/loyalty/deduct')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tru diem loyalty cua khach hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async deductLoyaltyPoints(@Param('id') id: string, @Body() dto: LoyaltyPointsDto) {
    const result = await this.customersService.deductLoyaltyPoints(id, dto.points, dto.reason);
    return {
      success: true,
      message: `Da tru ${dto.points} diem loyalty`,
      data: result,
    };
  }

  // GET /customers/:id/loyalty/history
  @Get(':id/loyalty/history')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lich su diem loyalty cua khach hang' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getLoyaltyHistory(@Param('id') id: string, @Request() req) {
    if (req.user.role === UserRole.CUSTOMER && req.user._id?.toString() !== id) {
      return { success: false, message: 'Khong co quyen thao tac' };
    }
    const history = await this.customersService.getLoyaltyHistory(id);
    return {
      success: true,
      data: history,
    };
  }
}
