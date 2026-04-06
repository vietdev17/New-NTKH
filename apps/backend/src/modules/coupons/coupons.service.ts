import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Coupon,
  CouponDocument,
  CouponScope,
  DiscountType,
} from './schemas/coupon.schema';
import {
  CouponUsage,
  CouponUsageDocument,
} from './schemas/coupon-usage.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto, CouponFilter } from './dto/query-coupon.dto';
import { CouponOrderItemDto } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name)
    private couponUsageModel: Model<CouponUsageDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // ===== TAO COUPON =====
  async create(dto: CreateCouponDto): Promise<CouponDocument> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Ngay bat dau phai truoc ngay ket thuc');
    }

    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException(
        'Phan tram giam gia khong duoc vuot qua 100%',
      );
    }

    if (dto.scope === CouponScope.CATEGORY) {
      if (!dto.applicableCategories?.length) {
        throw new BadRequestException(
          'Scope CATEGORY can co it nhat 1 danh muc',
        );
      }
    }

    if (dto.scope === CouponScope.PRODUCT) {
      if (!dto.applicableProducts?.length) {
        throw new BadRequestException(
          'Scope PRODUCT can co it nhat 1 san pham',
        );
      }
    }

    const existing = await this.couponModel.findOne({
      code: dto.code.toUpperCase(),
    });
    if (existing) {
      throw new ConflictException(`Ma coupon "${dto.code}" da ton tai`);
    }

    const coupon = new this.couponModel({
      ...dto,
      code: dto.code.toUpperCase(),
    });
    return coupon.save();
  }

  // ===== DANH SACH COUPON (ADMIN) =====
  async findAll(query: QueryCouponDto) {
    const { page = 1, limit = 20, filter, scope, search, isActive } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const conditions: any = {};

    if (filter === CouponFilter.ACTIVE) {
      conditions.isActive = true;
      conditions.endDate = { $gte: now };
      conditions.startDate = { $lte: now };
    } else if (filter === CouponFilter.EXPIRED) {
      conditions.$or = [{ endDate: { $lt: now } }, { isActive: false }];
    }

    if (isActive !== undefined) {
      conditions.isActive = isActive;
    }

    if (scope) {
      conditions.scope = scope;
    }

    if (search) {
      conditions.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.couponModel
        .find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.couponModel.countDocuments(conditions),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== CHI TIET COUPON (KEM THONG KE SU DUNG) =====
  async findById(id: string): Promise<any> {
    const coupon = await this.couponModel.findById(id).lean();
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }

    const usageStats = await this.getUsageStats(id);

    return {
      ...coupon,
      usageStats,
    };
  }

  // ===== TIM THEO CODE =====
  async findByCode(code: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon "${code}" khong ton tai`);
    }
    return coupon;
  }

  // ===== CAP NHAT COUPON =====
  async update(id: string, dto: UpdateCouponDto): Promise<CouponDocument> {
    if (dto.startDate && dto.endDate) {
      if (new Date(dto.startDate) >= new Date(dto.endDate)) {
        throw new BadRequestException('Ngay bat dau phai truoc ngay ket thuc');
      }
    }

    if (
      dto.discountType === DiscountType.PERCENTAGE &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException(
        'Phan tram giam gia khong duoc vuot qua 100%',
      );
    }

    if (dto.code) {
      const existing = await this.couponModel.findOne({
        code: dto.code.toUpperCase(),
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existing) {
        throw new ConflictException(`Ma coupon "${dto.code}" da ton tai`);
      }
      dto.code = dto.code.toUpperCase();
    }

    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true },
    );

    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }

    return coupon;
  }

  // ===== KICH HOAT COUPON =====
  async activate(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    );
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }
    return coupon;
  }

  // ===== VO HIEU HOA COUPON =====
  async deactivate(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }
    return coupon;
  }

  // ===== XOA COUPON =====
  async delete(id: string): Promise<void> {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon khong ton tai');
    }

    const usageCount = await this.couponUsageModel.countDocuments({
      couponId: new Types.ObjectId(id),
    });
    if (usageCount > 0) {
      throw new BadRequestException(
        `Coupon da duoc su dung ${usageCount} lan, khong the xoa. Hay vo hieu hoa thay vi xoa.`,
      );
    }

    await this.couponModel.findByIdAndDelete(id);
  }

  // =============================================================
  // VALIDATE VA AP DUNG COUPON - LOGIC QUAN TRONG NHAT
  // =============================================================
  async validateAndApply(
    code: string,
    userId: string | null,
    items: CouponOrderItemDto[],
    subtotal: number,
  ): Promise<{
    isValid: boolean;
    discountAmount: number;
    message: string;
    couponId?: string;
  }> {
    // Buoc 1: Kiem tra coupon ton tai va isActive
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
    });

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Ma giam gia "${code}" khong ton tai`,
      };
    }

    if (!coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Ma giam gia da bi vo hieu hoa',
      };
    }

    // Buoc 2: Kiem tra thoi gian hieu luc
    const now = new Date();

    if (now < coupon.startDate) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Ma giam gia chua co hieu luc. Bat dau tu ${coupon.startDate.toLocaleDateString('vi-VN')}`,
      };
    }

    if (now > coupon.endDate) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Ma giam gia da het han',
      };
    }

    // Buoc 3: Kiem tra tong so lan su dung
    if (coupon.maxUsage !== null && coupon.maxUsage !== undefined && coupon.usedCount >= coupon.maxUsage) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Ma giam gia da het luot su dung',
      };
    }

    // Buoc 4: Kiem tra so lan su dung cua user nay (neu co userId)
    if (userId) {
      const userUsageCount = await this.couponUsageModel.countDocuments({
        couponId: coupon._id,
        userId: new Types.ObjectId(userId),
      });

      if (userUsageCount >= coupon.maxUsagePerUser) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `Ban da su dung ma nay ${userUsageCount}/${coupon.maxUsagePerUser} lan`,
        };
      }
    }

    // Buoc 5: Kiem tra gia tri don hang toi thieu
    if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Don hang toi thieu ${coupon.minOrderValue.toLocaleString('vi-VN')} VND de su dung ma nay`,
      };
    }

    // Buoc 6: Kiem tra scope va tinh tien giam
    let applicableTotal = 0;

    switch (coupon.scope) {
      case CouponScope.ALL:
        applicableTotal = subtotal;
        break;

      case CouponScope.CATEGORY: {
        const applicableCategoryIds = coupon.applicableCategories.map((id) =>
          id.toString(),
        );
        for (const item of items) {
          if (applicableCategoryIds.includes(item.categoryId)) {
            applicableTotal += item.price * item.quantity;
          }
        }
        if (applicableTotal === 0) {
          return {
            isValid: false,
            discountAmount: 0,
            message:
              'Khong co san pham nao trong don hang thuoc danh muc duoc ap dung ma giam gia nay',
          };
        }
        break;
      }

      case CouponScope.PRODUCT: {
        const applicableProductIds = coupon.applicableProducts.map((id) =>
          id.toString(),
        );
        for (const item of items) {
          if (applicableProductIds.includes(item.productId)) {
            applicableTotal += item.price * item.quantity;
          }
        }
        if (applicableTotal === 0) {
          return {
            isValid: false,
            discountAmount: 0,
            message:
              'Khong co san pham nao trong don hang duoc ap dung ma giam gia nay',
          };
        }
        break;
      }

      default:
        applicableTotal = subtotal;
    }

    // Buoc 7: Tinh toan so tien giam
    let discountAmount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.round(
        (applicableTotal * coupon.discountValue) / 100,
      );
    } else {
      // FIXED
      discountAmount = coupon.discountValue;
    }

    // Buoc 8: Ap dung gioi han giam toi da
    if (
      coupon.maxDiscountAmount !== null &&
      coupon.maxDiscountAmount !== undefined &&
      coupon.maxDiscountAmount > 0 &&
      discountAmount > coupon.maxDiscountAmount
    ) {
      discountAmount = coupon.maxDiscountAmount;
    }

    // Dam bao khong giam nhieu hon tong don
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      isValid: true,
      discountAmount,
      message: `Ap dung ma "${coupon.code}" thanh cong. Giam ${discountAmount.toLocaleString('vi-VN')} VND`,
      couponId: (coupon._id as Types.ObjectId).toString(),
    };
  }

  // ===== GHI NHAN SU DUNG SAU KHI TAO DON =====
  async recordUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
  ): Promise<void> {
    await this.couponUsageModel.create({
      couponId: new Types.ObjectId(couponId),
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
      discountAmount,
      usedAt: new Date(),
    });

    await this.couponModel.findByIdAndUpdate(couponId, {
      $inc: { usedCount: 1 },
    });
  }

  // ===== THONG KE SU DUNG =====
  async getUsageStats(couponId: string) {
    const [totalUsage, uniqueUsers, totalDiscount, recentUsages] =
      await Promise.all([
        this.couponUsageModel.countDocuments({
          couponId: new Types.ObjectId(couponId),
        }),
        this.couponUsageModel.distinct('userId', {
          couponId: new Types.ObjectId(couponId),
        }),
        this.couponUsageModel.aggregate([
          { $match: { couponId: new Types.ObjectId(couponId) } },
          { $group: { _id: null, total: { $sum: '$discountAmount' } } },
        ]),
        this.couponUsageModel
          .find({ couponId: new Types.ObjectId(couponId) })
          .sort({ usedAt: -1 })
          .limit(10)
          .populate('userId', 'fullName email')
          .populate('orderId', 'orderNumber total')
          .lean(),
      ]);

    return {
      totalUsage,
      uniqueUsers: uniqueUsers.length,
      totalDiscountGiven: totalDiscount.length > 0 ? totalDiscount[0].total : 0,
      recentUsages,
    };
  }

  // ===== COUPON DANG HOAT DONG (PUBLIC/CUSTOMER) =====
  async getActiveCoupons() {
    const now = new Date();

    return this.couponModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { maxUsage: null },
          { $expr: { $lt: ['$usedCount', '$maxUsage'] } },
        ],
      })
      .select(
        'code description discountType discountValue minOrderValue maxDiscountAmount startDate endDate scope',
      )
      .sort({ endDate: 1 })
      .lean();
  }
}
