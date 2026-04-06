import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus } from '../orders/schemas/order.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { VoteHelpfulDto } from './dto/vote-helpful.dto';
import { ProductReviewStats } from './interfaces/product-stats.interface';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  // ============================================================
  // CREATE - Tao danh gia moi
  // ============================================================
  async create(userId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    // 1. Kiem tra san pham ton tai
    const product = await this.productModel.findOne({
      _id: dto.productId,
      isDeleted: false,
    });
    if (!product) {
      throw new NotFoundException(`San pham voi ID "${dto.productId}" khong ton tai`);
    }

    // 2. Kiem tra don hang ton tai va thuoc ve user nay
    const order = await this.orderModel.findOne({
      _id: dto.orderId,
      userId: new Types.ObjectId(userId),
    });
    if (!order) {
      throw new NotFoundException(
        `Don hang voi ID "${dto.orderId}" khong ton tai hoac khong thuoc ve ban`,
      );
    }

    // 3. Kiem tra don hang da giao thanh cong
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Chi co the danh gia san pham khi don hang da giao thanh cong. Trang thai hien tai: "${order.status}"`,
      );
    }

    // 4. Kiem tra don hang co chua san pham nay khong
    const orderHasProduct = order.items.some(
      (item: any) => item.productId?.toString() === dto.productId,
    );
    if (!orderHasProduct) {
      throw new BadRequestException(
        `Don hang nay khong chua san pham voi ID "${dto.productId}"`,
      );
    }

    // 5. Kiem tra da danh gia san pham nay trong don hang nay chua
    const existingReview = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(dto.productId),
      orderId: new Types.ObjectId(dto.orderId),
      isDeleted: false,
    });
    if (existingReview) {
      throw new BadRequestException(
        'Ban da danh gia san pham nay trong don hang nay roi. Moi san pham chi duoc danh gia 1 lan trong moi don hang.',
      );
    }

    // 6. Validate so luong hinh anh
    if (dto.images && dto.images.length > 5) {
      throw new BadRequestException('Toi da 5 hinh anh cho moi danh gia');
    }

    // 7. Tao review (trang thai mac dinh: pending)
    const review = new this.reviewModel({
      productId: new Types.ObjectId(dto.productId),
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(dto.orderId),
      orderItemSku: dto.orderItemSku || null,
      rating: dto.rating,
      title: dto.title || null,
      comment: dto.comment || null,
      images: dto.images || [],
      status: ReviewStatus.PENDING,
    });

    return review.save();
  }

  // ============================================================
  // FIND BY PRODUCT - Lay danh gia cua san pham (chi approved)
  // ============================================================
  async findByProduct(
    productId: string,
    query: QueryReviewDto,
  ): Promise<{
    items: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, rating, sort } = query;

    const filter: FilterQuery<Review> = {
      productId: new Types.ObjectId(productId),
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    };

    if (rating) {
      filter.rating = rating;
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'highest':
        sortObj = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortObj = { rating: 1, createdAt: -1 };
        break;
      case 'most_helpful':
        sortObj = { helpfulCount: -1, createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userId', 'fullName avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      items: items as ReviewDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================
  // FIND BY USER - Lay danh gia cua user (tat ca trang thai)
  // ============================================================
  async findByUser(userId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ userId: new Types.ObjectId(userId), isDeleted: false })
      .populate('productId', 'name slug images')
      .populate('orderId', 'orderCode')
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  // ============================================================
  // FIND BY ID
  // ============================================================
  async findById(id: string): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID danh gia khong hop le');
    }

    const review = await this.reviewModel
      .findOne({ _id: id, isDeleted: false })
      .populate('userId', 'fullName avatar')
      .populate('productId', 'name slug images')
      .lean();

    if (!review) {
      throw new NotFoundException(`Danh gia voi ID "${id}" khong ton tai`);
    }

    return review as ReviewDocument;
  }

  // ============================================================
  // UPDATE - Cap nhat danh gia (chi khi con pending)
  // ============================================================
  async update(id: string, userId: string, dto: UpdateReviewDto): Promise<ReviewDocument> {
    const review = await this.reviewModel.findOne({ _id: id, isDeleted: false });
    if (!review) {
      throw new NotFoundException(`Danh gia voi ID "${id}" khong ton tai`);
    }
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Ban khong co quyen cap nhat danh gia nay');
    }
    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException(
        `Chi co the cap nhat danh gia khi con o trang thai "pending". Trang thai hien tai: "${review.status}"`,
      );
    }
    if (dto.images && dto.images.length > 5) {
      throw new BadRequestException('Toi da 5 hinh anh cho moi danh gia');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.comment !== undefined) review.comment = dto.comment;
    if (dto.images !== undefined) review.images = dto.images;

    return review.save();
  }

  // ============================================================
  // DELETE - Xoa mem danh gia (cua chinh minh)
  // ============================================================
  async delete(id: string, userId: string): Promise<{ message: string }> {
    const review = await this.reviewModel.findOne({ _id: id, isDeleted: false });
    if (!review) {
      throw new NotFoundException(`Danh gia voi ID "${id}" khong ton tai`);
    }
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Ban khong co quyen xoa danh gia nay');
    }

    review.isDeleted = true;
    await review.save();
    return { message: 'Da xoa danh gia' };
  }

  // ============================================================
  // GET PRODUCT STATS - Thong ke danh gia cua san pham
  // ============================================================
  async getProductStats(productId: string): Promise<ProductReviewStats> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID san pham khong hop le');
    }

    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          status: ReviewStatus.APPROVED,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const result = stats[0];
    return {
      averageRating: Math.round(result.averageRating * 10) / 10,
      totalReviews: result.totalReviews,
      ratingDistribution: {
        1: result.star1,
        2: result.star2,
        3: result.star3,
        4: result.star4,
        5: result.star5,
      },
    };
  }

  // ============================================================
  // VOTE HELPFUL - Danh dau danh gia huu ich/khong huu ich
  // ============================================================
  async voteHelpful(
    reviewId: string,
    userId: string,
    dto: VoteHelpfulDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    });
    if (!review) {
      throw new NotFoundException(
        `Danh gia voi ID "${reviewId}" khong ton tai hoac chua duoc duyet`,
      );
    }
    if (review.userId.toString() === userId) {
      throw new BadRequestException('Ban khong the vote cho danh gia cua chinh minh');
    }

    const existingVoteIndex = review.helpfulVotes.findIndex(
      (v) => v.userId.toString() === userId,
    );

    if (existingVoteIndex !== -1) {
      const existingVote = review.helpfulVotes[existingVoteIndex];

      if (existingVote.isHelpful === dto.isHelpful) {
        // Toggle off - xoa vote
        review.helpfulVotes.splice(existingVoteIndex, 1);
        if (dto.isHelpful) {
          review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
          review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
        }
      } else {
        // Doi vote
        existingVote.isHelpful = dto.isHelpful;
        if (dto.isHelpful) {
          review.helpfulCount += 1;
          review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
        } else {
          review.unhelpfulCount += 1;
          review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        }
      }
    } else {
      // Vote moi
      review.helpfulVotes.push({
        userId: new Types.ObjectId(userId),
        isHelpful: dto.isHelpful,
      } as any);
      if (dto.isHelpful) {
        review.helpfulCount += 1;
      } else {
        review.unhelpfulCount += 1;
      }
    }

    return review.save();
  }

  // ============================================================
  // MODERATE - Admin duyet/tu choi/flag danh gia
  // ============================================================
  async moderate(
    id: string,
    adminId: string,
    dto: ModerateReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findOne({ _id: id, isDeleted: false });
    if (!review) {
      throw new NotFoundException(`Danh gia voi ID "${id}" khong ton tai`);
    }
    if (review.isDeleted) {
      throw new BadRequestException('Danh gia nay da bi xoa');
    }
    if (dto.status === ReviewStatus.PENDING) {
      throw new BadRequestException(
        'Khong the dat trang thai ve "pending". Hay chon approved, rejected, hoac flagged.',
      );
    }

    review.status = dto.status;
    review.adminNote = dto.adminNote || null;
    review.moderatedBy = new Types.ObjectId(adminId);
    review.moderatedAt = new Date();

    return review.save();
  }

  // ============================================================
  // GET PENDING REVIEWS - Admin: lay danh gia cho duyet
  // ============================================================
  async getPendingReviews(query: QueryReviewDto): Promise<{
    items: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<Review> = {
      status: ReviewStatus.PENDING,
      isDeleted: false,
    };

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userId', 'fullName email avatar')
        .populate('productId', 'name slug images')
        .populate('orderId', 'orderCode')
        .sort({ createdAt: 1 }) // FIFO
        .skip(skip)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      items: items as ReviewDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================
  // CAN REVIEW - Kiem tra user co the danh gia san pham khong
  // ============================================================
  async canReview(
    userId: string,
    productId: string,
  ): Promise<{
    canReview: boolean;
    reason?: string;
    eligibleOrders?: { orderId: string; orderCode: string }[];
  }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID san pham khong hop le');
    }

    // 1. Tim tat ca don hang da giao chua san pham nay
    const deliveredOrders = await this.orderModel
      .find({
        userId: new Types.ObjectId(userId),
        status: OrderStatus.DELIVERED,
        'items.productId': new Types.ObjectId(productId),
      })
      .select('_id orderCode')
      .lean();

    if (deliveredOrders.length === 0) {
      return {
        canReview: false,
        reason: 'Ban chua co don hang nao da giao thanh cong chua san pham nay',
      };
    }

    // 2. Tim cac don hang da review san pham nay
    const reviewedOrderIds = await this.reviewModel
      .find({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(productId),
        isDeleted: false,
      })
      .select('orderId')
      .lean();

    const reviewedSet = new Set(reviewedOrderIds.map((r) => r.orderId.toString()));

    // 3. Loc ra cac don hang chua review
    const eligibleOrders = deliveredOrders
      .filter((order) => !reviewedSet.has(order._id.toString()))
      .map((order) => ({
        orderId: order._id.toString(),
        orderCode: (order as any).orderCode,
      }));

    if (eligibleOrders.length === 0) {
      return {
        canReview: false,
        reason: 'Ban da danh gia san pham nay trong tat ca cac don hang da giao',
      };
    }

    return {
      canReview: true,
      eligibleOrders,
    };
  }
}
