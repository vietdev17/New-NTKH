# WISHLIST MODULE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module quan ly danh sach yeu thich cua khach hang
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [DTOs](#3-dtos)
4. [Wishlist Service](#4-wishlist-service)
5. [Wishlist Controller](#5-wishlist-controller)
6. [Bang API Endpoints](#6-bang-api-endpoints)
7. [Vi du Request/Response](#7-vi-du-requestresponse)

---

## 1. Tong quan

Module Wishlist cho phep khach hang:
- Them/xoa san pham vao danh sach yeu thich
- Xem danh sach yeu thich voi phan trang va thong tin san pham day du
- Kiem tra nhanh san pham da nam trong wishlist chua (cho trang listing)
- Kiem tra nhieu san pham cung luc (batch check cho product listing page)
- Xoa toan bo wishlist
- Chuyen san pham tu wishlist sang gio hang (frontend quan ly cart)

**Schema su dung:** Wishlist (xem `02-database/01-schemas.md` muc 11)

**Dac diem:**
- Moi user chi co the them 1 san pham 1 lan (unique index: userId + productId)
- Populate thong tin san pham khi lay danh sach
- Chi customer da dang nhap moi su dung duoc

---

## 2. Cau truc module

```
src/modules/wishlist/
  ├── wishlist.module.ts
  ├── wishlist.service.ts
  ├── wishlist.controller.ts
  └── dto/
      ├── add-to-wishlist.dto.ts
      ├── query-wishlist.dto.ts
      └── check-multiple.dto.ts
```

### wishlist.module.ts

```typescript
// ============================================================
// modules/wishlist/wishlist.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wishlist, WishlistSchema } from '../../schemas/wishlist.schema';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
```

---

## 3. DTOs

### add-to-wishlist.dto.ts

```typescript
// ============================================================
// modules/wishlist/dto/add-to-wishlist.dto.ts
// ============================================================
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class AddToWishlistDto {
  @IsNotEmpty({ message: 'productId khong duoc de trong' })
  @IsMongoId({ message: 'productId phai la ObjectId hop le' })
  productId: string;
}
```

### query-wishlist.dto.ts

```typescript
// ============================================================
// modules/wishlist/dto/query-wishlist.dto.ts
// ============================================================
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryWishlistDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
```

### check-multiple.dto.ts

```typescript
// ============================================================
// modules/wishlist/dto/check-multiple.dto.ts
// ============================================================
import { IsArray, IsMongoId, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CheckMultipleDto {
  @IsArray({ message: 'productIds phai la mang' })
  @IsMongoId({ each: true, message: 'Moi phan tu phai la ObjectId hop le' })
  @ArrayMinSize(1, { message: 'Phai co it nhat 1 productId' })
  @ArrayMaxSize(50, { message: 'Toi da 50 productIds moi lan kiem tra' })
  productIds: string[];
}
```

---

## 4. Wishlist Service

```typescript
// ============================================================
// modules/wishlist/wishlist.service.ts
// ============================================================
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from '../../schemas/wishlist.schema';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
import { CheckMultipleDto } from './dto/check-multiple.dto';

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

    // Kiem tra trung lap (unique index se bat nhung ta check truoc cho message ro rang)
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
      throw new NotFoundException(
        'San pham khong ton tai trong danh sach yeu thich',
      );
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
      items,
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
  // Tra ve map { productId: boolean } - dung cho trang listing
  async checkMultiple(
    userId: string,
    productIds: string[],
  ): Promise<Record<string, boolean>> {
    const userObjId = new Types.ObjectId(userId);
    const productObjIds = productIds.map((id) => new Types.ObjectId(id));

    const wishlistItems = await this.wishlistModel
      .find({
        userId: userObjId,
        productId: { $in: productObjIds },
      })
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
  // Xoa khoi wishlist - gio hang duoc quan ly tren frontend (localStorage/state)
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
```

---

## 5. Wishlist Controller

```typescript
// ============================================================
// modules/wishlist/wishlist.controller.ts
// ============================================================
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
import { CheckMultipleDto } from './dto/check-multiple.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';

@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  // ===== LAY DANH SACH YEU THICH =====
  @Get()
  async getWishlist(@Request() req, @Query() query: QueryWishlistDto) {
    const result = await this.wishlistService.getWishlist(req.user._id, query);
    return {
      success: true,
      message: 'Lay danh sach yeu thich thanh cong',
      data: result,
    };
  }

  // ===== DEM SO LUONG =====
  @Get('count')
  async getCount(@Request() req) {
    const count = await this.wishlistService.getCount(req.user._id);
    return {
      success: true,
      data: { count },
    };
  }

  // ===== KIEM TRA 1 SAN PHAM =====
  @Get('check/:productId')
  async checkProduct(@Request() req, @Param('productId') productId: string) {
    const isInWishlist = await this.wishlistService.isInWishlist(
      req.user._id,
      productId,
    );
    return {
      success: true,
      data: { productId, isInWishlist },
    };
  }

  // ===== KIEM TRA NHIEU SAN PHAM =====
  @Post('check-multiple')
  @HttpCode(HttpStatus.OK)
  async checkMultiple(@Request() req, @Body() dto: CheckMultipleDto) {
    const result = await this.wishlistService.checkMultiple(
      req.user._id,
      dto.productIds,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ===== THEM VAO WISHLIST =====
  @Post()
  async addToWishlist(@Request() req, @Body() dto: AddToWishlistDto) {
    const item = await this.wishlistService.add(req.user._id, dto);
    return {
      success: true,
      message: 'Da them vao danh sach yeu thich',
      data: item,
    };
  }

  // ===== XOA 1 SAN PHAM =====
  @Delete(':productId')
  async removeFromWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    await this.wishlistService.remove(req.user._id, productId);
    return {
      success: true,
      message: 'Da xoa khoi danh sach yeu thich',
    };
  }

  // ===== XOA TOAN BO WISHLIST =====
  @Delete()
  async clearWishlist(@Request() req) {
    const result = await this.wishlistService.clear(req.user._id);
    return {
      success: true,
      message: 'Da xoa toan bo danh sach yeu thich',
      data: result,
    };
  }
}
```

---

## 6. Bang API Endpoints

| # | Method   | Endpoint                    | Auth          | Mo ta                              |
|---|----------|-----------------------------|---------------|------------------------------------|
| 1 | `GET`    | `/wishlist`                 | Customer JWT  | Lay danh sach yeu thich (phan trang) |
| 2 | `GET`    | `/wishlist/count`           | Customer JWT  | Dem so luong san pham trong wishlist |
| 3 | `GET`    | `/wishlist/check/:productId`| Customer JWT  | Kiem tra 1 san pham co trong wishlist |
| 4 | `POST`   | `/wishlist/check-multiple`  | Customer JWT  | Kiem tra nhieu san pham cung luc    |
| 5 | `POST`   | `/wishlist`                 | Customer JWT  | Them san pham vao wishlist          |
| 6 | `DELETE` | `/wishlist/:productId`      | Customer JWT  | Xoa 1 san pham khoi wishlist        |
| 7 | `DELETE` | `/wishlist`                 | Customer JWT  | Xoa toan bo wishlist                |

---

## 7. Vi du Request/Response

### 7.1. Them san pham vao wishlist

**Request:**

```http
POST /wishlist
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "productId": "6615a2b3c4d5e6f7a8b9c0d1"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Da them vao danh sach yeu thich",
  "data": {
    "_id": "6615b4c5d6e7f8a9b0c1d2e3",
    "userId": "6615a1a2b3c4d5e6f7a8b9c0",
    "productId": "6615a2b3c4d5e6f7a8b9c0d1",
    "addedAt": "2026-04-02T08:30:00.000Z",
    "createdAt": "2026-04-02T08:30:00.000Z",
    "updatedAt": "2026-04-02T08:30:00.000Z"
  }
}
```

**Response (409 Conflict - da ton tai):**

```json
{
  "statusCode": 409,
  "message": "San pham da co trong danh sach yeu thich",
  "error": "Conflict"
}
```

---

### 7.2. Lay danh sach yeu thich

**Request:**

```http
GET /wishlist?page=1&limit=10
Authorization: Bearer <customer_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lay danh sach yeu thich thanh cong",
  "data": {
    "items": [
      {
        "_id": "6615b4c5d6e7f8a9b0c1d2e3",
        "userId": "6615a1a2b3c4d5e6f7a8b9c0",
        "productId": {
          "_id": "6615a2b3c4d5e6f7a8b9c0d1",
          "name": "Sofa goc chu L vai boc cao cap",
          "slug": "sofa-goc-chu-l-vai-boc-cao-cap",
          "images": [
            "https://drive.google.com/file/sofa-l-1.jpg",
            "https://drive.google.com/file/sofa-l-2.jpg"
          ],
          "basePrice": 15900000,
          "status": "active"
        },
        "addedAt": "2026-04-02T08:30:00.000Z"
      },
      {
        "_id": "6615b4c5d6e7f8a9b0c1d2e4",
        "userId": "6615a1a2b3c4d5e6f7a8b9c0",
        "productId": {
          "_id": "6615a2b3c4d5e6f7a8b9c0d2",
          "name": "Ban an go oc cho 6 ghe",
          "slug": "ban-an-go-oc-cho-6-ghe",
          "images": [
            "https://drive.google.com/file/ban-an-1.jpg"
          ],
          "basePrice": 12500000,
          "status": "active"
        },
        "addedAt": "2026-04-01T15:20:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 7.3. Kiem tra 1 san pham

**Request:**

```http
GET /wishlist/check/6615a2b3c4d5e6f7a8b9c0d1
Authorization: Bearer <customer_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "productId": "6615a2b3c4d5e6f7a8b9c0d1",
    "isInWishlist": true
  }
}
```

---

### 7.4. Kiem tra nhieu san pham (batch)

**Request:**

```http
POST /wishlist/check-multiple
Authorization: Bearer <customer_jwt_token>
Content-Type: application/json

{
  "productIds": [
    "6615a2b3c4d5e6f7a8b9c0d1",
    "6615a2b3c4d5e6f7a8b9c0d2",
    "6615a2b3c4d5e6f7a8b9c0d3",
    "6615a2b3c4d5e6f7a8b9c0d4"
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "6615a2b3c4d5e6f7a8b9c0d1": true,
    "6615a2b3c4d5e6f7a8b9c0d2": true,
    "6615a2b3c4d5e6f7a8b9c0d3": false,
    "6615a2b3c4d5e6f7a8b9c0d4": false
  }
}
```

---

### 7.5. Dem so luong wishlist

**Request:**

```http
GET /wishlist/count
Authorization: Bearer <customer_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### 7.6. Xoa 1 san pham

**Request:**

```http
DELETE /wishlist/6615a2b3c4d5e6f7a8b9c0d1
Authorization: Bearer <customer_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da xoa khoi danh sach yeu thich"
}
```

---

### 7.7. Xoa toan bo wishlist

**Request:**

```http
DELETE /wishlist
Authorization: Bearer <customer_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Da xoa toan bo danh sach yeu thich",
  "data": {
    "deletedCount": 5
  }
}
```

---

> **Ghi chu:**
> - Tat ca endpoint deu yeu cau Customer JWT (header `Authorization: Bearer <token>`)
> - Endpoint `check-multiple` su dung POST thay vi GET de truyen mang productIds trong body (tranh URL qua dai)
> - `moveToCart` khong co endpoint rieng vi gio hang duoc quan ly tren frontend. Khi can, frontend goi `DELETE /wishlist/:productId` roi tu them vao cart state.
> - Khi san pham bi xoa (soft delete) hoac het hang, no van nam trong wishlist nhung se co `status: 'inactive'` hoac `status: 'out_of_stock'` khi populate
