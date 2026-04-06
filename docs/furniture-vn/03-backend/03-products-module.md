# PRODUCTS MODULE

> Module quan ly san pham - phuc tap nhat trong he thong.
> Ho tro bien the (variants) theo mau sac x kich thuoc, quan ly ton kho, tim kiem full-text.
> File goc: `apps/api/src/modules/products/`

---

## Muc luc

1. [Cau truc module](#1-cau-truc-module)
2. [DTOs](#2-dtos)
3. [ProductsService](#3-productsservice)
4. [ProductsController](#4-productscontroller)
5. [Bang API Endpoints](#5-bang-api-endpoints)
6. [Vi du Request/Response](#6-vi-du-requestresponse)

---

## 1. Cau truc module

```
apps/api/src/modules/products/
├── products.module.ts
├── products.service.ts
├── products.controller.ts
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── query-product.dto.ts
│   ├── stock-update.dto.ts
│   ├── add-color.dto.ts
│   └── add-dimension.dto.ts
├── interfaces/
│   └── stock-item.interface.ts
└── helpers/
    ├── slug.helper.ts
    └── sku.helper.ts
```

### Module Registration

```typescript
// products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

---

## 2. DTOs

### CreateProductDto

```typescript
// dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsMongoId,
  Min,
  MaxLength,
  IsBoolean,
  Matches,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@shared-types/enums';

// ----- Sub DTO: Color -----
export class CreateColorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'hexCode phai co dang #RRGGBB' })
  hexCode: string;

  @IsString()
  @IsOptional()
  colorFamily?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  priceModifier?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  available?: boolean;
}

// ----- Sub DTO: Dimension -----
export class CreateDimensionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Min(0)
  width: number;

  @IsNumber()
  @Min(0)
  depth: number;

  @IsNumber()
  @Min(0)
  height: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  priceModifier?: number;

  @IsBoolean()
  @IsOptional()
  available?: boolean;
}

// ----- Sub DTO: SeoMeta -----
export class SeoMetaDto {
  @IsString()
  @IsOptional()
  @MaxLength(70)
  metaTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metaKeywords?: string[];
}

// ----- Main DTO -----
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  shortDescription?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  categoryId: string;

  @IsMongoId()
  @IsOptional()
  comboCategoryId?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateColorDto)
  @IsOptional()
  colors?: CreateColorDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDimensionDto)
  @IsOptional()
  dimensions?: CreateDimensionDto[];

  @IsObject()
  @IsOptional()
  specifications?: Record<string, string>;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ValidateNested()
  @Type(() => SeoMetaDto)
  @IsOptional()
  seo?: SeoMetaDto;
}
```

### UpdateProductDto

```typescript
// dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### QueryProductDto

```typescript
// dto/query-product.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@shared-types/enums';

export class QueryProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  sort?: string; // 'price_asc' | 'price_desc' | 'newest' | 'best_seller' | 'name_asc'

  @IsOptional()
  @IsString()
  tag?: string;
}
```

### StockUpdateDto

```typescript
// dto/stock-update.dto.ts
import { IsString, IsNumber, IsEnum, Min } from 'class-validator';

export enum StockOperation {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
}

export class StockUpdateDto {
  @IsString()
  variantSku: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(StockOperation)
  operation: StockOperation;
}
```

### AddColorDto / AddDimensionDto

```typescript
// dto/add-color.dto.ts
// (Trung voi CreateColorDto o tren, re-export)
export { CreateColorDto as AddColorDto } from './create-product.dto';

// dto/add-dimension.dto.ts
export { CreateDimensionDto as AddDimensionDto } from './create-product.dto';
```

### StockItem Interface

```typescript
// interfaces/stock-item.interface.ts
export interface StockItem {
  variantSku: string;
  quantity: number;
}
```

---

## 3. ProductsService

### Helper: Slug Generation

```typescript
// helpers/slug.helper.ts
import slugify from 'slugify';

/**
 * Tao slug tu ten san pham.
 * Luat:
 *   1. Chuyen ve lowercase, bo dau tieng Viet
 *   2. Thay khoang trang bang dau gach ngang
 *   3. Kiem tra trung trong DB, neu trung thi them -1, -2, ...
 */
export function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: 'vi',
  });
}
```

### Helper: SKU Generation

```typescript
// helpers/sku.helper.ts
import { randomBytes } from 'crypto';

/**
 * CATEGORY_PREFIX_MAP: Map tu slug category sang prefix 2-3 ky tu.
 * Vi du: 'sofa' -> 'SF', 'ban-an' -> 'BA', 'giuong' -> 'GI'
 */
const CATEGORY_PREFIX_MAP: Record<string, string> = {
  'sofa': 'SF',
  'ban-an': 'BA',
  'ban-lam-viec': 'BLV',
  'giuong': 'GI',
  'tu-quan-ao': 'TQA',
  'ke-sach': 'KS',
  'ghe': 'GH',
  'ban-tra': 'BT',
  'tu-giay': 'TG',
  'den': 'DN',
  'guong': 'GU',
  'tham': 'TH',
};

/**
 * Tao SKU cho variant.
 * Format: {CATEGORY_PREFIX}-{COLOR_ID}-{DIM_ID}-{RANDOM_4_CHAR}
 * Vi du: SF-RED01-L-A3F2
 *
 * @param categorySlug - Slug cua danh muc san pham
 * @param colorId      - ID cua mau sac
 * @param dimensionId  - ID cua kich thuoc
 */
export function generateSku(
  categorySlug: string,
  colorId: string,
  dimensionId: string,
): string {
  const prefix = CATEGORY_PREFIX_MAP[categorySlug] || categorySlug.substring(0, 3).toUpperCase();
  const random = randomBytes(2).toString('hex').toUpperCase(); // 4 ky tu hex
  return `${prefix}-${colorId.toUpperCase()}-${dimensionId.toUpperCase()}-${random}`;
}
```

### ProductsService (Day du)

```typescript
// products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, FilterQuery } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StockUpdateDto, StockOperation } from './dto/stock-update.dto';
import { CreateColorDto } from './dto/create-product.dto';
import { CreateDimensionDto } from './dto/create-product.dto';
import { StockItem } from './interfaces/stock-item.interface';
import { ProductStatus } from '@shared-types/enums';
import { generateSlug } from './helpers/slug.helper';
import { generateSku } from './helpers/sku.helper';
import { PAGINATION, INVENTORY } from '@shared-types/constants';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  // ============================================================
  // CREATE - Tao san pham moi
  // ============================================================
  async create(dto: CreateProductDto): Promise<ProductDocument> {
    // 1. Kiem tra category ton tai
    const category = await this.categoryModel.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundException(`Danh muc voi ID "${dto.categoryId}" khong ton tai`);
    }

    // 2. Tao slug va kiem tra trung
    let slug = generateSlug(dto.name);
    slug = await this.ensureUniqueSlug(slug);

    // 3. Gan ID cho colors va dimensions
    const colors = (dto.colors || []).map((c, i) => ({
      ...c,
      id: `C${String(i + 1).padStart(2, '0')}`, // C01, C02, ...
      priceModifier: c.priceModifier || 0,
      images: c.images || [],
      available: c.available !== false,
    }));

    const dimensions = (dto.dimensions || []).map((d, i) => ({
      ...d,
      id: `D${String(i + 1).padStart(2, '0')}`, // D01, D02, ...
      weight: d.weight || 0,
      priceModifier: d.priceModifier || 0,
      available: d.available !== false,
    }));

    // 4. Tao variants matrix: color x dimension
    const variants = this.buildVariantsMatrix(
      colors,
      dimensions,
      dto.basePrice,
      category.slug,
    );

    // 5. Tao product
    const product = new this.productModel({
      ...dto,
      slug,
      colors,
      dimensions,
      variants,
    });

    return product.save();
  }

  // ============================================================
  // FIND ALL - Danh sach san pham voi pagination + filter
  // ============================================================
  async findAll(query: QueryProductDto): Promise<{
    items: ProductDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      categoryId,
      status,
      minPrice,
      maxPrice,
      brand,
      material,
      sort,
      tag,
    } = query;

    // Build filter
    const filter: FilterQuery<Product> = { isDeleted: false };

    if (categoryId) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }
    if (status) {
      filter.status = status;
    } else {
      // Mac dinh chi lay san pham active cho public
      filter.status = ProductStatus.ACTIVE;
    }
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }
    if (material) {
      filter.material = { $regex: material, $options: 'i' };
    }
    if (tag) {
      filter.tags = tag;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {};
      if (minPrice !== undefined) filter.basePrice.$gte = minPrice;
      if (maxPrice !== undefined) filter.basePrice.$lte = maxPrice;
    }

    // Build sort
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortObj = { basePrice: 1 };
        break;
      case 'price_desc':
        sortObj = { basePrice: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'best_seller':
        sortObj = { totalSold: -1 };
        break;
      case 'name_asc':
        sortObj = { name: 1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items: items as ProductDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================
  // FIND BY SLUG - Chi tiet san pham (public)
  // ============================================================
  async findBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ slug, isDeleted: false })
      .populate('categoryId', 'name slug image')
      .lean();

    if (!product) {
      throw new NotFoundException(`San pham voi slug "${slug}" khong ton tai`);
    }

    // Tang view count (fire-and-forget)
    this.productModel
      .updateOne({ _id: product._id }, { $inc: { viewCount: 1 } })
      .exec();

    return product as ProductDocument;
  }

  // ============================================================
  // FIND BY ID
  // ============================================================
  async findById(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID san pham khong hop le');
    }

    const product = await this.productModel
      .findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name slug')
      .lean();

    if (!product) {
      throw new NotFoundException(`San pham voi ID "${id}" khong ton tai`);
    }

    return product as ProductDocument;
  }

  // ============================================================
  // UPDATE - Cap nhat san pham
  // ============================================================
  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException(`San pham voi ID "${id}" khong ton tai`);
    }

    // Neu doi ten -> tao slug moi
    if (dto.name && dto.name !== product.name) {
      let newSlug = generateSlug(dto.name);
      newSlug = await this.ensureUniqueSlug(newSlug, id);
      product.slug = newSlug;
    }

    // Neu doi categoryId -> kiem tra ton tai
    if (dto.categoryId && dto.categoryId !== product.categoryId.toString()) {
      const category = await this.categoryModel.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundException(`Danh muc voi ID "${dto.categoryId}" khong ton tai`);
      }
    }

    // Cap nhat cac truong co ban
    const basicFields = [
      'name', 'shortDescription', 'description', 'categoryId',
      'comboCategoryId', 'basePrice', 'costPrice', 'brand',
      'material', 'origin', 'images', 'specifications', 'status',
      'tags', 'seo',
    ];

    for (const field of basicFields) {
      if (dto[field] !== undefined) {
        product[field] = dto[field];
      }
    }

    // Neu doi colors hoac dimensions -> regenerate variants
    let needRegenerate = false;

    if (dto.colors) {
      product.colors = dto.colors.map((c, i) => ({
        ...c,
        id: c['id'] || `C${String(i + 1).padStart(2, '0')}`,
        priceModifier: c.priceModifier || 0,
        images: c.images || [],
        available: c.available !== false,
      })) as any;
      needRegenerate = true;
    }

    if (dto.dimensions) {
      product.dimensions = dto.dimensions.map((d, i) => ({
        ...d,
        id: d['id'] || `D${String(i + 1).padStart(2, '0')}`,
        weight: d.weight || 0,
        priceModifier: d.priceModifier || 0,
        available: d.available !== false,
      })) as any;
      needRegenerate = true;
    }

    if (needRegenerate) {
      const category = await this.categoryModel.findById(
        dto.categoryId || product.categoryId,
      );
      product.variants = this.buildVariantsMatrix(
        product.colors,
        product.dimensions,
        product.basePrice,
        category?.slug || 'PRD',
      ) as any;
    }

    return product.save();
  }

  // ============================================================
  // SOFT DELETE
  // ============================================================
  async softDelete(id: string): Promise<{ message: string }> {
    const product = await this.productModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException(`San pham voi ID "${id}" khong ton tai`);
    }

    product.isDeleted = true;
    await product.save();

    return { message: `Da xoa san pham "${product.name}"` };
  }

  // ============================================================
  // SEARCH - Tim kiem full-text voi MongoDB text index
  // ============================================================
  async search(
    keyword: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    items: ProductDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('Tu khoa tim kiem khong duoc de trong');
    }

    const filter: FilterQuery<Product> = {
      $text: { $search: keyword },
      isDeleted: false,
      status: ProductStatus.ACTIVE,
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter, { score: { $meta: 'textScore' } })
        .populate('categoryId', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items: items as ProductDocument[],
      total,
      page,
      limit,
    };
  }

  // ============================================================
  // AUTOCOMPLETE - Goi y nhanh (chi tra ve ten + slug)
  // ============================================================
  async getAutoComplete(keyword: string): Promise<{ name: string; slug: string }[]> {
    if (!keyword || keyword.trim().length < 2) {
      return [];
    }

    const results = await this.productModel
      .find(
        {
          name: { $regex: keyword, $options: 'i' },
          isDeleted: false,
          status: ProductStatus.ACTIVE,
        },
        { name: 1, slug: 1, _id: 0 },
      )
      .limit(10)
      .lean();

    return results as { name: string; slug: string }[];
  }

  // ============================================================
  // ADD COLOR - Them mau sac moi cho san pham
  // ============================================================
  async addColor(productId: string, dto: CreateColorDto): Promise<ProductDocument> {
    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException(`San pham voi ID "${productId}" khong ton tai`);
    }

    // Tao id moi cho color
    const nextIndex = product.colors.length + 1;
    const newColor = {
      ...dto,
      id: `C${String(nextIndex).padStart(2, '0')}`,
      priceModifier: dto.priceModifier || 0,
      images: dto.images || [],
      available: dto.available !== false,
    };

    product.colors.push(newColor as any);
    return product.save();
  }

  // ============================================================
  // ADD DIMENSION - Them kich thuoc moi cho san pham
  // ============================================================
  async addDimension(
    productId: string,
    dto: CreateDimensionDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException(`San pham voi ID "${productId}" khong ton tai`);
    }

    const nextIndex = product.dimensions.length + 1;
    const newDimension = {
      ...dto,
      id: `D${String(nextIndex).padStart(2, '0')}`,
      weight: dto.weight || 0,
      priceModifier: dto.priceModifier || 0,
      available: dto.available !== false,
    };

    product.dimensions.push(newDimension as any);
    return product.save();
  }

  // ============================================================
  // REGENERATE VARIANTS - Tao lai tat ca SKU tu colors x dimensions
  // ============================================================
  async regenerateVariants(productId: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ _id: productId, isDeleted: false })
      .populate('categoryId', 'slug');

    if (!product) {
      throw new NotFoundException(`San pham voi ID "${productId}" khong ton tai`);
    }

    const categorySlug = (product.categoryId as any)?.slug || 'PRD';

    product.variants = this.buildVariantsMatrix(
      product.colors,
      product.dimensions,
      product.basePrice,
      categorySlug,
    ) as any;

    return product.save();
  }

  // ============================================================
  // UPDATE STOCK - Cap nhat ton kho cho 1 variant
  // ============================================================
  async updateStock(dto: StockUpdateDto): Promise<ProductDocument> {
    const { variantSku, quantity, operation } = dto;

    const product = await this.productModel.findOne({
      'variants.sku': variantSku.toUpperCase(),
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException(`Variant voi SKU "${variantSku}" khong ton tai`);
    }

    const variant = product.variants.find(
      (v) => v.sku === variantSku.toUpperCase(),
    );

    if (!variant) {
      throw new NotFoundException(`Variant voi SKU "${variantSku}" khong ton tai`);
    }

    switch (operation) {
      case StockOperation.ADD:
        variant.stock += quantity;
        break;
      case StockOperation.SUBTRACT:
        if (variant.stock < quantity) {
          throw new BadRequestException(
            `Khong du ton kho. Hien tai: ${variant.stock}, yeu cau tru: ${quantity}`,
          );
        }
        variant.stock -= quantity;
        break;
      case StockOperation.SET:
        variant.stock = quantity;
        break;
    }

    return product.save();
  }

  // ============================================================
  // RESERVE STOCK - Giu hang cho don hang (dung MongoDB session)
  // ============================================================
  async reserveStock(items: StockItem[]): Promise<void> {
    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        for (const item of items) {
          const result = await this.productModel.updateOne(
            {
              'variants.sku': item.variantSku.toUpperCase(),
              'variants.stock': { $gte: item.quantity },
              isDeleted: false,
            },
            {
              $inc: { 'variants.$.stock': -item.quantity },
            },
            { session },
          );

          if (result.modifiedCount === 0) {
            throw new BadRequestException(
              `Khong du ton kho cho SKU "${item.variantSku}". `
              + `Vui long kiem tra lai so luong.`,
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // RELEASE STOCK - Tra lai ton kho khi huy don
  // ============================================================
  async releaseStock(items: StockItem[]): Promise<void> {
    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        for (const item of items) {
          await this.productModel.updateOne(
            {
              'variants.sku': item.variantSku.toUpperCase(),
              isDeleted: false,
            },
            {
              $inc: { 'variants.$.stock': item.quantity },
            },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }

  // ============================================================
  // GET LOW STOCK PRODUCTS - San pham sap het hang
  // ============================================================
  async getLowStockProducts(): Promise<ProductDocument[]> {
    // Tim san pham co bat ky variant nao co stock <= minStock
    const products = await this.productModel
      .find({
        isDeleted: false,
        status: { $ne: ProductStatus.INACTIVE },
        variants: {
          $elemMatch: {
            $expr: { $lte: ['$stock', '$minStock'] },
          },
        },
      })
      .populate('categoryId', 'name slug')
      .lean();

    // Fallback: neu $expr khong hoat dong voi embedded docs
    // dung aggregation pipeline
    if (products.length === 0) {
      const result = await this.productModel.aggregate([
        { $match: { isDeleted: false, status: { $ne: ProductStatus.INACTIVE } } },
        { $unwind: '$variants' },
        {
          $match: {
            $expr: { $lte: ['$variants.stock', '$variants.minStock'] },
          },
        },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            slug: { $first: '$slug' },
            categoryId: { $first: '$categoryId' },
            lowStockVariants: {
              $push: {
                sku: '$variants.sku',
                stock: '$variants.stock',
                minStock: '$variants.minStock',
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      return result as any;
    }

    return products as ProductDocument[];
  }

  // ============================================================
  // GET RELATED PRODUCTS - San pham cung danh muc
  // ============================================================
  async getRelatedProducts(
    productId: string,
    limit: number = 8,
  ): Promise<ProductDocument[]> {
    const product = await this.productModel.findById(productId).lean();
    if (!product) {
      throw new NotFoundException(`San pham voi ID "${productId}" khong ton tai`);
    }

    const related = await this.productModel
      .find({
        _id: { $ne: new Types.ObjectId(productId) },
        categoryId: product.categoryId,
        isDeleted: false,
        status: ProductStatus.ACTIVE,
      })
      .populate('categoryId', 'name slug')
      .sort({ totalSold: -1 })
      .limit(limit)
      .lean();

    return related as ProductDocument[];
  }

  // ============================================================
  // GET BEST SELLERS - San pham ban chay nhat
  // ============================================================
  async getBestSellers(limit: number = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isDeleted: false,
        status: ProductStatus.ACTIVE,
        totalSold: { $gt: 0 },
      })
      .populate('categoryId', 'name slug')
      .sort({ totalSold: -1 })
      .limit(limit)
      .lean() as any;
  }

  // ============================================================
  // GET NEW ARRIVALS - San pham moi nhat
  // ============================================================
  async getNewArrivals(limit: number = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isDeleted: false,
        status: ProductStatus.ACTIVE,
      })
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as any;
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Dam bao slug la duy nhat trong DB.
   * Neu trung, them hau to -1, -2, -3, ...
   */
  private async ensureUniqueSlug(
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    let candidate = slug;
    let counter = 0;

    while (true) {
      const filter: FilterQuery<Product> = { slug: candidate };
      if (excludeId) {
        filter._id = { $ne: new Types.ObjectId(excludeId) };
      }

      const exists = await this.productModel.exists(filter);
      if (!exists) return candidate;

      counter++;
      candidate = `${slug}-${counter}`;
    }
  }

  /**
   * Tao variants matrix tu colors x dimensions.
   *
   * Logic:
   *   - Neu co ca colors VA dimensions: tao NxM variants
   *   - Neu chi co colors (khong co dimensions): tao N variants (1 per color)
   *   - Neu chi co dimensions (khong co colors): tao M variants (1 per dimension)
   *   - Neu khong co ca 2: tao 1 default variant
   *
   * Gia variant = basePrice + color.priceModifier + dimension.priceModifier
   *
   * SKU format: {CATEGORY_PREFIX}-{COLOR_ID}-{DIM_ID}-{RANDOM}
   */
  private buildVariantsMatrix(
    colors: any[],
    dimensions: any[],
    basePrice: number,
    categorySlug: string,
  ): any[] {
    const variants: any[] = [];

    if (colors.length > 0 && dimensions.length > 0) {
      // Matrix: color x dimension
      for (const color of colors) {
        for (const dim of dimensions) {
          variants.push({
            sku: generateSku(categorySlug, color.id, dim.id),
            colorId: color.id,
            dimensionId: dim.id,
            price: basePrice + (color.priceModifier || 0) + (dim.priceModifier || 0),
            costPrice: 0,
            stock: 0,
            minStock: INVENTORY.LOW_STOCK_THRESHOLD,
            image: null,
            available: color.available && dim.available,
          });
        }
      }
    } else if (colors.length > 0) {
      for (const color of colors) {
        variants.push({
          sku: generateSku(categorySlug, color.id, 'STD'),
          colorId: color.id,
          dimensionId: 'STD',
          price: basePrice + (color.priceModifier || 0),
          costPrice: 0,
          stock: 0,
          minStock: INVENTORY.LOW_STOCK_THRESHOLD,
          image: null,
          available: color.available,
        });
      }
    } else if (dimensions.length > 0) {
      for (const dim of dimensions) {
        variants.push({
          sku: generateSku(categorySlug, 'STD', dim.id),
          colorId: 'STD',
          dimensionId: dim.id,
          price: basePrice + (dim.priceModifier || 0),
          costPrice: 0,
          stock: 0,
          minStock: INVENTORY.LOW_STOCK_THRESHOLD,
          image: null,
          available: dim.available,
        });
      }
    } else {
      // Khong co color, khong co dimension -> 1 default variant
      variants.push({
        sku: generateSku(categorySlug, 'STD', 'STD'),
        colorId: 'STD',
        dimensionId: 'STD',
        price: basePrice,
        costPrice: 0,
        stock: 0,
        minStock: INVENTORY.LOW_STOCK_THRESHOLD,
        image: null,
        available: true,
      });
    }

    return variants;
  }
}
```

---

## 4. ProductsController

```typescript
// products.controller.ts
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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StockUpdateDto } from './dto/stock-update.dto';
import { CreateColorDto } from './dto/create-product.dto';
import { CreateDimensionDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared-types/enums';
import { Public } from '../auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================================
  // PUBLIC ENDPOINTS
  // ============================================================

  /**
   * GET /products
   * Lay danh sach san pham voi bo loc va phan trang
   */
  @Public()
  @Get()
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  /**
   * GET /products/search?q=sofa&page=1&limit=20
   * Tim kiem full-text san pham
   */
  @Public()
  @Get('search')
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
  async autocomplete(@Query('q') keyword: string) {
    return this.productsService.getAutoComplete(keyword);
  }

  /**
   * GET /products/best-sellers?limit=10
   * Lay san pham ban chay nhat
   */
  @Public()
  @Get('best-sellers')
  async getBestSellers(@Query('limit') limit?: number) {
    return this.productsService.getBestSellers(limit || 10);
  }

  /**
   * GET /products/new-arrivals?limit=10
   * Lay san pham moi nhat
   */
  @Public()
  @Get('new-arrivals')
  async getNewArrivals(@Query('limit') limit?: number) {
    return this.productsService.getNewArrivals(limit || 10);
  }

  /**
   * GET /products/:slug
   * Lay chi tiet san pham theo slug (public)
   */
  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  /**
   * GET /products/low-stock
   * Lay danh sach san pham sap het hang (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('low-stock')
  async getLowStock() {
    return this.productsService.getLowStockProducts();
  }

  /**
   * POST /products
   * Tao san pham moi (admin)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async updateStock(@Body() dto: StockUpdateDto) {
    return this.productsService.updateStock(dto);
  }
}
```

> **Luu y:** Route `/products/low-stock`, `/products/search`, `/products/best-sellers`, `/products/new-arrivals`, `/products/autocomplete` phai dat TRUOC route `/products/:slug` trong controller. Neu dat sau, NestJS se hieu "low-stock" la mot gia tri cua param `:slug`.

---

## 5. Bang API Endpoints

| # | Method | Endpoint | Auth | Role | Mo ta |
|---|--------|----------|------|------|-------|
| 1 | `GET` | `/products` | Public | - | Danh sach san pham (filter, pagination, sort) |
| 2 | `GET` | `/products/search?q=` | Public | - | Tim kiem full-text |
| 3 | `GET` | `/products/autocomplete?q=` | Public | - | Goi y nhanh (ten + slug) |
| 4 | `GET` | `/products/best-sellers` | Public | - | San pham ban chay |
| 5 | `GET` | `/products/new-arrivals` | Public | - | San pham moi nhat |
| 6 | `GET` | `/products/low-stock` | JWT | Admin, Manager | San pham sap het hang |
| 7 | `GET` | `/products/:slug` | Public | - | Chi tiet san pham theo slug |
| 8 | `POST` | `/products` | JWT | Admin, Manager | Tao san pham moi |
| 9 | `PATCH` | `/products/:id` | JWT | Admin, Manager | Cap nhat san pham |
| 10 | `DELETE` | `/products/:id` | JWT | Admin, Manager | Xoa mem san pham |
| 11 | `POST` | `/products/:id/colors` | JWT | Admin, Manager | Them mau sac |
| 12 | `POST` | `/products/:id/dimensions` | JWT | Admin, Manager | Them kich thuoc |
| 13 | `POST` | `/products/:id/regenerate-variants` | JWT | Admin, Manager | Tao lai tat ca variants |
| 14 | `PATCH` | `/products/:id/stock` | JWT | Admin, Manager, Staff | Cap nhat ton kho |

---

## 6. Vi du Request/Response

### 6.1. Tao san pham moi

**Request:**

```http
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Sofa Goc Chu L Nordic",
  "shortDescription": "Sofa goc phong cach Bac Au, boc vai chong tham",
  "description": "<p>Sofa goc chu L phong cach Nordic...</p>",
  "categoryId": "665a1b2c3d4e5f6a7b8c9d01",
  "basePrice": 15900000,
  "costPrice": 9500000,
  "brand": "NoiThat365",
  "material": "Vai polyester, khung go tu nhien",
  "origin": "Viet Nam",
  "images": [
    "https://drive.google.com/file/d/xxx1/view",
    "https://drive.google.com/file/d/xxx2/view"
  ],
  "colors": [
    {
      "name": "Xam dam",
      "hexCode": "#4A4A4A",
      "colorFamily": "Xam",
      "priceModifier": 0,
      "images": ["https://drive.google.com/file/d/gray1/view"]
    },
    {
      "name": "Be nhat",
      "hexCode": "#F5F0E8",
      "colorFamily": "Be",
      "priceModifier": 500000,
      "images": ["https://drive.google.com/file/d/beige1/view"]
    }
  ],
  "dimensions": [
    {
      "label": "2m4 x 1m6",
      "width": 240,
      "depth": 160,
      "height": 85,
      "weight": 65,
      "priceModifier": 0
    },
    {
      "label": "2m8 x 1m8",
      "width": 280,
      "depth": 180,
      "height": 85,
      "weight": 78,
      "priceModifier": 2000000
    }
  ],
  "specifications": {
    "Chat lieu boc": "Vai polyester chong tham",
    "Khung": "Go tu nhien xu ly chong moi",
    "Dem ngoi": "Mut D40 + mut Memory Foam",
    "Chan sofa": "Inox ma vang"
  },
  "tags": ["sofa", "phong-khach", "nordic", "sofa-goc"],
  "status": "active"
}
```

**Response (201 Created):**

```json
{
  "_id": "665b2c3d4e5f6a7b8c9d0e12",
  "name": "Sofa Goc Chu L Nordic",
  "slug": "sofa-goc-chu-l-nordic",
  "shortDescription": "Sofa goc phong cach Bac Au, boc vai chong tham",
  "categoryId": "665a1b2c3d4e5f6a7b8c9d01",
  "basePrice": 15900000,
  "brand": "NoiThat365",
  "material": "Vai polyester, khung go tu nhien",
  "colors": [
    { "id": "C01", "name": "Xam dam", "hexCode": "#4A4A4A", "priceModifier": 0, "available": true },
    { "id": "C02", "name": "Be nhat", "hexCode": "#F5F0E8", "priceModifier": 500000, "available": true }
  ],
  "dimensions": [
    { "id": "D01", "label": "2m4 x 1m6", "width": 240, "depth": 160, "height": 85, "priceModifier": 0 },
    { "id": "D02", "label": "2m8 x 1m8", "width": 280, "depth": 180, "height": 85, "priceModifier": 2000000 }
  ],
  "variants": [
    { "sku": "SF-C01-D01-A3F2", "colorId": "C01", "dimensionId": "D01", "price": 15900000, "stock": 0 },
    { "sku": "SF-C01-D02-B7E1", "colorId": "C01", "dimensionId": "D02", "price": 17900000, "stock": 0 },
    { "sku": "SF-C02-D01-C4D9", "colorId": "C02", "dimensionId": "D01", "price": 16400000, "stock": 0 },
    { "sku": "SF-C02-D02-D8A3", "colorId": "C02", "dimensionId": "D02", "price": 18400000, "stock": 0 }
  ],
  "status": "active",
  "viewCount": 0,
  "totalSold": 0,
  "isDeleted": false,
  "createdAt": "2026-04-02T08:30:00.000Z",
  "updatedAt": "2026-04-02T08:30:00.000Z"
}
```

> **Giai thich SKU:** `SF-C02-D02-D8A3`
> - `SF` = Prefix cua danh muc "Sofa"
> - `C02` = Mau "Be nhat"
> - `D02` = Kich thuoc "2m8 x 1m8"
> - `D8A3` = Random 4 ky tu hex

> **Giai thich gia:** `18,400,000 = 15,900,000 (base) + 500,000 (mau Be) + 2,000,000 (kich thuoc lon)`

---

### 6.2. Danh sach san pham voi filter

**Request:**

```http
GET /products?categoryId=665a1b2c3d4e5f6a7b8c9d01&minPrice=10000000&maxPrice=20000000&brand=NoiThat365&sort=price_asc&page=1&limit=12
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "_id": "665b2c3d4e5f6a7b8c9d0e12",
      "name": "Sofa Goc Chu L Nordic",
      "slug": "sofa-goc-chu-l-nordic",
      "basePrice": 15900000,
      "images": ["https://drive.google.com/file/d/xxx1/view"],
      "brand": "NoiThat365",
      "categoryId": { "_id": "665a1b2c3d4e5f6a7b8c9d01", "name": "Sofa", "slug": "sofa" },
      "status": "active",
      "totalSold": 42,
      "variants": [
        { "sku": "SF-C01-D01-A3F2", "price": 15900000, "stock": 12 }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12,
  "totalPages": 1
}
```

---

### 6.3. Tim kiem san pham

**Request:**

```http
GET /products/search?q=sofa%20goc%20vai&page=1&limit=10
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "_id": "665b2c3d4e5f6a7b8c9d0e12",
      "name": "Sofa Goc Chu L Nordic",
      "slug": "sofa-goc-chu-l-nordic",
      "shortDescription": "Sofa goc phong cach Bac Au, boc vai chong tham",
      "basePrice": 15900000,
      "categoryId": { "_id": "665a1b2c3d4e5f6a7b8c9d01", "name": "Sofa", "slug": "sofa" }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### 6.4. Autocomplete

**Request:**

```http
GET /products/autocomplete?q=sof
```

**Response (200 OK):**

```json
[
  { "name": "Sofa Goc Chu L Nordic", "slug": "sofa-goc-chu-l-nordic" },
  { "name": "Sofa Bed Da Nang 3in1", "slug": "sofa-bed-da-nang-3in1" },
  { "name": "Sofa Don Scandinavian", "slug": "sofa-don-scandinavian" }
]
```

---

### 6.5. Cap nhat ton kho

**Request:**

```http
PATCH /products/665b2c3d4e5f6a7b8c9d0e12/stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "variantSku": "SF-C01-D01-A3F2",
  "quantity": 20,
  "operation": "set"
}
```

**Response (200 OK):**

```json
{
  "_id": "665b2c3d4e5f6a7b8c9d0e12",
  "name": "Sofa Goc Chu L Nordic",
  "variants": [
    { "sku": "SF-C01-D01-A3F2", "colorId": "C01", "dimensionId": "D01", "price": 15900000, "stock": 20, "minStock": 5 },
    { "sku": "SF-C01-D02-B7E1", "colorId": "C01", "dimensionId": "D02", "price": 17900000, "stock": 0, "minStock": 5 }
  ]
}
```

---

### 6.6. San pham ban chay

**Request:**

```http
GET /products/best-sellers?limit=5
```

**Response (200 OK):**

```json
[
  {
    "_id": "665b2c3d4e5f6a7b8c9d0e12",
    "name": "Sofa Goc Chu L Nordic",
    "slug": "sofa-goc-chu-l-nordic",
    "basePrice": 15900000,
    "images": ["https://drive.google.com/file/d/xxx1/view"],
    "categoryId": { "_id": "665a1b2c3d4e5f6a7b8c9d01", "name": "Sofa", "slug": "sofa" },
    "totalSold": 142
  },
  {
    "_id": "665c3d4e5f6a7b8c9d0e1f23",
    "name": "Ban An Go Oc Cho 6 Ghe",
    "slug": "ban-an-go-oc-cho-6-ghe",
    "basePrice": 12500000,
    "categoryId": { "_id": "665a1b2c3d4e5f6a7b8c9d02", "name": "Ban an", "slug": "ban-an" },
    "totalSold": 98
  }
]
```

---

### 6.7. Them mau sac moi

**Request:**

```http
POST /products/665b2c3d4e5f6a7b8c9d0e12/colors
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Xanh navy",
  "hexCode": "#1B3A5C",
  "colorFamily": "Xanh",
  "priceModifier": 300000,
  "images": ["https://drive.google.com/file/d/navy1/view"]
}
```

**Response (200 OK):**

```json
{
  "_id": "665b2c3d4e5f6a7b8c9d0e12",
  "name": "Sofa Goc Chu L Nordic",
  "colors": [
    { "id": "C01", "name": "Xam dam", "hexCode": "#4A4A4A" },
    { "id": "C02", "name": "Be nhat", "hexCode": "#F5F0E8" },
    { "id": "C03", "name": "Xanh navy", "hexCode": "#1B3A5C", "priceModifier": 300000 }
  ]
}
```

> **Luu y:** Sau khi them mau moi, can goi `POST /products/:id/regenerate-variants` de tao them cac variants moi cho mau nay.

---

### 6.8. San pham sap het hang (Admin)

**Request:**

```http
GET /products/low-stock
Authorization: Bearer <admin_token>
```

**Response (200 OK):**

```json
[
  {
    "_id": "665b2c3d4e5f6a7b8c9d0e12",
    "name": "Sofa Goc Chu L Nordic",
    "slug": "sofa-goc-chu-l-nordic",
    "categoryId": { "_id": "665a1b2c3d4e5f6a7b8c9d01", "name": "Sofa" },
    "lowStockVariants": [
      { "sku": "SF-C01-D02-B7E1", "stock": 2, "minStock": 5 },
      { "sku": "SF-C02-D02-D8A3", "stock": 0, "minStock": 5 }
    ]
  }
]
```

---

### 6.9. Loi thuong gap

**San pham khong ton tai (404):**

```json
{
  "statusCode": 404,
  "message": "San pham voi slug \"sofa-abc-xyz\" khong ton tai",
  "error": "Not Found"
}
```

**Khong du ton kho (400):**

```json
{
  "statusCode": 400,
  "message": "Khong du ton kho. Hien tai: 3, yeu cau tru: 10",
  "error": "Bad Request"
}
```

**Tu khoa tim kiem rong (400):**

```json
{
  "statusCode": 400,
  "message": "Tu khoa tim kiem khong duoc de trong",
  "error": "Bad Request"
}
```

---

> **Tong ket:**
> - Products module la module phuc tap nhat voi 14 endpoints
> - Variants duoc tu dong tao bang cong thuc: colors x dimensions
> - SKU co cau truc co y nghia: `{DANH_MUC}-{MAU}-{KICH_THUOC}-{RANDOM}`
> - Stock management ho tro atomic operations voi MongoDB sessions
> - Full-text search dung MongoDB text index voi trong so (name > shortDescription > description)
> - Phan trang, loc, sap xep day du cho danh sach san pham
