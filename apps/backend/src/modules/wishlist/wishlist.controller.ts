import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
import { CheckMultipleDto } from './dto/check-multiple.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@ApiBearerAuth('access-token')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  // GET /wishlist
  @Get()
  @ApiOperation({ summary: 'Lay danh sach yeu thich (phan trang)' })
  @ApiResponse({ status: 200, description: 'Danh sach yeu thich' })
  async getWishlist(@Request() req, @Query() query: QueryWishlistDto) {
    const result = await this.wishlistService.getWishlist(
      req.user._id || req.user.sub,
      query,
    );
    return {
      success: true,
      message: 'Lay danh sach yeu thich thanh cong',
      data: result,
    };
  }

  // GET /wishlist/count - must be before check/:productId and :productId
  @Get('count')
  @ApiOperation({ summary: 'Dem so luong san pham trong wishlist' })
  @ApiResponse({ status: 200, description: 'So luong san pham' })
  async getCount(@Request() req) {
    const count = await this.wishlistService.getCount(req.user._id || req.user.sub);
    return {
      success: true,
      data: { count },
    };
  }

  // GET /wishlist/check/:productId - must be before :productId
  @Get('check/:productId')
  @ApiOperation({ summary: 'Kiem tra 1 san pham co trong wishlist khong' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Ket qua kiem tra' })
  async checkProduct(@Request() req, @Param('productId') productId: string) {
    const isInWishlist = await this.wishlistService.isInWishlist(
      req.user._id || req.user.sub,
      productId,
    );
    return {
      success: true,
      data: { productId, isInWishlist },
    };
  }

  // POST /wishlist/check-multiple
  @Post('check-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kiem tra nhieu san pham cung luc (batch check)' })
  @ApiResponse({ status: 200, description: 'Map { productId: boolean }' })
  async checkMultiple(@Request() req, @Body() dto: CheckMultipleDto) {
    const result = await this.wishlistService.checkMultiple(
      req.user._id || req.user.sub,
      dto.productIds,
    );
    return {
      success: true,
      data: result,
    };
  }

  // POST /wishlist
  @Post()
  @ApiOperation({ summary: 'Them san pham vao wishlist' })
  @ApiResponse({ status: 201, description: 'Da them vao danh sach yeu thich' })
  @ApiResponse({ status: 409, description: 'San pham da co trong wishlist' })
  async addToWishlist(@Request() req, @Body() dto: AddToWishlistDto) {
    const item = await this.wishlistService.add(req.user._id || req.user.sub, dto);
    return {
      success: true,
      message: 'Da them vao danh sach yeu thich',
      data: item,
    };
  }

  // DELETE /wishlist/:productId
  @Delete(':productId')
  @ApiOperation({ summary: 'Xoa 1 san pham khoi wishlist' })
  @ApiParam({ name: 'productId', description: 'Product ID can xoa' })
  @ApiResponse({ status: 200, description: 'Da xoa khoi danh sach yeu thich' })
  @ApiResponse({ status: 404, description: 'San pham khong ton tai trong wishlist' })
  async removeFromWishlist(@Request() req, @Param('productId') productId: string) {
    await this.wishlistService.remove(req.user._id || req.user.sub, productId);
    return {
      success: true,
      message: 'Da xoa khoi danh sach yeu thich',
    };
  }

  // DELETE /wishlist
  @Delete()
  @ApiOperation({ summary: 'Xoa toan bo wishlist' })
  @ApiResponse({ status: 200, description: 'Da xoa toan bo danh sach yeu thich' })
  async clearWishlist(@Request() req) {
    const result = await this.wishlistService.clear(req.user._id || req.user.sub);
    return {
      success: true,
      message: 'Da xoa toan bo danh sach yeu thich',
      data: result,
    };
  }
}
