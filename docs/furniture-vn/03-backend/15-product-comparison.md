# PRODUCT COMPARISON

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Tinh nang so sanh san pham (toi da 4 san pham)
> Lightweight module - co the tich hop vao ProductsModule hoac tach rieng
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Cau truc module](#1-cau-truc-module)
2. [Interfaces](#2-interfaces)
3. [ComparisonService](#3-comparisonservice)
4. [Controller endpoint](#4-controller-endpoint)
5. [Bang API Endpoints](#5-bang-api-endpoints)
6. [Vi du Request/Response](#6-vi-du-requestresponse)

---

## 1. Cau truc module

Tinh nang nay duoc tich hop truc tiep vao `ProductsModule` (khong can module rieng).

```
apps/api/src/modules/products/
├── products.module.ts         # (da co)
├── products.service.ts        # (da co)
├── products.controller.ts     # Them endpoint /products/compare
├── comparison.service.ts      # NEW
├── dto/
│   └── compare-products.dto.ts  # NEW
└── interfaces/
    └── comparison-result.interface.ts  # NEW
```

### Dang ky trong ProductsModule

```typescript
// products.module.ts - them ComparisonService vao providers
import { ComparisonService } from './comparison.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ComparisonService],
  exports: [ProductsService, ComparisonService],
})
export class ProductsModule {}
```

---

## 2. Interfaces

```typescript
// interfaces/comparison-result.interface.ts
export interface ComparisonProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  basePrice: number;
  priceRange: { min: number; max: number };
  brand: string;
  material: string;
  origin: string;
  colors: { name: string; hexCode: string }[];
  dimensions: { label: string; width: number; depth: number; height: number }[];
  specifications: Record<string, string>;
  rating: { average: number; count: number };
  totalSold: number;
}

export interface ComparisonResult {
  products: ComparisonProduct[];
  comparisonFields: string[]; // Cac truong khac nhau giua cac san pham
}
```

---

## 3. ComparisonService

```typescript
// comparison.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../schemas/product.schema';
import { ComparisonResult, ComparisonProduct } from './interfaces/comparison-result.interface';

@Injectable()
export class ComparisonService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * So sanh toi da 4 san pham
   * - Validate tat ca san pham ton tai va dang active
   * - Tra ve du lieu da normalize de hien thi bang so sanh
   * - Tinh toan cac truong khac nhau giua cac san pham
   */
  async compare(productIds: string[]): Promise<ComparisonResult> {
    // Validate so luong
    if (!productIds || productIds.length < 2) {
      throw new BadRequestException('Can it nhat 2 san pham de so sanh');
    }
    if (productIds.length > 4) {
      throw new BadRequestException('Chi so sanh toi da 4 san pham');
    }

    // Validate khong trung lap
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length !== productIds.length) {
      throw new BadRequestException('Khong duoc trung san pham');
    }

    // Query tat ca san pham
    const products = await this.productModel
      .find({
        _id: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      })
      .populate('category', 'name slug')
      .lean();

    if (products.length !== uniqueIds.length) {
      const foundIds = products.map((p) => p._id.toString());
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Khong tim thay san pham: ${missingIds.join(', ')}`,
      );
    }

    // Normalize du lieu
    const normalizedProducts: ComparisonProduct[] = products.map((p: any) => {
      const prices = p.variants.map((v: any) => v.price);
      return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        image: p.images?.[0] || '',
        basePrice: p.basePrice,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : p.basePrice,
          max: prices.length > 0 ? Math.max(...prices) : p.basePrice,
        },
        brand: p.brand || '',
        material: p.material || '',
        origin: p.origin || '',
        colors: p.colors || [],
        dimensions: p.dimensions || [],
        specifications: p.specifications || {},
        rating: {
          average: p.rating?.average || 0,
          count: p.rating?.count || 0,
        },
        totalSold: p.totalSold || 0,
      };
    });

    // Xac dinh cac truong khac nhau
    const comparisonFields = this.findDifferingFields(normalizedProducts);

    return { products: normalizedProducts, comparisonFields };
  }

  /**
   * Lay cac truong so sanh phu hop cho 1 danh muc
   */
  async getComparisonFields(categoryId: string): Promise<string[]> {
    // Lay 1 vai san pham cua danh muc de xac dinh truong co san
    const sampleProducts = await this.productModel
      .find({ category: new Types.ObjectId(categoryId), isActive: true })
      .limit(5)
      .select('specifications material origin brand')
      .lean();

    const fieldsSet = new Set<string>(['brand', 'material', 'origin', 'basePrice']);

    sampleProducts.forEach((p: any) => {
      if (p.specifications) {
        Object.keys(p.specifications).forEach((key) => fieldsSet.add(key));
      }
    });

    return Array.from(fieldsSet);
  }

  /**
   * Tim cac truong co gia tri khac nhau giua cac san pham
   */
  private findDifferingFields(products: ComparisonProduct[]): string[] {
    const diffFields: string[] = [];
    const fields = ['basePrice', 'brand', 'material', 'origin', 'totalSold'];

    for (const field of fields) {
      const values = products.map((p) => (p as any)[field]);
      if (new Set(values.map(String)).size > 1) {
        diffFields.push(field);
      }
    }

    // Check specifications
    const allSpecKeys = new Set<string>();
    products.forEach((p) => Object.keys(p.specifications).forEach((k) => allSpecKeys.add(k)));

    for (const key of allSpecKeys) {
      const values = products.map((p) => p.specifications[key] || '');
      if (new Set(values).size > 1) {
        diffFields.push(`specifications.${key}`);
      }
    }

    return diffFields;
  }
}
```

---

## 4. Controller endpoint

```typescript
// Them vao products.controller.ts

import { ComparisonService } from './comparison.service';

// Trong constructor:
// constructor(
//   private productsService: ProductsService,
//   private comparisonService: ComparisonService,
// ) {}

/**
 * POST /products/compare
 * So sanh san pham - public, khong can dang nhap
 */
@Post('compare')
async compare(@Body() body: CompareProductsDto) {
  return this.comparisonService.compare(body.productIds);
}
```

### CompareProductsDto

```typescript
// dto/compare-products.dto.ts
import { IsArray, ArrayMinSize, ArrayMaxSize, IsMongoId } from 'class-validator';

export class CompareProductsDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Can it nhat 2 san pham' })
  @ArrayMaxSize(4, { message: 'Toi da 4 san pham' })
  @IsMongoId({ each: true })
  productIds: string[];
}
```

---

## 5. Bang API Endpoints

| Method | Endpoint | Auth | Mo ta |
|--------|----------|------|-------|
| POST | `/products/compare` | Public | So sanh 2-4 san pham |

---

## 6. Vi du Request/Response

### POST /products/compare

**Request:**
```http
POST /api/products/compare
Content-Type: application/json

{
  "productIds": [
    "661a1b2c3d4e5f6a7b8c9d01",
    "661a1b2c3d4e5f6a7b8c9d02",
    "661a1b2c3d4e5f6a7b8c9d03"
  ]
}
```

**Response (200):**
```json
{
  "products": [
    {
      "id": "661a1b2c3d4e5f6a7b8c9d01",
      "name": "Sofa goc chu L vai boc premium",
      "slug": "sofa-goc-chu-l-vai-boc-premium",
      "image": "https://cdn.furniturevn.com/products/sofa-l-01.jpg",
      "basePrice": 15500000,
      "priceRange": { "min": 15500000, "max": 18900000 },
      "brand": "FurnitureVN",
      "material": "Khung go tu nhien, boc vai Bỉ",
      "origin": "Viet Nam",
      "colors": [
        { "name": "Xam", "hexCode": "#808080" },
        { "name": "Xanh duong", "hexCode": "#2563EB" }
      ],
      "dimensions": [
        { "label": "250x160x85cm", "width": 250, "depth": 160, "height": 85 }
      ],
      "specifications": {
        "Trong luong": "65kg",
        "Suc chua": "4-5 nguoi",
        "Bao hanh": "24 thang"
      },
      "rating": { "average": 4.6, "count": 28 },
      "totalSold": 156
    },
    {
      "id": "661a1b2c3d4e5f6a7b8c9d02",
      "name": "Sofa bang 3 cho ngoi da that",
      "slug": "sofa-bang-3-cho-ngoi-da-that",
      "image": "https://cdn.furniturevn.com/products/sofa-3-01.jpg",
      "basePrice": 22000000,
      "priceRange": { "min": 22000000, "max": 25000000 },
      "brand": "NoiThatXinh",
      "material": "Khung inox, boc da bo that Y",
      "origin": "Y (nhap khau)",
      "colors": [
        { "name": "Den", "hexCode": "#000000" },
        { "name": "Nau", "hexCode": "#8B4513" }
      ],
      "dimensions": [
        { "label": "220x90x80cm", "width": 220, "depth": 90, "height": 80 }
      ],
      "specifications": {
        "Trong luong": "55kg",
        "Suc chua": "3 nguoi",
        "Bao hanh": "36 thang"
      },
      "rating": { "average": 4.8, "count": 42 },
      "totalSold": 89
    },
    {
      "id": "661a1b2c3d4e5f6a7b8c9d03",
      "name": "Sofa don minimalist go soi",
      "slug": "sofa-don-minimalist-go-soi",
      "image": "https://cdn.furniturevn.com/products/sofa-don-01.jpg",
      "basePrice": 8500000,
      "priceRange": { "min": 8500000, "max": 9200000 },
      "brand": "FurnitureVN",
      "material": "Go soi tu nhien, nem mut D40",
      "origin": "Viet Nam",
      "colors": [
        { "name": "Kem", "hexCode": "#FFFDD0" }
      ],
      "dimensions": [
        { "label": "90x80x75cm", "width": 90, "depth": 80, "height": 75 }
      ],
      "specifications": {
        "Trong luong": "25kg",
        "Suc chua": "1 nguoi",
        "Bao hanh": "12 thang"
      },
      "rating": { "average": 4.3, "count": 15 },
      "totalSold": 210
    }
  ],
  "comparisonFields": [
    "basePrice",
    "brand",
    "material",
    "origin",
    "totalSold",
    "specifications.Trong luong",
    "specifications.Suc chua",
    "specifications.Bao hanh"
  ]
}
```

### Loi: Thieu san pham

**Request:**
```http
POST /api/products/compare
Content-Type: application/json

{
  "productIds": ["661a1b2c3d4e5f6a7b8c9d01"]
}
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": ["Can it nhat 2 san pham"],
  "error": "Bad Request"
}
```

### Loi: Qua 4 san pham

**Request:**
```json
{
  "productIds": ["id1", "id2", "id3", "id4", "id5"]
}
```

**Response (400):**
```json
{
  "statusCode": 400,
  "message": ["Toi da 4 san pham"],
  "error": "Bad Request"
}
```
