import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './schemas/user.schema';
import { TokenPayload } from '../auth/auth.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users - Admin only
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Danh sach tat ca nguoi dung (Admin)' })
  @ApiResponse({ status: 200, description: 'Danh sach user co phan trang' })
  @ApiResponse({ status: 403, description: 'Forbidden - Khong phai Admin' })
  async findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  // GET /users/staff - Must be before /:id
  @Get('staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Danh sach staff va manager' })
  @ApiResponse({ status: 200, description: 'Danh sach staff' })
  async getStaff() {
    return this.usersService.getStaff();
  }

  // GET /users/shippers - Must be before /:id
  @Get('shippers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Danh sach shipper' })
  @ApiResponse({ status: 200, description: 'Danh sach shipper' })
  async getShippers() {
    return this.usersService.getShippers();
  }

  // GET /users/:id
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lay thong tin user theo ID (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Thong tin user' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('Nguoi dung khong ton tai');
    }
    return user;
  }

  // POST /users
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tao nguoi dung moi (Admin)' })
  @ApiResponse({ status: 201, description: 'User da duoc tao' })
  @ApiResponse({ status: 400, description: 'Email/Phone da ton tai' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // PATCH /users/:id
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cap nhat thong tin user (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User da duoc cap nhat' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // DELETE /users/:id
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xoa nguoi dung - soft delete (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User da bi xoa' })
  @ApiResponse({ status: 404, description: 'User khong ton tai' })
  async softDelete(@Param('id') id: string, @CurrentUser() currentUser: TokenPayload) {
    if (currentUser.sub === id) {
      throw new ForbiddenException('Khong the tu xoa tai khoan cua minh');
    }
    return this.usersService.softDelete(id);
  }

  // PATCH /users/:id/role
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Thay doi role cua user (Admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role da duoc cap nhat' })
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser() currentUser: TokenPayload,
  ) {
    if (currentUser.sub === id) {
      throw new ForbiddenException('Khong the tu thay doi role cua minh');
    }
    return this.usersService.changeRole(id, role);
  }

  // ===== ADDRESS MANAGEMENT (cho logged-in user) =====
  @Post('addresses')
  @ApiOperation({ summary: 'Them dia chi moi cho user dang dang nhap' })
  async addAddress(@Request() req, @Body() dto: any) {
    return this.usersService.addAddress(req.user.sub, dto);
  }

  @Patch('addresses/:addressId')
  @ApiOperation({ summary: 'Cap nhat dia chi theo ID' })
  async updateAddress(@Request() req, @Param('addressId') addressId: string, @Body() dto: any) {
    return this.usersService.updateAddress(req.user.sub, addressId, dto);
  }

  @Delete('addresses/:addressId')
  @ApiOperation({ summary: 'Xoa dia chi theo ID' })
  async deleteAddress(@Request() req, @Param('addressId') addressId: string) {
    return this.usersService.deleteAddress(req.user.sub, addressId);
  }

  @Patch('addresses/:addressId/default')
  @ApiOperation({ summary: 'Dat lam dia chi mac dinh' })
  async setDefaultAddress(@Request() req, @Param('addressId') addressId: string) {
    return this.usersService.setDefaultAddress(req.user.sub, addressId);
  }

  // PATCH /users/:id/activate-shipper
  @Patch(':id/activate-shipper')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Kich hoat tai khoan shipper' })
  @ApiParam({ name: 'id', description: 'Shipper User ID' })
  @ApiResponse({ status: 200, description: 'Shipper da duoc kich hoat' })
  async activateShipper(@Param('id') id: string) {
    return this.usersService.activateShipper(id);
  }

  // PATCH /users/:id/deactivate-shipper
  @Patch(':id/deactivate-shipper')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Vo hieu hoa tai khoan shipper' })
  @ApiParam({ name: 'id', description: 'Shipper User ID' })
  @ApiResponse({ status: 200, description: 'Shipper da bi vo hieu hoa' })
  async deactivateShipper(@Param('id') id: string) {
    return this.usersService.deactivateShipper(id);
  }
}
