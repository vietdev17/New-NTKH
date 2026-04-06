# REVIEWS MODULE

> Module quan ly danh gia san pham - ho tro moderate (duyet truoc khi hien thi),
> vote huu ich, dinh kem hinh anh, thong ke rating.
> Khach hang chi duoc danh gia khi co don hang da giao thanh cong chua san pham do.
> File goc: `apps/api/src/modules/reviews/`

---

## Muc luc

1. [Cau truc module](#1-cau-truc-module)
2. [DTOs](#2-dtos)
3. [ReviewsService](#3-reviewsservice)
4. [ReviewsController](#4-reviewscontroller)
5. [Bang API Endpoints](#5-bang-api-endpoints)
6. [Vi du Request/Response](#6-vi-du-requestresponse)

---

## 1. Cau truc module

```
apps/api/src/modules/reviews/
├── reviews.module.ts
├── reviews.service.ts
├── reviews.controller.ts
├── dto/
│   ├── create-review.dto.ts
│   ├── update-review.dto.ts
│   ├── query-review.dto.ts
│   ├── moderate-review.dto.ts
│   └── vote-helpful.dto.ts
└── interfaces/
    └── product-stats.interface.ts
```

### Module Registration

```typescript
// reviews.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../../schemas/review.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
```

### ProductStats Interface

```typescript
// interfaces/product-stats.interface.ts
export interface ProductReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
```

---

## 2. DTOs

### CreateReviewDto

```typescript
// dto/create-review.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsMongoId,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  productId: string;

  @IsMongoId()
  orderId: string;

  @IsString()
  @IsOptional()
  orderItemSku?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(5, { message: 'Toi da 5 hinh anh cho moi danh gia' })
  images?: string[];
}
```

### UpdateReviewDto

```typescript
// dto/update-review.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class UpdateReviewDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(5, { message: 'Toi da 5 hinh anh cho moi danh gia' })
  images?: string[];
}
```

### QueryReviewDto

```typescript
// dto/query-review.dto.ts
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  sort?: string; // 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful'
}
```

### ModerateReviewDto

```typescript
// dto/moderate-review.dto.ts
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewStatus } from '@shared-types/enums';

export class ModerateReviewDto {
  @IsEnum(ReviewStatus, {
    message: 'Trang thai phai la: approved, rejected, hoac flagged',
  })
  status: ReviewStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  adminNote?: string;
}
```

### VoteHelpfulDto

```typescript
// dto/vote-helpful.dto.ts
import { IsBoolean } from 'class-validator';

export class VoteHelpfulDto {
  @IsBoolean()
  isHelpful: boolean;
}
```

---

## 3. ReviewsService

```typescript
// reviews.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Review, ReviewDocument } from '../../schemas/review.schema';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { VoteHelpfulDto } from './dto/vote-helpful.dto';
import { ProductReviewStats } from './interfaces/product-stats.interface';
import { ReviewStatus, OrderStatus } from '@shared-types/enums';
import { PAGINATION } from '@shared-types/constants';

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
  async create(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    // 1. Kiem tra san pham ton tai
    const product = await this.productModel.findOne({
      _id: dto.productId,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException(
        `San pham voi ID "${dto.productId}" khong ton tai`,
      );
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
        `Chi co the danh gia san pham khi don hang da giao thanh cong. `
        + `Trang thai hien tai: "${order.status}"`,
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
        `Ban da danh gia san pham nay trong don hang nay roi. `
        + `Moi san pham chi duoc danh gia 1 lan trong moi don hang.`,
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
    const {
      page = 1,
      limit = 10,
      rating,
      sort,
    } = query;

    // Chi hien thi review da duyet
    const filter: FilterQuery<Review> = {
      productId: new Types.ObjectId(productId),
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    };

    if (rating) {
      filter.rating = rating;
    }

    // Build sort
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
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
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
  async update(
    id: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException(`Danh gia voi ID "${id}" khong ton tai`);
    }

    // Kiem tra quyen so huu
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Ban khong co quyen cap nhat danh gia nay');
    }

    // Chi cho phep cap nhat khi con pending
    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException(
        `Chi co the cap nhat danh gia khi con o trang thai "pending". `
        + `Trang thai hien tai: "${review.status}"`,
      );
    }

    // Validate so luong hinh anh
    if (dto.images && dto.images.length > 5) {
      throw new BadRequestException('Toi da 5 hinh anh cho moi danh gia');
    }

    // Cap nhat cac truong
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
    const review = await this.reviewModel.findOne({
      _id: id,
      isDeleted: false,
    });

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
      averageRating: Math.round(result.averageRating * 10) / 10, // Lam tron 1 chu so thap phan
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

    // Khong cho tu vote cho danh gia cua minh
    if (review.userId.toString() === userId) {
      throw new BadRequestException(
        'Ban khong the vote cho danh gia cua chinh minh',
      );
    }

    // Kiem tra da vote chua
    const existingVoteIndex = review.helpfulVotes.findIndex(
      (v) => v.userId.toString() === userId,
    );

    if (existingVoteIndex !== -1) {
      const existingVote = review.helpfulVotes[existingVoteIndex];

      if (existingVote.isHelpful === dto.isHelpful) {
        // Vote giong -> xoa vote (toggle off)
        review.helpfulVotes.splice(existingVoteIndex, 1);

        if (dto.isHelpful) {
          review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
          review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
        }
      } else {
        // Vote khac -> doi vote
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
    const review = await this.reviewModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException(`Danh gia voi ID "${id}" khong ton tai`);
    }

    // Khong cho duyet review da bi xoa
    if (review.isDeleted) {
      throw new BadRequestException('Danh gia nay da bi xoa');
    }

    // Khong cho set lai ve pending
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

    const filter: FilterQuery<Review> = {
      status: ReviewStatus.PENDING,
      isDeleted: false,
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userId', 'fullName email avatar')
        .populate('productId', 'name slug images')
        .populate('orderId', 'orderCode')
        .sort({ createdAt: 1 }) // Cu nhat truoc (FIFO)
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

    const reviewedSet = new Set(
      reviewedOrderIds.map((r) => r.orderId.toString()),
    );

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
```

---

## 4. ReviewsController

```typescript
// reviews.controller.ts
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { VoteHelpfulDto } from './dto/vote-helpful.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@shared-types/enums';
import { Public } from '../auth/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================================
  // PUBLIC ENDPOINTS
  // ============================================================

  /**
   * GET /reviews/product/:productId
   * Lay danh gia cua san pham (chi hien thi review da duyet)
   */
  @Public()
  @Get('product/:productId')
  async findByProduct(
    @Param('productId') productId: string,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  /**
   * GET /reviews/product/:productId/stats
   * Lay thong ke danh gia cua san pham (average, distribution)
   */
  @Public()
  @Get('product/:productId/stats')
  async getProductStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  // ============================================================
  // CUSTOMER ENDPOINTS (JWT required)
  // ============================================================

  /**
   * GET /reviews/my-reviews
   * Lay danh sach danh gia cua user dang dang nhap
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-reviews')
  async getMyReviews(@Request() req: any) {
    return this.reviewsService.findByUser(req.user._id);
  }

  /**
   * GET /reviews/can-review/:productId
   * Kiem tra user co the danh gia san pham khong
   */
  @UseGuards(JwtAuthGuard)
  @Get('can-review/:productId')
  async canReview(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    return this.reviewsService.canReview(req.user._id, productId);
  }

  /**
   * POST /reviews
   * Tao danh gia moi (customer, phai co don hang da giao)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user._id, dto);
  }

  /**
   * PATCH /reviews/:id
   * Cap nhat danh gia (chi khi con pending, chi owner)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, req.user._id, dto);
  }

  /**
   * DELETE /reviews/:id
   * Xoa mem danh gia cua minh
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.delete(id, req.user._id);
  }

  /**
   * POST /reviews/:id/helpful
   * Vote huu ich/khong huu ich cho danh gia
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/helpful')
  async voteHelpful(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: VoteHelpfulDto,
  ) {
    return this.reviewsService.voteHelpful(id, req.user._id, dto);
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  /**
   * GET /reviews/pending
   * Lay danh sach danh gia cho duyet (admin/manager)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Get('pending')
  async getPendingReviews(@Query() query: QueryReviewDto) {
    return this.reviewsService.getPendingReviews(query);
  }

  /**
   * PATCH /reviews/:id/moderate
   * Duyet/tu choi/flag danh gia (admin/manager)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @Patch(':id/moderate')
  async moderate(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, req.user._id, dto);
  }
}
```

> **Luu y thu tu route:** Cac route static (`/reviews/pending`, `/reviews/my-reviews`, `/reviews/can-review/:productId`, `/reviews/product/:productId`) phai dat TRUOC cac route co param `:id` de NestJS phan biet dung.

---

## 5. Bang API Endpoints

| # | Method | Endpoint | Auth | Role | Mo ta |
|---|--------|----------|------|------|-------|
| 1 | `GET` | `/reviews/product/:productId` | Public | - | Danh gia cua san pham (chi approved) |
| 2 | `GET` | `/reviews/product/:productId/stats` | Public | - | Thong ke rating (average, distribution) |
| 3 | `GET` | `/reviews/my-reviews` | JWT | Customer | Danh gia cua toi |
| 4 | `GET` | `/reviews/can-review/:productId` | JWT | Customer | Kiem tra co the danh gia khong |
| 5 | `POST` | `/reviews` | JWT | Customer | Tao danh gia moi |
| 6 | `PATCH` | `/reviews/:id` | JWT | Customer | Cap nhat danh gia (chi khi pending) |
| 7 | `DELETE` | `/reviews/:id` | JWT | Customer | Xoa mem danh gia cua minh |
| 8 | `POST` | `/reviews/:id/helpful` | JWT | Customer | Vote huu ich/khong huu ich |
| 9 | `GET` | `/reviews/pending` | JWT | Admin, Manager, Staff | Danh gia cho duyet |
| 10 | `PATCH` | `/reviews/:id/moderate` | JWT | Admin, Manager, Staff | Duyet/tu choi/flag danh gia |

---

## 6. Vi du Request/Response

### 6.1. Kiem tra co the danh gia khong

**Request:**

```http
GET /reviews/can-review/665b2c3d4e5f6a7b8c9d0e12
Authorization: Bearer <customer_token>
```

**Response (200 OK) - Co the danh gia:**

```json
{
  "canReview": true,
  "eligibleOrders": [
    { "orderId": "665e6a7b8c9d0e1f2a3b4c56", "orderCode": "ORD-20260328-001" },
    { "orderId": "665f7b8c9d0e1f2a3b4c5d67", "orderCode": "ORD-20260401-003" }
  ]
}
```

**Response (200 OK) - Khong the danh gia:**

```json
{
  "canReview": false,
  "reason": "Ban da danh gia san pham nay trong tat ca cac don hang da giao"
}
```

---

### 6.2. Tao danh gia moi

**Request:**

```http
POST /reviews
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "productId": "665b2c3d4e5f6a7b8c9d0e12",
  "orderId": "665e6a7b8c9d0e1f2a3b4c56",
  "orderItemSku": "SF-C01-D01-A3F2",
  "rating": 5,
  "title": "Sofa chat luong tot, dung mau nhu hinh",
  "comment": "Minh mua sofa nay duoc 2 tuan. Chat vai rat mem va de lau chui. Mau xam dam rat dep, dung nhu hinh tren web. Giao hang nhanh, tho lap dat chuyen nghiep. Rat hai long!",
  "images": [
    "https://drive.google.com/file/d/review1/view",
    "https://drive.google.com/file/d/review2/view"
  ]
}
```

**Response (201 Created):**

```json
{
  "_id": "665g8c9d0e1f2a3b4c5d6e78",
  "productId": "665b2c3d4e5f6a7b8c9d0e12",
  "userId": "665c9d0e1f2a3b4c5d6e7f89",
  "orderId": "665e6a7b8c9d0e1f2a3b4c56",
  "orderItemSku": "SF-C01-D01-A3F2",
  "rating": 5,
  "title": "Sofa chat luong tot, dung mau nhu hinh",
  "comment": "Minh mua sofa nay duoc 2 tuan...",
  "images": [
    "https://drive.google.com/file/d/review1/view",
    "https://drive.google.com/file/d/review2/view"
  ],
  "status": "pending",
  "helpfulCount": 0,
  "unhelpfulCount": 0,
  "helpfulVotes": [],
  "adminNote": null,
  "moderatedBy": null,
  "moderatedAt": null,
  "isDeleted": false,
  "createdAt": "2026-04-02T10:30:00.000Z",
  "updatedAt": "2026-04-02T10:30:00.000Z"
}
```

---

### 6.3. Lay danh gia cua san pham

**Request:**

```http
GET /reviews/product/665b2c3d4e5f6a7b8c9d0e12?page=1&limit=5&sort=most_helpful
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "_id": "665g8c9d0e1f2a3b4c5d6e78",
      "productId": "665b2c3d4e5f6a7b8c9d0e12",
      "userId": {
        "_id": "665c9d0e1f2a3b4c5d6e7f89",
        "fullName": "Nguyen Van A",
        "avatar": "https://drive.google.com/file/d/avatar1/view"
      },
      "rating": 5,
      "title": "Sofa chat luong tot, dung mau nhu hinh",
      "comment": "Minh mua sofa nay duoc 2 tuan...",
      "images": [
        "https://drive.google.com/file/d/review1/view",
        "https://drive.google.com/file/d/review2/view"
      ],
      "helpfulCount": 12,
      "unhelpfulCount": 1,
      "createdAt": "2026-04-02T10:30:00.000Z"
    },
    {
      "_id": "665h9d0e1f2a3b4c5d6e7f89",
      "userId": {
        "_id": "665d0e1f2a3b4c5d6e7f8a90",
        "fullName": "Tran Thi B",
        "avatar": null
      },
      "rating": 4,
      "title": "Sofa dep nhung giao hoi lau",
      "comment": "Chat luong sofa 10 diem. Nhung giao hang mat 5 ngay thay vi 3 ngay nhu cam ket.",
      "images": [],
      "helpfulCount": 5,
      "unhelpfulCount": 0,
      "createdAt": "2026-03-28T14:20:00.000Z"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 5,
  "totalPages": 5
}
```

---

### 6.4. Thong ke danh gia san pham

**Request:**

```http
GET /reviews/product/665b2c3d4e5f6a7b8c9d0e12/stats
```

**Response (200 OK):**

```json
{
  "averageRating": 4.3,
  "totalReviews": 24,
  "ratingDistribution": {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 8,
    "5": 10
  }
}
```

---

### 6.5. Vote huu ich

**Request:**

```http
POST /reviews/665g8c9d0e1f2a3b4c5d6e78/helpful
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "isHelpful": true
}
```

**Response (200 OK):**

```json
{
  "_id": "665g8c9d0e1f2a3b4c5d6e78",
  "helpfulCount": 13,
  "unhelpfulCount": 1,
  "helpfulVotes": [
    { "userId": "665c9d0e1f2a3b4c5d6e7f89", "isHelpful": true },
    { "userId": "665e1f2a3b4c5d6e7f8a9b01", "isHelpful": true }
  ]
}
```

> **Logic vote:** Neu user da vote `isHelpful: true` va gui lai `isHelpful: true` -> toggle off (xoa vote). Neu gui `isHelpful: false` -> doi thanh unhelpful.

---

### 6.6. Admin duyet danh gia

**Request:**

```http
PATCH /reviews/665g8c9d0e1f2a3b4c5d6e78/moderate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "adminNote": "Danh gia hop le, co hinh anh thuc te"
}
```

**Response (200 OK):**

```json
{
  "_id": "665g8c9d0e1f2a3b4c5d6e78",
  "status": "approved",
  "adminNote": "Danh gia hop le, co hinh anh thuc te",
  "moderatedBy": "665a0b1c2d3e4f5a6b7c8d90",
  "moderatedAt": "2026-04-02T11:00:00.000Z",
  "rating": 5,
  "title": "Sofa chat luong tot, dung mau nhu hinh"
}
```

---

### 6.7. Admin tu choi danh gia

**Request:**

```http
PATCH /reviews/665i0e1f2a3b4c5d6e7f8a90/moderate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "rejected",
  "adminNote": "Noi dung khong lien quan den san pham, co spam link ngoai"
}
```

**Response (200 OK):**

```json
{
  "_id": "665i0e1f2a3b4c5d6e7f8a90",
  "status": "rejected",
  "adminNote": "Noi dung khong lien quan den san pham, co spam link ngoai",
  "moderatedBy": "665a0b1c2d3e4f5a6b7c8d90",
  "moderatedAt": "2026-04-02T11:05:00.000Z"
}
```

---

### 6.8. Lay danh gia cho duyet (Admin)

**Request:**

```http
GET /reviews/pending?page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "_id": "665j1f2a3b4c5d6e7f8a9b01",
      "userId": {
        "_id": "665k2a3b4c5d6e7f8a9b0c12",
        "fullName": "Le Van C",
        "email": "levanc@gmail.com",
        "avatar": null
      },
      "productId": {
        "_id": "665b2c3d4e5f6a7b8c9d0e12",
        "name": "Sofa Goc Chu L Nordic",
        "slug": "sofa-goc-chu-l-nordic",
        "images": ["https://drive.google.com/file/d/xxx1/view"]
      },
      "orderId": {
        "_id": "665l3b4c5d6e7f8a9b0c1d23",
        "orderCode": "ORD-20260330-007"
      },
      "rating": 3,
      "title": "Tam duoc",
      "comment": "Sofa cung duoc nhung mau hoi khac voi tren web mot chut.",
      "images": ["https://drive.google.com/file/d/review3/view"],
      "status": "pending",
      "createdAt": "2026-04-01T16:45:00.000Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 6.9. Lay danh gia cua toi

**Request:**

```http
GET /reviews/my-reviews
Authorization: Bearer <customer_token>
```

**Response (200 OK):**

```json
[
  {
    "_id": "665g8c9d0e1f2a3b4c5d6e78",
    "productId": {
      "_id": "665b2c3d4e5f6a7b8c9d0e12",
      "name": "Sofa Goc Chu L Nordic",
      "slug": "sofa-goc-chu-l-nordic",
      "images": ["https://drive.google.com/file/d/xxx1/view"]
    },
    "orderId": {
      "_id": "665e6a7b8c9d0e1f2a3b4c56",
      "orderCode": "ORD-20260328-001"
    },
    "rating": 5,
    "title": "Sofa chat luong tot, dung mau nhu hinh",
    "status": "approved",
    "createdAt": "2026-04-02T10:30:00.000Z"
  },
  {
    "_id": "665m4c5d6e7f8a9b0c1d2e34",
    "productId": {
      "_id": "665c3d4e5f6a7b8c9d0e1f23",
      "name": "Ban An Go Oc Cho 6 Ghe",
      "slug": "ban-an-go-oc-cho-6-ghe",
      "images": ["https://drive.google.com/file/d/banan1/view"]
    },
    "orderId": {
      "_id": "665e6a7b8c9d0e1f2a3b4c56",
      "orderCode": "ORD-20260328-001"
    },
    "rating": 4,
    "title": "Ban an dep, go that",
    "status": "pending",
    "createdAt": "2026-04-02T10:35:00.000Z"
  }
]
```

---

### 6.10. Loi thuong gap

**Chua co don hang da giao (400):**

```json
{
  "statusCode": 400,
  "message": "Chi co the danh gia san pham khi don hang da giao thanh cong. Trang thai hien tai: \"confirmed\"",
  "error": "Bad Request"
}
```

**Da danh gia roi (400):**

```json
{
  "statusCode": 400,
  "message": "Ban da danh gia san pham nay trong don hang nay roi. Moi san pham chi duoc danh gia 1 lan trong moi don hang.",
  "error": "Bad Request"
}
```

**Khong phai chu so huu (403):**

```json
{
  "statusCode": 403,
  "message": "Ban khong co quyen cap nhat danh gia nay",
  "error": "Forbidden"
}
```

**Review khong con pending (400):**

```json
{
  "statusCode": 400,
  "message": "Chi co the cap nhat danh gia khi con o trang thai \"pending\". Trang thai hien tai: \"approved\"",
  "error": "Bad Request"
}
```

**Tu vote cho minh (400):**

```json
{
  "statusCode": 400,
  "message": "Ban khong the vote cho danh gia cua chinh minh",
  "error": "Bad Request"
}
```

---

## Luu do xu ly danh gia (Review Flow)

```
Khach hang mua san pham
        |
        v
Don hang duoc giao thanh cong (status = delivered)
        |
        v
Khach vao trang san pham -> "Viet danh gia"
        |
        v
Frontend goi: GET /reviews/can-review/:productId
        |
    canReview?
    /        \
  true      false -> Hien thi ly do (da review / chua mua)
   |
   v
Khach dien form: rating, title, comment, images
        |
        v
Frontend goi: POST /reviews
        |
        v
Review duoc tao voi status = "pending"
        |
        v
Admin thay trong: GET /reviews/pending
        |
        v
Admin review noi dung -> PATCH /reviews/:id/moderate
        |
    /       |        \
approved  rejected  flagged
   |         |         |
   v         v         v
Hien thi   An danh   Can xem
tren web    gia       xet lai
```

---

> **Tong ket:**
> - Reviews module bao gom 10 endpoints phu vu 3 nhom: public, customer, admin
> - Validation nghiem ngat: phai co don hang da giao, chi review 1 lan/san pham/don hang
> - Moderate flow: pending -> approved/rejected/flagged (boi admin)
> - Vote helpful/unhelpful voi toggle logic (vote lai -> xoa vote)
> - Thong ke bang MongoDB aggregation pipeline (average, distribution)
> - canReview endpoint giup frontend biet truoc user co duoc phep review khong
