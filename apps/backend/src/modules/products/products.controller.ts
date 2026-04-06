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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateColorDto, CreateDimensionDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StockUpdateDto } from './dto/stock-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ComparisonService } from './comparison.service';
import { CompareProductsDto } from './dto/compare-products.dto';

enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly comparisonService: ComparisonService,
  ) {}

  // ============================================================
  // PUBLIC ENDPOINTS
  // Note: Specific routes MUST be declared before :slug param routes
  // ============================================================

  /**
   * GET /products
   * Lay danh sach san pham voi bo loc va phan trang
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lay danh sach san pham (filter, pagination, sort)' })
  @ApiResponse({ status: 200, description: 'Tra ve danh sach san pham co phan trang' })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  /**
   * GET /products/search?q=sofa&page=1&limit=20
   * Tim kiem full-text san pham
   */
  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Tim kiem full-text san pham' })
  @ApiQuery({ name: 'q', description: 'Tu khoa tim kiem', required: true })
  @ApiQuery({ name: 'page', description: 'So trang', required: false })
  @ApiQuery({ name: 'limit', description: 'So luong tren trang', required: false })
  async search(
    @Query('q') keyword: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.search(keyword, page || 1, limit || 20);
  }

  /**
   * GET /products/autocomplete?q=sof
   * Goi y nhanh khi go tim kiem (tra ve ten + slug)
   */
  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Goi y nhanh khi go tim kiem' })
  @ApiQuery({ name: 'q', description: 'Tu khoa (toi thieu 2 ky tu)', required: true })
  async autocomplete(@Query('q') keyword: string) {
    return this.productsService.getAutoComplete(keyword);
  }

  /**
   * GET /products/best-sellers?limit=10
   * Lay san pham ban chay nhat
   */
  @Public()
  @Get('best-sellers')
  @ApiOperation({ summary: 'Lay san pham ban chay nhat' })
  @ApiQuery({ name: 'limit', description: 'So luong san pham tra ve', required: false })
  async getBestSellers(@Query('limit') limit?: number) {
    return this.productsService.getBestSellers(limit || 10);
  }

  /**
   * GET /products/new-arrivals?limit=10
   * Lay san pham moi nhat
   */
  @Public()
  @Get('new-arrivals')
  @ApiOperation({ summary: 'Lay san pham moi nhat' })
  @ApiQuery({ name: 'limit', description: 'So luong san pham tra ve', required: false })
  async getNewArrivals(@Query('limit') limit?: number) {
    return this.productsService.getNewArrivals(limit || 10);
  }

  /**
   * GET /products/low-stock
   * Lay danh sach san pham sap het hang (admin)
   * PHAI dat truoc route :slug de tranh conflict
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('low-stock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lay san pham sap het hang (admin)' })
  @ApiResponse({ status: 200, description: 'Danh sach san pham co ton kho thap' })
  async getLowStock() {
    return this.productsService.getLowStockProducts();
  }

  /**
   * GET /products/:slug
   * Lay chi tiet san pham theo slug (public)
   */
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Lay chi tiet san pham theo slug' })
  @ApiParam({ name: 'slug', description: 'Slug cua san pham' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  /**
   * POST /products
   * Tao san pham moi (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao san pham moi (admin)' })
  @ApiResponse({ status: 201, description: 'San pham duoc tao thanh cong' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * PATCH /products/:id
   * Cap nhat san pham (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat san pham (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua san pham' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  /**
   * DELETE /products/:id
   * Xoa mem san pham (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoa mem san pham (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua san pham' })
  async delete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  /**
   * POST /products/:id/colors
   * Them mau sac moi cho san pham (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/colors')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Them mau sac moi cho san pham (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua san pham' })
  async addColor(
    @Param('id') id: string,
    @Body() dto: CreateColorDto,
  ) {
    return this.productsService.addColor(id, dto);
  }

  /**
   * POST /products/:id/dimensions
   * Them kich thuoc moi cho san pham (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/dimensions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Them kich thuoc moi cho san pham (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua san pham' })
  async addDimension(
    @Param('id') id: string,
    @Body() dto: CreateDimensionDto,
  ) {
    return this.productsService.addDimension(id, dto);
  }

  /**
   * POST /products/:id/regenerate-variants
   * Tao lai tat ca variants tu colors x dimensions (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/regenerate-variants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao lai tat ca variants tu colors x dimensions (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua san pham' })
  async regenerateVariants(@Param('id') id: string) {
    return this.productsService.regenerateVariants(id);
  }

  /**
   * PATCH /products/:id/stock
   * Cap nhat ton kho cho variant (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Patch(':id/stock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat ton kho cho variant (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua san pham (khong su dung, dung variantSku trong body)' })
  async updateStock(@Body() dto: StockUpdateDto) {
    return this.productsService.updateStock(dto);
  }

  // ===== SO SANH SAN PHAM =====
  @Public()
  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'So sanh 2-4 san pham' })
  async compare(@Body() dto: CompareProductsDto) {
    return this.comparisonService.compare(dto.productIds);
  }
}
