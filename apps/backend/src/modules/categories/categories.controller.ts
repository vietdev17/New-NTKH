import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
}

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ============================================================
  // PUBLIC ENDPOINTS
  // Note: Specific named routes MUST be declared before :slug param routes
  // ============================================================

  /**
   * GET /categories
   * Lay danh sach tat ca danh muc (flat list)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lay danh sach tat ca danh muc (flat list)' })
  @ApiResponse({ status: 200, description: 'Danh sach danh muc' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * GET /categories/tree
   * Lay cau truc cay danh muc (nested tree)
   */
  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Lay cau truc cay danh muc (nested tree)' })
  @ApiResponse({ status: 200, description: 'Cay danh muc long nhau' })
  async findTree() {
    return this.categoriesService.findTree();
  }

  /**
   * GET /categories/combos
   * Lay cac danh muc combo (isCombo = true)
   */
  @Public()
  @Get('combos')
  @ApiOperation({ summary: 'Lay cac danh muc combo (isCombo = true)' })
  @ApiResponse({ status: 200, description: 'Danh sach danh muc combo' })
  async getCombos() {
    return this.categoriesService.getCombos();
  }

  /**
   * POST /categories/reorder
   * Sap xep lai thu tu cac danh muc (admin)
   * PHAI dat truoc route :slug de tranh conflict voi GET /:slug
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sap xep lai thu tu cac danh muc (admin)' })
  async reorder(@Body() dto: ReorderDto) {
    return this.categoriesService.reorder(dto);
  }

  /**
   * GET /categories/:slug
   * Lay chi tiet danh muc theo slug (kem danh muc con)
   */
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Lay chi tiet danh muc theo slug (kem danh muc con)' })
  @ApiParam({ name: 'slug', description: 'Slug cua danh muc' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  /**
   * POST /categories
   * Tao danh muc moi (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tao danh muc moi (admin)' })
  @ApiResponse({ status: 201, description: 'Danh muc duoc tao thanh cong' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /**
   * PATCH /categories/:id
   * Cap nhat danh muc (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat danh muc (admin)' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua danh muc' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  /**
   * DELETE /categories/:id
   * Xoa danh muc (admin) - kiem tra khong co san pham/danh muc con
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoa danh muc (admin) - kiem tra truoc khi xoa' })
  @ApiParam({ name: 'id', description: 'MongoDB ID cua danh muc' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
