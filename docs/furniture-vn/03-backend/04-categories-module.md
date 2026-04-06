# CATEGORIES MODULE

> Module quan ly danh muc san pham - ho tro cau truc cay (tree) cha-con.
> Danh muc noi that Viet Nam: Phong khach, Phong ngu, Phong an, Van phong, Phong bep, Trang tri.
> File goc: `apps/api/src/modules/categories/`

---

## Muc luc

1. [Cau truc module](#1-cau-truc-module)
2. [DTOs](#2-dtos)
3. [CategoriesService](#3-categoriesservice)
4. [CategoriesController](#4-categoriescontroller)
5. [Bang API Endpoints](#5-bang-api-endpoints)
6. [Seed Data](#6-seed-data)
7. [Vi du Request/Response](#7-vi-du-requestresponse)

---

## 1. Cau truc module

```
apps/api/src/modules/categories/
├── categories.module.ts
├── categories.service.ts
├── categories.controller.ts
├── dto/
│   ├── create-category.dto.ts
│   ├── update-category.dto.ts
│   └── reorder.dto.ts
└── interfaces/
    └── category-tree.interface.ts
```

### Module Registration

```typescript
// categories.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
```

### CategoryTree Interface

```typescript
// interfaces/category-tree.interface.ts
import { CategoryDocument } from '../../../schemas/category.schema';

export interface CategoryTreeNode {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isCombo: boolean;
  tags: string[];
  children: CategoryTreeNode[];
  productCount?: number;
}
```

---

## 2. DTOs

### CreateCategoryDto

```typescript
// dto/create-category.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isCombo?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
```

### UpdateCategoryDto

```typescript
// dto/update-category.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

### ReorderDto

```typescript
// dto/reorder.dto.ts
import { IsArray, ValidateNested, IsMongoId, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderItemDto {
  @IsMongoId()
  id: string;

  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
```

---

## 3. CategoriesService

```typescript
// categories.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderDto } from './dto/reorder.dto';
import { CategoryTreeNode } from './interfaces/category-tree.interface';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // ============================================================
  // CREATE - Tao danh muc moi
  // ============================================================
  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    // 1. Tao slug tu ten
    let slug = slugify(dto.name, { lower: true, strict: true, locale: 'vi' });

    // 2. Kiem tra slug trung
    slug = await this.ensureUniqueSlug(slug);

    // 3. Kiem tra parentId ton tai (neu co)
    if (dto.parentId) {
      const parent = await this.categoryModel.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          `Danh muc cha voi ID "${dto.parentId}" khong ton tai`,
        );
      }
    }

    // 4. Tao danh muc
    const category = new this.categoryModel({
      ...dto,
      slug,
    });

    return category.save();
  }

  // ============================================================
  // FIND ALL - Lay danh sach phang (flat list)
  // ============================================================
  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .lean() as any;
  }

  // ============================================================
  // FIND TREE - Lay cau truc cay (nested)
  // ============================================================
  async findTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return this.buildTree(allCategories as any[], null);
  }

  // ============================================================
  // FIND BY SLUG - Lay danh muc theo slug (kem children)
  // ============================================================
  async findBySlug(slug: string): Promise<{
    category: CategoryDocument;
    children: CategoryDocument[];
  }> {
    const category = await this.categoryModel
      .findOne({ slug })
      .lean();

    if (!category) {
      throw new NotFoundException(`Danh muc voi slug "${slug}" khong ton tai`);
    }

    // Lay cac danh muc con truc tiep
    const children = await this.categoryModel
      .find({ parentId: category._id, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return {
      category: category as CategoryDocument,
      children: children as CategoryDocument[],
    };
  }

  // ============================================================
  // FIND BY ID
  // ============================================================
  async findById(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID danh muc khong hop le');
    }

    const category = await this.categoryModel.findById(id).lean();

    if (!category) {
      throw new NotFoundException(`Danh muc voi ID "${id}" khong ton tai`);
    }

    return category as CategoryDocument;
  }

  // ============================================================
  // UPDATE - Cap nhat danh muc
  // ============================================================
  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(`Danh muc voi ID "${id}" khong ton tai`);
    }

    // Neu doi ten -> tao slug moi
    if (dto.name && dto.name !== category.name) {
      let newSlug = slugify(dto.name, {
        lower: true,
        strict: true,
        locale: 'vi',
      });
      newSlug = await this.ensureUniqueSlug(newSlug, id);
      category.slug = newSlug;
    }

    // Kiem tra parentId (neu co) - khong cho phep tro ve chinh no
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Danh muc khong the la cha cua chinh no',
        );
      }

      const parent = await this.categoryModel.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(
          `Danh muc cha voi ID "${dto.parentId}" khong ton tai`,
        );
      }

      // Kiem tra vong lap: parentId khong duoc la con/chau cua danh muc hien tai
      const isDescendant = await this.isDescendantOf(dto.parentId, id);
      if (isDescendant) {
        throw new BadRequestException(
          'Khong the dat danh muc cha la con/chau cua danh muc nay (vong lap)',
        );
      }
    }

    // Cap nhat cac truong
    const fields = [
      'name', 'description', 'image', 'parentId',
      'sortOrder', 'isActive', 'isCombo', 'tags',
    ];

    for (const field of fields) {
      if (dto[field] !== undefined) {
        category[field] = dto[field];
      }
    }

    return category.save();
  }

  // ============================================================
  // DELETE - Xoa danh muc (kiem tra khong co san pham tham chieu)
  // ============================================================
  async delete(id: string): Promise<{ message: string }> {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(`Danh muc voi ID "${id}" khong ton tai`);
    }

    // Kiem tra co san pham nao thuoc danh muc nay khong
    const productCount = await this.productModel.countDocuments({
      categoryId: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Khong the xoa danh muc "${category.name}" vi con ${productCount} san pham thuoc danh muc nay. `
        + `Vui long chuyen san pham sang danh muc khac truoc khi xoa.`,
      );
    }

    // Kiem tra co danh muc con khong
    const childCount = await this.categoryModel.countDocuments({
      parentId: new Types.ObjectId(id),
    });

    if (childCount > 0) {
      throw new BadRequestException(
        `Khong the xoa danh muc "${category.name}" vi con ${childCount} danh muc con. `
        + `Vui long xoa hoac chuyen danh muc con truoc.`,
      );
    }

    await this.categoryModel.deleteOne({ _id: id });

    return { message: `Da xoa danh muc "${category.name}"` };
  }

  // ============================================================
  // GET COMBOS - Lay cac danh muc combo (isCombo = true)
  // ============================================================
  async getCombos(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ isCombo: true, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean() as any;
  }

  // ============================================================
  // REORDER - Sap xep lai thu tu danh muc
  // ============================================================
  async reorder(dto: ReorderDto): Promise<{ message: string }> {
    const bulkOps = dto.items.map((item) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.id) },
        update: { $set: { sortOrder: item.sortOrder } },
      },
    }));

    await this.categoryModel.bulkWrite(bulkOps);

    return {
      message: `Da cap nhat thu tu cho ${dto.items.length} danh muc`,
    };
  }

  // ============================================================
  // GET PRODUCT COUNT - Dem so san pham trong danh muc
  // ============================================================
  async getProductCount(categoryId: string): Promise<number> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('ID danh muc khong hop le');
    }

    return this.productModel.countDocuments({
      categoryId: new Types.ObjectId(categoryId),
      isDeleted: false,
    });
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Xay dung cay danh muc tu danh sach phang (recursive).
   *
   * Thuat toan:
   *   1. Loc cac danh muc co parentId === parentId (tham so)
   *   2. Voi moi danh muc tim duoc, goi de quy voi _id cua no lam parentId moi
   *   3. Gan ket qua de quy vao truong `children`
   *   4. Dieu kien dung: khong con danh muc con nao -> children = []
   *
   * Do phuc tap: O(n^2) trong truong hop xau nhat
   * Phu hop cho so luong danh muc < 500 (thuong chi ~50-100 cho noi that)
   */
  private buildTree(
    categories: any[],
    parentId: string | null,
  ): CategoryTreeNode[] {
    const tree: CategoryTreeNode[] = [];

    for (const cat of categories) {
      const catParentId = cat.parentId ? cat.parentId.toString() : null;

      if (catParentId === parentId) {
        const node: CategoryTreeNode = {
          _id: cat._id.toString(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          image: cat.image || null,
          parentId: catParentId,
          sortOrder: cat.sortOrder || 0,
          isActive: cat.isActive,
          isCombo: cat.isCombo || false,
          tags: cat.tags || [],
          children: this.buildTree(categories, cat._id.toString()),
        };

        tree.push(node);
      }
    }

    // Sap xep theo sortOrder
    tree.sort((a, b) => a.sortOrder - b.sortOrder);

    return tree;
  }

  /**
   * Kiem tra xem categoryId co phai la con/chau cua ancestorId khong.
   * Dung de chong vong lap khi cap nhat parentId.
   */
  private async isDescendantOf(
    categoryId: string,
    ancestorId: string,
  ): Promise<boolean> {
    let currentId = categoryId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) return false; // Tranh vong lap vo han
      visited.add(currentId);

      const category = await this.categoryModel
        .findById(currentId)
        .select('parentId')
        .lean();

      if (!category || !category.parentId) return false;

      const parentIdStr = category.parentId.toString();
      if (parentIdStr === ancestorId) return true;

      currentId = parentIdStr;
    }

    return false;
  }

  /**
   * Dam bao slug la duy nhat
   */
  private async ensureUniqueSlug(
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    let candidate = slug;
    let counter = 0;

    while (true) {
      const filter: any = { slug: candidate };
      if (excludeId) {
        filter._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const exists = await this.categoryModel.exists(filter);
      if (!exists) return candidate;

      counter++;
      candidate = `${slug}-${counter}`;
    }
  }
}
```

---

## 4. CategoriesController

```typescript
// categories.controller.ts
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared-types/enums';
import { Public } from '../auth/decorators/public.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ============================================================
  // PUBLIC ENDPOINTS
  // ============================================================

  /**
   * GET /categories
   * Lay danh sach tat ca danh muc (flat list)
   */
  @Public()
  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * GET /categories/tree
   * Lay cau truc cay danh muc (nested tree)
   */
  @Public()
  @Get('tree')
  async findTree() {
    return this.categoriesService.findTree();
  }

  /**
   * GET /categories/combos
   * Lay cac danh muc combo (isCombo = true)
   */
  @Public()
  @Get('combos')
  async getCombos() {
    return this.categoriesService.getCombos();
  }

  /**
   * GET /categories/:slug
   * Lay chi tiet danh muc theo slug (kem danh muc con)
   */
  @Public()
  @Get(':slug')
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
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }

  /**
   * POST /categories/reorder
   * Sap xep lai thu tu cac danh muc (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('reorder')
  async reorder(@Body() dto: ReorderDto) {
    return this.categoriesService.reorder(dto);
  }
}
```

> **Luu y:** Route `/categories/tree`, `/categories/combos`, `/categories/reorder` phai dat TRUOC route `/categories/:slug` trong controller de tranh NestJS hieu "tree" la gia tri cua param `:slug`.

---

## 5. Bang API Endpoints

| # | Method | Endpoint | Auth | Role | Mo ta |
|---|--------|----------|------|------|-------|
| 1 | `GET` | `/categories` | Public | - | Danh sach tat ca danh muc (flat) |
| 2 | `GET` | `/categories/tree` | Public | - | Cau truc cay danh muc (nested) |
| 3 | `GET` | `/categories/combos` | Public | - | Danh muc combo |
| 4 | `GET` | `/categories/:slug` | Public | - | Chi tiet danh muc + danh muc con |
| 5 | `POST` | `/categories` | JWT | Admin, Manager | Tao danh muc moi |
| 6 | `PATCH` | `/categories/:id` | JWT | Admin, Manager | Cap nhat danh muc |
| 7 | `DELETE` | `/categories/:id` | JWT | Admin | Xoa danh muc |
| 8 | `POST` | `/categories/reorder` | JWT | Admin, Manager | Sap xep lai thu tu |

---

## 6. Seed Data

Du lieu danh muc mac dinh cho he thong noi that Viet Nam:

```typescript
// seeds/categories.seed.ts
import { Connection } from 'mongoose';

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isCombo: boolean;
  children?: Omit<SeedCategory, 'children'>[];
}

const CATEGORY_SEEDS: SeedCategory[] = [
  {
    name: 'Phong khach',
    slug: 'phong-khach',
    description: 'Noi that phong khach - sofa, ban tra, ke tivi, tham trai san',
    sortOrder: 1,
    isCombo: false,
    children: [
      { name: 'Sofa', slug: 'sofa', description: 'Sofa goc, sofa thang, sofa bed', sortOrder: 1, isCombo: false },
      { name: 'Ban tra', slug: 'ban-tra', description: 'Ban tra go, ban tra kinh, ban tra da', sortOrder: 2, isCombo: false },
      { name: 'Ke tivi', slug: 'ke-tivi', description: 'Ke tivi treo tuong, ke tivi dung dat', sortOrder: 3, isCombo: false },
      { name: 'Tu trang tri', slug: 'tu-trang-tri', description: 'Tu trang tri, tu ruou, tu sach phong khach', sortOrder: 4, isCombo: false },
      { name: 'Tham trai san', slug: 'tham-trai-san', description: 'Tham len, tham nhua, tham co nhan tao', sortOrder: 5, isCombo: false },
    ],
  },
  {
    name: 'Phong ngu',
    slug: 'phong-ngu',
    description: 'Noi that phong ngu - giuong, tu quan ao, ban trang diem, tab dau giuong',
    sortOrder: 2,
    isCombo: false,
    children: [
      { name: 'Giuong', slug: 'giuong', description: 'Giuong go, giuong boc da, giuong boc nem', sortOrder: 1, isCombo: false },
      { name: 'Tu quan ao', slug: 'tu-quan-ao', description: 'Tu 2 canh, tu 3 canh, tu am tuong', sortOrder: 2, isCombo: false },
      { name: 'Ban trang diem', slug: 'ban-trang-diem', description: 'Ban trang diem co guong, tab dau giuong', sortOrder: 3, isCombo: false },
      { name: 'Tab dau giuong', slug: 'tab-dau-giuong', description: 'Tab go, tab hien dai, tab tan co dien', sortOrder: 4, isCombo: false },
      { name: 'Nem', slug: 'nem', description: 'Nem lo xo, nem cao su, nem foam', sortOrder: 5, isCombo: false },
    ],
  },
  {
    name: 'Phong an',
    slug: 'phong-an',
    description: 'Noi that phong an - ban an, ghe an, tu bep, tu ruou',
    sortOrder: 3,
    isCombo: false,
    children: [
      { name: 'Ban an', slug: 'ban-an', description: 'Ban an 4 ghe, 6 ghe, 8 ghe, ban an mo rong', sortOrder: 1, isCombo: false },
      { name: 'Ghe an', slug: 'ghe-an', description: 'Ghe go, ghe boc nem, ghe xoay', sortOrder: 2, isCombo: false },
      { name: 'Tu ruou', slug: 'tu-ruou', description: 'Tu ruou go, tu ruou kinh, ke ruou treo tuong', sortOrder: 3, isCombo: false },
      { name: 'Tu chen', slug: 'tu-chen', description: 'Tu chen bat, tu bep, ke bep', sortOrder: 4, isCombo: false },
    ],
  },
  {
    name: 'Van phong',
    slug: 'van-phong',
    description: 'Noi that van phong - ban lam viec, ghe van phong, tu ho so',
    sortOrder: 4,
    isCombo: false,
    children: [
      { name: 'Ban lam viec', slug: 'ban-lam-viec', description: 'Ban chu L, ban thang, ban nang ha', sortOrder: 1, isCombo: false },
      { name: 'Ghe van phong', slug: 'ghe-van-phong', description: 'Ghe cong thai hoc, ghe luoi, ghe giam doc', sortOrder: 2, isCombo: false },
      { name: 'Tu ho so', slug: 'tu-ho-so', description: 'Tu sat, tu go, ke ho so', sortOrder: 3, isCombo: false },
      { name: 'Ke sach', slug: 'ke-sach', description: 'Ke sach go, ke sach sat, ke trang tri', sortOrder: 4, isCombo: false },
    ],
  },
  {
    name: 'Phong bep',
    slug: 'phong-bep',
    description: 'Noi that nha bep - tu bep, ke bep, phu kien bep',
    sortOrder: 5,
    isCombo: false,
    children: [
      { name: 'Tu bep', slug: 'tu-bep', description: 'Tu bep tren, tu bep duoi, tu bep chu L, chu U', sortOrder: 1, isCombo: false },
      { name: 'Ke bep', slug: 'ke-bep', description: 'Ke gia vi, ke chen bat, ke da nang', sortOrder: 2, isCombo: false },
      { name: 'Dao bep', slug: 'dao-bep', description: 'Dao bep, ban che bien, xe day bep', sortOrder: 3, isCombo: false },
    ],
  },
  {
    name: 'Trang tri',
    slug: 'trang-tri',
    description: 'Do trang tri noi that - den, guong, tranh, binh hoa',
    sortOrder: 6,
    isCombo: false,
    children: [
      { name: 'Den trang tri', slug: 'den-trang-tri', description: 'Den ban, den san, den tha, den tuong', sortOrder: 1, isCombo: false },
      { name: 'Guong', slug: 'guong', description: 'Guong tron, guong chu nhat, guong trang diem', sortOrder: 2, isCombo: false },
      { name: 'Tranh treo tuong', slug: 'tranh-treo-tuong', description: 'Tranh canvas, tranh kim loai, tranh go', sortOrder: 3, isCombo: false },
      { name: 'Binh hoa', slug: 'binh-hoa', description: 'Binh hoa su, binh hoa thuy tinh, binh hoa go', sortOrder: 4, isCombo: false },
    ],
  },
  // ----- COMBO CATEGORIES -----
  {
    name: 'Combo Phong khach',
    slug: 'combo-phong-khach',
    description: 'Bo noi that phong khach tron goi: sofa + ban tra + ke tivi',
    sortOrder: 10,
    isCombo: true,
  },
  {
    name: 'Combo Phong ngu',
    slug: 'combo-phong-ngu',
    description: 'Bo noi that phong ngu tron goi: giuong + tu + ban trang diem',
    sortOrder: 11,
    isCombo: true,
  },
  {
    name: 'Combo Phong an',
    slug: 'combo-phong-an',
    description: 'Bo ban an tron goi: ban + ghe',
    sortOrder: 12,
    isCombo: true,
  },
];

/**
 * Seed danh muc vao database.
 * Goi ham nay trong app bootstrap hoac script rieng.
 */
export async function seedCategories(connection: Connection): Promise<void> {
  const CategoryModel = connection.model('Category');
  const count = await CategoryModel.countDocuments();

  if (count > 0) {
    console.log('[Seed] Da co danh muc trong DB, bo qua seed.');
    return;
  }

  console.log('[Seed] Bat dau seed danh muc noi that...');

  for (const seed of CATEGORY_SEEDS) {
    const parent = await CategoryModel.create({
      name: seed.name,
      slug: seed.slug,
      description: seed.description,
      sortOrder: seed.sortOrder,
      isCombo: seed.isCombo,
      isActive: true,
    });

    if (seed.children && seed.children.length > 0) {
      for (const child of seed.children) {
        await CategoryModel.create({
          name: child.name,
          slug: child.slug,
          description: child.description,
          parentId: parent._id,
          sortOrder: child.sortOrder,
          isCombo: child.isCombo,
          isActive: true,
        });
      }
    }

    console.log(`[Seed] Da tao danh muc: ${seed.name} (${seed.children?.length || 0} con)`);
  }

  console.log('[Seed] Hoan tat seed danh muc!');
}
```

---

## 7. Vi du Request/Response

### 7.1. Tao danh muc moi

**Request:**

```http
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Phong tam",
  "description": "Noi that phong tam - tu lavabo, ke phong tam, guong phong tam",
  "sortOrder": 7,
  "isCombo": false,
  "tags": ["phong-tam", "bathroom"]
}
```

**Response (201 Created):**

```json
{
  "_id": "665d4e5f6a7b8c9d0e1f2a34",
  "name": "Phong tam",
  "slug": "phong-tam",
  "description": "Noi that phong tam - tu lavabo, ke phong tam, guong phong tam",
  "image": null,
  "parentId": null,
  "sortOrder": 7,
  "isActive": true,
  "isCombo": false,
  "tags": ["phong-tam", "bathroom"],
  "createdAt": "2026-04-02T09:00:00.000Z",
  "updatedAt": "2026-04-02T09:00:00.000Z"
}
```

---

### 7.2. Tao danh muc con

**Request:**

```http
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Tu lavabo",
  "description": "Tu lavabo go, tu lavabo nhua, tu lavabo treo tuong",
  "parentId": "665d4e5f6a7b8c9d0e1f2a34",
  "sortOrder": 1
}
```

**Response (201 Created):**

```json
{
  "_id": "665d5f6a7b8c9d0e1f2a3b45",
  "name": "Tu lavabo",
  "slug": "tu-lavabo",
  "description": "Tu lavabo go, tu lavabo nhua, tu lavabo treo tuong",
  "image": null,
  "parentId": "665d4e5f6a7b8c9d0e1f2a34",
  "sortOrder": 1,
  "isActive": true,
  "isCombo": false,
  "tags": [],
  "createdAt": "2026-04-02T09:01:00.000Z",
  "updatedAt": "2026-04-02T09:01:00.000Z"
}
```

---

### 7.3. Lay cau truc cay danh muc

**Request:**

```http
GET /categories/tree
```

**Response (200 OK):**

```json
[
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d01",
    "name": "Phong khach",
    "slug": "phong-khach",
    "description": "Noi that phong khach",
    "sortOrder": 1,
    "isActive": true,
    "isCombo": false,
    "children": [
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d10",
        "name": "Sofa",
        "slug": "sofa",
        "sortOrder": 1,
        "isActive": true,
        "children": []
      },
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d11",
        "name": "Ban tra",
        "slug": "ban-tra",
        "sortOrder": 2,
        "isActive": true,
        "children": []
      },
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d12",
        "name": "Ke tivi",
        "slug": "ke-tivi",
        "sortOrder": 3,
        "isActive": true,
        "children": []
      }
    ]
  },
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d02",
    "name": "Phong ngu",
    "slug": "phong-ngu",
    "sortOrder": 2,
    "isActive": true,
    "children": [
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d20",
        "name": "Giuong",
        "slug": "giuong",
        "sortOrder": 1,
        "children": []
      },
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d21",
        "name": "Tu quan ao",
        "slug": "tu-quan-ao",
        "sortOrder": 2,
        "children": []
      }
    ]
  },
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d06",
    "name": "Combo Phong khach",
    "slug": "combo-phong-khach",
    "sortOrder": 10,
    "isCombo": true,
    "children": []
  }
]
```

---

### 7.4. Lay chi tiet danh muc theo slug

**Request:**

```http
GET /categories/phong-khach
```

**Response (200 OK):**

```json
{
  "category": {
    "_id": "665a1b2c3d4e5f6a7b8c9d01",
    "name": "Phong khach",
    "slug": "phong-khach",
    "description": "Noi that phong khach - sofa, ban tra, ke tivi, tham trai san",
    "image": "https://drive.google.com/file/d/phongkhach/view",
    "parentId": null,
    "sortOrder": 1,
    "isActive": true,
    "isCombo": false,
    "tags": []
  },
  "children": [
    { "_id": "665a1b2c3d4e5f6a7b8c9d10", "name": "Sofa", "slug": "sofa", "sortOrder": 1 },
    { "_id": "665a1b2c3d4e5f6a7b8c9d11", "name": "Ban tra", "slug": "ban-tra", "sortOrder": 2 },
    { "_id": "665a1b2c3d4e5f6a7b8c9d12", "name": "Ke tivi", "slug": "ke-tivi", "sortOrder": 3 },
    { "_id": "665a1b2c3d4e5f6a7b8c9d13", "name": "Tu trang tri", "slug": "tu-trang-tri", "sortOrder": 4 },
    { "_id": "665a1b2c3d4e5f6a7b8c9d14", "name": "Tham trai san", "slug": "tham-trai-san", "sortOrder": 5 }
  ]
}
```

---

### 7.5. Sap xep lai danh muc

**Request:**

```http
POST /categories/reorder
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "items": [
    { "id": "665a1b2c3d4e5f6a7b8c9d01", "sortOrder": 2 },
    { "id": "665a1b2c3d4e5f6a7b8c9d02", "sortOrder": 1 },
    { "id": "665a1b2c3d4e5f6a7b8c9d03", "sortOrder": 3 }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Da cap nhat thu tu cho 3 danh muc"
}
```

---

### 7.6. Xoa danh muc (that bai - con san pham)

**Request:**

```http
DELETE /categories/665a1b2c3d4e5f6a7b8c9d10
Authorization: Bearer <admin_token>
```

**Response (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": "Khong the xoa danh muc \"Sofa\" vi con 24 san pham thuoc danh muc nay. Vui long chuyen san pham sang danh muc khac truoc khi xoa.",
  "error": "Bad Request"
}
```

---

### 7.7. Xoa danh muc (that bai - con danh muc con)

**Request:**

```http
DELETE /categories/665a1b2c3d4e5f6a7b8c9d01
Authorization: Bearer <admin_token>
```

**Response (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": "Khong the xoa danh muc \"Phong khach\" vi con 5 danh muc con. Vui long xoa hoac chuyen danh muc con truoc.",
  "error": "Bad Request"
}
```

---

### 7.8. Lay danh muc combo

**Request:**

```http
GET /categories/combos
```

**Response (200 OK):**

```json
[
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d06",
    "name": "Combo Phong khach",
    "slug": "combo-phong-khach",
    "description": "Bo noi that phong khach tron goi: sofa + ban tra + ke tivi",
    "sortOrder": 10,
    "isCombo": true
  },
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d07",
    "name": "Combo Phong ngu",
    "slug": "combo-phong-ngu",
    "description": "Bo noi that phong ngu tron goi: giuong + tu + ban trang diem",
    "sortOrder": 11,
    "isCombo": true
  },
  {
    "_id": "665a1b2c3d4e5f6a7b8c9d08",
    "name": "Combo Phong an",
    "slug": "combo-phong-an",
    "description": "Bo ban an tron goi: ban + ghe",
    "sortOrder": 12,
    "isCombo": true
  }
]
```

---

> **Tong ket:**
> - Categories module ho tro cau truc cay (parent-child) voi recursive tree building
> - Kiem tra rang buoc truoc khi xoa: khong co san pham va khong co danh muc con
> - Chong vong lap khi cap nhat parentId
> - Seed data bao gom 6 danh muc chinh + 25 danh muc con + 3 danh muc combo
> - Slug tu dong tao tu ten, dam bao duy nhat
