import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
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
      category: category as unknown as CategoryDocument,
      children: children as unknown as CategoryDocument[],
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

    return category as unknown as CategoryDocument;
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
