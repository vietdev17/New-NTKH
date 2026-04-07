import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, FilterQuery } from 'mongoose';
import { Product, ProductDocument, ProductStatus } from './schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { CreateProductDto, CreateColorDto, CreateDimensionDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StockUpdateDto, StockOperation } from './dto/stock-update.dto';
import { StockItem } from './interfaces/stock-item.interface';
import { generateSlug } from './helpers/slug.helper';
import { generateSku } from './helpers/sku.helper';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 5;

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
      page = DEFAULT_PAGE,
      limit = DEFAULT_PAGE_SIZE,
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
      items: items as unknown as ProductDocument[],
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
    const query = Types.ObjectId.isValid(slug)
      ? { $or: [{ _id: slug }, { slug }], isDeleted: false }
      : { slug, isDeleted: false };

    const product = await this.productModel
      .findOne(query)
      .populate('categoryId', 'name slug image')
      .lean();

    if (!product) {
      throw new NotFoundException(`San pham voi slug "${slug}" khong ton tai`);
    }

    // Tang view count (fire-and-forget)
    this.productModel
      .updateOne({ _id: product._id }, { $inc: { viewCount: 1 } })
      .exec();

    return product as unknown as ProductDocument;
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

    return product as unknown as ProductDocument;
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
        id: (c as any)['id'] || `C${String(i + 1).padStart(2, '0')}`,
        priceModifier: c.priceModifier || 0,
        images: c.images || [],
        available: c.available !== false,
      })) as any;
      needRegenerate = true;
    }

    if (dto.dimensions) {
      product.dimensions = dto.dimensions.map((d, i) => ({
        ...d,
        id: (d as any)['id'] || `D${String(i + 1).padStart(2, '0')}`,
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
      items: items as unknown as ProductDocument[],
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

    // Fallback: neu $expr khong hoat dong voi embedded docs -> dung aggregation pipeline
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

    return products as unknown as ProductDocument[];
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

    return related as unknown as ProductDocument[];
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
            minStock: LOW_STOCK_THRESHOLD,
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
          minStock: LOW_STOCK_THRESHOLD,
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
          minStock: LOW_STOCK_THRESHOLD,
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
        minStock: LOW_STOCK_THRESHOLD,
        image: null,
        available: true,
      });
    }

    return variants;
  }
}
