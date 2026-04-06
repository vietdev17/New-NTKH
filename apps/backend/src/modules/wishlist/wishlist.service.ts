import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private wishlistModel: Model<WishlistDocument>,
  ) {}

  // ===== THEM SAN PHAM VAO WISHLIST =====
  async add(userId: string, dto: AddToWishlistDto): Promise<WishlistDocument> {
    const userObjId = new Types.ObjectId(userId);
    const productObjId = new Types.ObjectId(dto.productId);

    const existing = await this.wishlistModel.findOne({
      userId: userObjId,
      productId: productObjId,
    });
    if (existing) {
      throw new ConflictException('San pham da co trong danh sach yeu thich');
    }

    const wishlistItem = new this.wishlistModel({
      userId: userObjId,
      productId: productObjId,
      addedAt: new Date(),
    });

    return wishlistItem.save();
  }

  // ===== XOA SAN PHAM KHOI WISHLIST =====
  async remove(userId: string, productId: string): Promise<void> {
    const result = await this.wishlistModel.deleteOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('San pham khong ton tai trong danh sach yeu thich');
    }
  }

  // ===== LAY DANH SACH YEU THICH VOI PHAN TRANG =====
  async getWishlist(
    userId: string,
    query: QueryWishlistDto,
  ): Promise<{
    items: WishlistDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [items, total] = await Promise.all([
      this.wishlistModel
        .find(filter)
        .populate({
          path: 'productId',
          select: 'name slug images basePrice status',
        })
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.wishlistModel.countDocuments(filter),
    ]);

    return {
      items: items as WishlistDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== KIEM TRA SAN PHAM CO TRONG WISHLIST KHONG =====
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const count = await this.wishlistModel.countDocuments({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });
    return count > 0;
  }

  // ===== KIEM TRA NHIEU SAN PHAM CUNG LUC =====
  async checkMultiple(
    userId: string,
    productIds: string[],
  ): Promise<Record<string, boolean>> {
    const userObjId = new Types.ObjectId(userId);
    const productObjIds = productIds.map((id) => new Types.ObjectId(id));

    const wishlistItems = await this.wishlistModel
      .find({ userId: userObjId, productId: { $in: productObjIds } })
      .select('productId')
      .lean();

    const wishlistSet = new Set(
      wishlistItems.map((item) => item.productId.toString()),
    );

    const result: Record<string, boolean> = {};
    productIds.forEach((id) => {
      result[id] = wishlistSet.has(id);
    });

    return result;
  }

  // ===== DEM SO LUONG WISHLIST =====
  async getCount(userId: string): Promise<number> {
    return this.wishlistModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
  }

  // ===== XOA TOAN BO WISHLIST =====
  async clear(userId: string): Promise<{ deletedCount: number }> {
    const result = await this.wishlistModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
    return { deletedCount: result.deletedCount };
  }

  // ===== CHUYEN TU WISHLIST SANG GIO HANG =====
  // Xoa khoi wishlist - gio hang duoc quan ly tren frontend
  async moveToCart(
    userId: string,
    productId: string,
    variantSku?: string,
  ): Promise<{ message: string; productId: string; variantSku?: string }> {
    await this.remove(userId, productId);
    return {
      message: 'Da xoa khoi wishlist. Frontend se them vao gio hang.',
      productId,
      variantSku: variantSku || undefined,
    };
  }
}
