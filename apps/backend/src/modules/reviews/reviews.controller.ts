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
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { VoteHelpfulDto } from './dto/vote-helpful.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================================
  // PUBLIC ENDPOINTS (static routes first to avoid conflicts with :id)
  // ============================================================

  // GET /reviews/product/:productId
  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Lay danh gia cua san pham (chi hien thi approved)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Danh sach danh gia co phan trang' })
  async findByProduct(
    @Param('productId') productId: string,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  // GET /reviews/product/:productId/stats
  @Public()
  @Get('product/:productId/stats')
  @ApiOperation({ summary: 'Thong ke rating cua san pham (average, distribution)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Thong ke danh gia' })
  async getProductStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  // ============================================================
  // ADMIN ENDPOINTS (static routes before :id)
  // ============================================================

  // GET /reviews/pending
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Get('pending')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lay danh sach danh gia cho duyet (Admin/Manager/Staff)' })
  @ApiResponse({ status: 200, description: 'Danh sach danh gia pending' })
  async getPendingReviews(@Query() query: QueryReviewDto) {
    return this.reviewsService.getPendingReviews(query);
  }

  // ============================================================
  // CUSTOMER ENDPOINTS (static routes before :id)
  // ============================================================

  // GET /reviews/my-reviews
  @UseGuards(JwtAuthGuard)
  @Get('my-reviews')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lay danh sach danh gia cua user dang dang nhap' })
  @ApiResponse({ status: 200, description: 'Danh sach danh gia cua ban' })
  async getMyReviews(@Request() req: any) {
    return this.reviewsService.findByUser(req.user._id || req.user.sub);
  }

  // GET /reviews/can-review/:productId
  @UseGuards(JwtAuthGuard)
  @Get('can-review/:productId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Kiem tra user co the danh gia san pham khong' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Ket qua kiem tra' })
  async canReview(@Request() req: any, @Param('productId') productId: string) {
    return this.reviewsService.canReview(req.user._id || req.user.sub, productId);
  }

  // POST /reviews
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tao danh gia moi (phai co don hang da giao)' })
  @ApiResponse({ status: 201, description: 'Danh gia da duoc tao' })
  @ApiResponse({ status: 400, description: 'Don hang chua giao hoac da danh gia truoc do' })
  async create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user._id || req.user.sub, dto);
  }

  // PATCH /reviews/:id
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cap nhat danh gia (chi khi con pending, chi owner)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Danh gia da duoc cap nhat' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, req.user._id || req.user.sub, dto);
  }

  // DELETE /reviews/:id
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xoa mem danh gia cua minh' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Da xoa danh gia' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.delete(id, req.user._id || req.user.sub);
  }

  // POST /reviews/:id/helpful
  @UseGuards(JwtAuthGuard)
  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Vote huu ich/khong huu ich cho danh gia' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Vote da duoc ghi nhan' })
  async voteHelpful(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: VoteHelpfulDto,
  ) {
    return this.reviewsService.voteHelpful(id, req.user._id || req.user.sub, dto);
  }

  // PATCH /reviews/:id/moderate
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Patch(':id/moderate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Duyet/tu choi/flag danh gia (Admin/Manager/Staff)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Trang thai danh gia da duoc cap nhat' })
  async moderate(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, req.user._id || req.user.sub, dto);
  }
}
