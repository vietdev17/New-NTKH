# DATABASE SCHEMAS - MongoDB/Mongoose

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Toan bo MongoDB schemas voi Mongoose/NestJS decorators
> Phien ban: 2.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Enums va Constants](#1-enums-va-constants)
2. [User Schema](#2-user-schema)
3. [Category Schema](#3-category-schema)
4. [Product Schema](#4-product-schema)
5. [Order Schema](#5-order-schema)
6. [ShipperLocation Schema](#6-shipperlocation-schema)
7. [Shift Schema](#7-shift-schema)
8. [Coupon Schema](#8-coupon-schema)
9. [CouponUsage Schema](#9-couponusage-schema)
10. [Review Schema](#10-review-schema)
11. [Wishlist Schema](#11-wishlist-schema)
12. [Return Schema](#12-return-schema)
13. [Notification Schema](#13-notification-schema)
14. [UploadedFile Schema](#14-uploadedfile-schema)
15. [Entity Relationship Diagram](#15-entity-relationship-diagram)
16. [Index Summary Table](#16-index-summary-table)

---

## 1. Enums va Constants

```typescript
// ============================================================
// enums/user-role.enum.ts
// ============================================================
export enum UserRole {
  CUSTOMER = 'customer',
  STAFF = 'staff',
  SHIPPER = 'shipper',
  ADMIN = 'admin',
}

// ============================================================
// enums/shipper-status.enum.ts
// ============================================================
export enum ShipperStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

// ============================================================
// enums/order-status.enum.ts
// ============================================================
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

// ============================================================
// enums/payment-method.enum.ts
// ============================================================
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod',
}

// ============================================================
// enums/payment-status.enum.ts
// ============================================================
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// ============================================================
// enums/product-status.enum.ts
// ============================================================
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

// ============================================================
// enums/discount-type.enum.ts
// ============================================================
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

// ============================================================
// enums/coupon-scope.enum.ts
// ============================================================
export enum CouponScope {
  ALL = 'all',
  CATEGORY = 'category',
  PRODUCT = 'product',
}

// ============================================================
// enums/review-status.enum.ts
// ============================================================
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ============================================================
// enums/return-reason.enum.ts
// ============================================================
export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DAMAGED_IN_SHIPPING = 'damaged_in_shipping',
  OTHER = 'other',
}

// ============================================================
// enums/return-status.enum.ts
// ============================================================
export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}

// ============================================================
// enums/notification-type.enum.ts
// ============================================================
export enum NotificationType {
  ORDER_STATUS = 'order_status',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  REVIEW_REPLY = 'review_reply',
  RETURN_STATUS = 'return_status',
  SHIPPER_ASSIGNED = 'shipper_assigned',
}

// ============================================================
// enums/upload-category.enum.ts
// ============================================================
export enum UploadCategory {
  PRODUCT = 'product',
  AVATAR = 'avatar',
  REVIEW = 'review',
  RETURN = 'return',
  DELIVERY_PROOF = 'delivery_proof',
  OTHER = 'other',
}
```

---

## 2. User Schema

> **[FIXED]** Them truong `status?: ShipperStatus` cho shipper - truoc day bi thieu gay loi
> khi cap nhat trang thai shipper.
> Them `resetPasswordToken` va `resetPasswordExpires` cho chuc nang quen mat khau.

```typescript
// ============================================================
// schemas/user.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { ShipperStatus } from '../enums/shipper-status.enum';

export type UserDocument = HydratedDocument<User>;

// ----- Sub-schema: Address (embedded) -----
export class Address {
  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, required: true })
  ward: string;

  @Prop({ type: String, required: true })
  district: string;

  @Prop({ type: String, required: true })
  province: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

// ----- Main schema: User -----
@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  fullName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  email: string;

  @Prop({ type: String, select: false, minlength: 6 })
  password: string;

  @Prop({
    type: String,
    trim: true,
    match: /^(0|\+84)[0-9]{9}$/,
  })
  phone: string;

  @Prop({ type: String, default: null })
  avatar: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.CUSTOMER,
    index: true,
  })
  role: UserRole;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date;

  // ----- Google OAuth -----
  @Prop({ type: Boolean, default: false })
  isGoogleAuth: boolean;

  @Prop({ type: String, default: null })
  googleId: string;

  // ----- JWT Refresh Token -----
  @Prop({ type: String, select: false, default: null })
  refreshToken: string;

  // ----- Password Reset -----
  @Prop({ type: String, select: false, default: null })
  resetPasswordToken: string;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date;

  // ----- Addresses (embedded array) -----
  @Prop({
    type: [
      {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        ward: { type: String, required: true },
        district: { type: String, required: true },
        province: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  addresses: Address[];

  // ----- Loyalty -----
  @Prop({ type: Number, default: 0, min: 0 })
  loyaltyPoints: number;

  // ----- Staff-only -----
  @Prop({ type: String, default: null })
  staffCode: string;

  // ----- Shipper-only -----
  @Prop({ type: String, default: null })
  vehicleType: string;

  @Prop({ type: String, default: null })
  licensePlate: string;

  /**
   * [FIXED] Truong nay truoc day bi thieu trong schema.
   * Khi shipper cap nhat trang thai (available/busy/offline),
   * he thong khong luu duoc vi khong co truong nay.
   * Chi ap dung cho user co role = 'shipper'.
   */
  @Prop({
    type: String,
    enum: ShipperStatus,
    default: null,
  })
  status: ShipperStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ----- Indexes -----
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isDeleted: 1 });
```

---

## 3. Category Schema

```typescript
// ============================================================
// schemas/category.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  slug: string;

  @Prop({ type: String, default: null, maxlength: 1000 })
  description: string;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true,
  })
  parentId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isCombo: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// ----- Indexes -----
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isCombo: 1 });
```

---

## 4. Product Schema

> Schema phuc tap nhat trong he thong.
> Ho tro bien the san pham theo **mau sac** va **kich thuoc**.
> Moi to hop mau + kich thuoc tao thanh 1 variant voi SKU, gia, ton kho rieng.

```typescript
// ============================================================
// schemas/product.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductStatus } from '../enums/product-status.enum';

export type ProductDocument = HydratedDocument<Product>;

// ----- Sub-schema: ProductColor -----
export class ProductColor {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ })
  hexCode: string;

  @Prop({ type: String, default: null })
  colorFamily: string;

  @Prop({ type: Number, default: 0 })
  priceModifier: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Boolean, default: true })
  available: boolean;
}

// ----- Sub-schema: ProductDimension -----
export class ProductDimension {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true, trim: true })
  label: string;

  @Prop({ type: Number, required: true })
  width: number;

  @Prop({ type: Number, required: true })
  depth: number;

  @Prop({ type: Number, required: true })
  height: number;

  @Prop({ type: Number, default: 0 })
  weight: number;

  @Prop({ type: Number, default: 0 })
  priceModifier: number;

  @Prop({ type: Boolean, default: true })
  available: boolean;
}

// ----- Sub-schema: ProductVariant -----
export class ProductVariant {
  @Prop({ type: String, required: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ type: String, required: true })
  colorId: string;

  @Prop({ type: String, required: true })
  dimensionId: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, default: 0, min: 0 })
  costPrice: number;

  @Prop({ type: Number, default: 0, min: 0 })
  stock: number;

  @Prop({ type: Number, default: 5, min: 0 })
  minStock: number;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: Boolean, default: true })
  available: boolean;
}

// ----- Sub-schema: ComboItem -----
export class ComboItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: String, default: null })
  variantSku: string;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  quantity: number;
}

// ----- Sub-schema: SeoMeta -----
export class SeoMeta {
  @Prop({ type: String, default: null, maxlength: 70 })
  metaTitle: string;

  @Prop({ type: String, default: null, maxlength: 160 })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];
}

// ----- Main schema: Product -----
@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true, maxlength: 300 })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({ type: String, default: null, maxlength: 500 })
  shortDescription: string;

  @Prop({ type: String, default: null })
  description: string; // Rich text (HTML)

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  comboCategoryId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  basePrice: number;

  @Prop({ type: Number, default: 0, min: 0 })
  costPrice: number;

  @Prop({ type: String, default: null, trim: true, index: true })
  brand: string;

  @Prop({ type: String, default: null, trim: true })
  material: string;

  @Prop({ type: String, default: null, trim: true })
  origin: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  // ----- Colors -----
  @Prop({
    type: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        hexCode: { type: String, required: true },
        colorFamily: { type: String, default: null },
        priceModifier: { type: Number, default: 0 },
        images: { type: [String], default: [] },
        available: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  colors: ProductColor[];

  // ----- Dimensions -----
  @Prop({
    type: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        width: { type: Number, required: true },
        depth: { type: Number, required: true },
        height: { type: Number, required: true },
        weight: { type: Number, default: 0 },
        priceModifier: { type: Number, default: 0 },
        available: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  dimensions: ProductDimension[];

  // ----- Variants -----
  @Prop({
    type: [
      {
        sku: { type: String, required: true, uppercase: true },
        colorId: { type: String, required: true },
        dimensionId: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        costPrice: { type: Number, default: 0, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        minStock: { type: Number, default: 5, min: 0 },
        image: { type: String, default: null },
        available: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  variants: ProductVariant[];

  // ----- Specifications (key-value) -----
  @Prop({ type: Object, default: {} })
  specifications: Record<string, string>;

  @Prop({
    type: String,
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
    index: true,
  })
  status: ProductStatus;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // ----- Combo items (neu la san pham combo) -----
  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        variantSku: { type: String, default: null },
        quantity: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
    default: [],
  })
  comboItems: ComboItem[];

  // ----- SEO -----
  @Prop({
    type: {
      metaTitle: { type: String, default: null, maxlength: 70 },
      metaDescription: { type: String, default: null, maxlength: 160 },
      metaKeywords: { type: [String], default: [] },
    },
    default: {},
  })
  seo: SeoMeta;

  // ----- Statistics -----
  @Prop({ type: Number, default: 0, min: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalSold: number;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// ----- Indexes -----
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isDeleted: 1 });
ProductSchema.index(
  { 'variants.sku': 1 },
  { unique: true, sparse: true },
);

// ----- Text index cho full-text search -----
ProductSchema.index(
  {
    name: 'text',
    shortDescription: 'text',
    description: 'text',
  },
  {
    weights: {
      name: 10,
      shortDescription: 5,
      description: 1,
    },
    name: 'product_text_search',
  },
);
```

---

## 5. Order Schema

> Don hang ho tro 3 phuong thuc thanh toan: `cash`, `bank_transfer`, `cod`.
> Them `bankTransferConfirmed` va `bankTransferConfirmedBy` de xac nhan chuyen khoan.

```typescript
// ============================================================
// schemas/order.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export type OrderDocument = HydratedDocument<Order>;

// ----- Sub-schema: OrderItem -----
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: String, default: null })
  productImage: string;

  @Prop({ type: String, default: null })
  variantSku: string;

  @Prop({
    type: {
      colorName: { type: String, default: null },
      dimensionLabel: { type: String, default: null },
    },
    default: {},
  })
  variantInfo: {
    colorName: string;
    dimensionLabel: string;
  };

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice: number;
}

// ----- Sub-schema: OrderStatusHistory -----
export class OrderStatusHistory {
  @Prop({ type: String, enum: OrderStatus, required: true })
  status: OrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  changedBy: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  changedAt: Date;

  @Prop({ type: String, default: null, maxlength: 500 })
  note: string;
}

// ----- Main schema: Order -----
@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: String,
    required: true,
    unique: true,
    match: /^FV-\d{8}-\d{4}$/,
  })
  orderNumber: string; // Format: FV-YYYYMMDD-XXXX

  // ----- Customer info -----
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  customerName: string;

  @Prop({ type: String, required: true, trim: true })
  customerPhone: string;

  @Prop({ type: String, default: null, trim: true })
  customerEmail: string;

  // ----- Items -----
  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        productImage: { type: String, default: null },
        variantSku: { type: String, default: null },
        variantInfo: {
          type: {
            colorName: { type: String, default: null },
            dimensionLabel: { type: String, default: null },
          },
          default: {},
        },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
      },
    ],
    required: true,
    validate: [(v: any[]) => v.length > 0, 'Don hang phai co it nhat 1 san pham'],
  })
  items: OrderItem[];

  // ----- Pricing -----
  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discountAmount: number;

  @Prop({ type: String, default: null })
  discountReason: string;

  @Prop({ type: Number, default: 0, min: 0 })
  shippingFee: number;

  @Prop({ type: Number, required: true, min: 0 })
  total: number;

  // ----- Status -----
  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  // ----- Payment -----
  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  // ----- Bank Transfer Confirmation -----
  @Prop({ type: Boolean, default: false })
  bankTransferConfirmed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  bankTransferConfirmedBy: Types.ObjectId;

  // ----- Shipping address -----
  @Prop({ type: String, required: true, trim: true })
  shippingFullName: string;

  @Prop({ type: String, required: true, trim: true })
  shippingPhone: string;

  @Prop({ type: String, required: true, trim: true })
  shippingStreet: string;

  @Prop({ type: String, required: true, trim: true })
  shippingWard: string;

  @Prop({ type: String, required: true, trim: true })
  shippingDistrict: string;

  @Prop({ type: String, required: true, trim: true })
  shippingProvince: string;

  @Prop({ type: String, default: null, maxlength: 500 })
  shippingNote: string;

  // ----- Shipper -----
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  shipperId: Types.ObjectId;

  @Prop({ type: String, default: null })
  shipperName: string;

  @Prop({ type: String, default: null })
  shipperPhone: string;

  // ----- Status history -----
  @Prop({
    type: [
      {
        status: { type: String, enum: OrderStatus, required: true },
        changedBy: { type: Types.ObjectId, ref: 'User', default: null },
        changedAt: { type: Date, default: () => new Date() },
        note: { type: String, default: null, maxlength: 500 },
      },
    ],
    default: [],
  })
  statusHistory: OrderStatusHistory[];

  // ----- Coupon -----
  @Prop({ type: String, default: null, uppercase: true })
  couponCode: string;

  // ----- POS -----
  @Prop({ type: Boolean, default: false, index: true })
  isPosOrder: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId; // Staff tao don POS

  @Prop({ type: Number, default: null, min: 0 })
  cashReceived: number;

  @Prop({ type: Number, default: null, min: 0 })
  changeAmount: number;

  // ----- Delivery -----
  @Prop({ type: String, default: null })
  deliveryProofImage: string;

  @Prop({ type: Date, default: null })
  estimatedDelivery: Date;

  @Prop({ type: Date, default: null })
  deliveredAt: Date;

  // ----- Cancellation / Return -----
  @Prop({ type: String, default: null, maxlength: 500 })
  cancelReason: string;

  @Prop({ type: String, default: null, maxlength: 500 })
  returnReason: string;

  // ----- Soft delete -----
  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// ----- Indexes -----
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ shipperId: 1 });
OrderSchema.index({ isPosOrder: 1 });
```

---

## 6. ShipperLocation Schema

> **[FIXED]** Them truong `currentOrderId` - truoc day bi thieu khien he thong khong
> the gan vi tri shipper voi don hang hien tai, gay loi khi tracking real-time.

```typescript
// ============================================================
// schemas/shipper-location.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ShipperStatus } from '../enums/shipper-status.enum';

export type ShipperLocationDocument = HydratedDocument<ShipperLocation>;

@Schema({ timestamps: true })
export class ShipperLocation {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  shipperId: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ type: Number, default: null })
  accuracy: number; // Do chinh xac GPS (met)

  @Prop({
    type: String,
    enum: ShipperStatus,
    default: ShipperStatus.OFFLINE,
  })
  status: ShipperStatus;

  /**
   * [FIXED] Truong nay truoc day bi thieu trong schema.
   * He thong khong biet shipper dang giao don nao,
   * gay loi khi hien thi tracking map cho khach hang.
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    default: null,
  })
  currentOrderId: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date;
}

export const ShipperLocationSchema =
  SchemaFactory.createForClass(ShipperLocation);

// ----- Indexes -----
ShipperLocationSchema.index({ location: '2dsphere' });
ShipperLocationSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 86400 }, // TTL 24 gio
);
```

---

## 7. Shift Schema

> Quan ly ca lam viec cho he thong POS.
> Moi ca ghi nhan tong doanh thu, so don, phan chia theo hinh thuc thanh toan.

```typescript
// ============================================================
// schemas/shift.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShiftDocument = HydratedDocument<Shift>;

@Schema({ timestamps: true })
export class Shift {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  cashierId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  cashierName: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  openedAt: Date;

  @Prop({ type: Date, default: null })
  closedAt: Date;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  openingCash: number;

  @Prop({ type: Number, default: null, min: 0 })
  closingCash: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalSales: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalOrders: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalCashSales: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalBankSales: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalDiscounts: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }], default: [] })
  orderIds: Types.ObjectId[];

  @Prop({ type: String, default: null, maxlength: 500 })
  note: string;

  @Prop({ type: Boolean, default: false })
  isClosed: boolean;
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);

// ----- Indexes -----
ShiftSchema.index({ cashierId: 1 });
ShiftSchema.index({ openedAt: -1 });
```

---

## 8. Coupon Schema

```typescript
// ============================================================
// schemas/coupon.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DiscountType } from '../enums/discount-type.enum';
import { CouponScope } from '../enums/coupon-scope.enum';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 50,
  })
  code: string;

  @Prop({ type: String, default: null, maxlength: 500 })
  description: string;

  @Prop({
    type: String,
    enum: DiscountType,
    required: true,
  })
  discountType: DiscountType;

  @Prop({ type: Number, required: true, min: 0 })
  discountValue: number;

  @Prop({ type: Number, default: 0, min: 0 })
  minOrderValue: number;

  @Prop({ type: Number, default: null, min: 0 })
  maxDiscountAmount: number; // Gioi han giam toi da (cho percentage)

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Number, default: null, min: 1 })
  maxUsage: number; // Tong so lan su dung toi da

  @Prop({ type: Number, default: 0, min: 0 })
  usedCount: number;

  @Prop({ type: Number, default: 1, min: 1 })
  maxUsagePerUser: number; // So lan su dung toi da moi user

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: CouponScope,
    default: CouponScope.ALL,
  })
  scope: CouponScope;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  applicableCategories: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  applicableProducts: Types.ObjectId[];
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// ----- Indexes -----
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
```

---

## 9. CouponUsage Schema

> **[NEW]** Theo doi lich su su dung coupon cua tung user.
> Dung de kiem tra gioi han `maxUsagePerUser` cua Coupon.

```typescript
// ============================================================
// schemas/coupon-usage.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CouponUsageDocument = HydratedDocument<CouponUsage>;

@Schema({ timestamps: true })
export class CouponUsage {
  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: true })
  couponId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  discountAmount: number;

  @Prop({ type: Date, default: () => new Date() })
  usedAt: Date;
}

export const CouponUsageSchema = SchemaFactory.createForClass(CouponUsage);

// ----- Indexes -----
CouponUsageSchema.index({ couponId: 1, userId: 1 }); // Compound: tra cuu so lan user dung coupon
CouponUsageSchema.index({ orderId: 1 });
```

---

## 10. Review Schema

> **[NEW]** Danh gia san pham tu khach hang.
> Ho tro moderate (duyet truoc khi hien thi), danh dau huu ich, dinh kem hinh anh.

```typescript
// ============================================================
// schemas/review.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReviewStatus } from '../enums/review-status.enum';

export type ReviewDocument = HydratedDocument<Review>;

// ----- Sub-schema: HelpfulVote -----
export class HelpfulVote {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  isHelpful: boolean;
}

// ----- Main schema: Review -----
@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: String, default: null })
  orderItemSku: string; // SKU cua variant da mua

  @Prop({ type: Number, required: true, min: 1, max: 5, index: true })
  rating: number;

  @Prop({ type: String, default: null, maxlength: 200, trim: true })
  title: string;

  @Prop({ type: String, default: null, maxlength: 2000, trim: true })
  comment: string;

  @Prop({
    type: [String],
    default: [],
    validate: [(v: string[]) => v.length <= 5, 'Toi da 5 hinh anh'],
  })
  images: string[];

  @Prop({
    type: String,
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  helpfulCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  unhelpfulCount: number;

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        isHelpful: { type: Boolean, required: true },
      },
    ],
    default: [],
  })
  helpfulVotes: HelpfulVote[];

  @Prop({ type: String, default: null, maxlength: 500 })
  adminNote: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  moderatedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  moderatedAt: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// ----- Indexes -----
ReviewSchema.index({ productId: 1, status: 1 }); // Compound: lay danh gia cua san pham theo trang thai
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ orderId: 1 });
ReviewSchema.index({ rating: 1 });
```

---

## 11. Wishlist Schema

> **[NEW]** Danh sach yeu thich cua khach hang.

```typescript
// ============================================================
// schemas/wishlist.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WishlistDocument = HydratedDocument<Wishlist>;

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  addedAt: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// ----- Indexes -----
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true }); // Moi user chi them 1 san pham 1 lan
WishlistSchema.index({ userId: 1 });
```

---

## 12. Return Schema

> **[NEW]** Quan ly yeu cau tra hang / hoan tien.
> Lien ket voi Order, ho tro nhieu san pham tra cung luc.

```typescript
// ============================================================
// schemas/return.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReturnStatus } from '../enums/return-status.enum';
import { ReturnReason } from '../enums/return-reason.enum';

export type ReturnDocument = HydratedDocument<Return>;

// ----- Sub-schema: ReturnItem -----
export class ReturnItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: String, default: null })
  variantSku: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: String, enum: ReturnReason, required: true })
  reason: ReturnReason;

  @Prop({ type: String, default: null, maxlength: 500 })
  note: string;
}

// ----- Main schema: Return -----
@Schema({ timestamps: true })
export class Return {
  @Prop({
    type: String,
    required: true,
    unique: true,
    match: /^RT-\d{8}-\d{4}$/,
  })
  returnNumber: string; // Format: RT-YYYYMMDD-XXXX

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        variantSku: { type: String, default: null },
        quantity: { type: Number, required: true, min: 1 },
        reason: { type: String, enum: ReturnReason, required: true },
        note: { type: String, default: null, maxlength: 500 },
      },
    ],
    required: true,
    validate: [
      (v: any[]) => v.length > 0,
      'Yeu cau tra hang phai co it nhat 1 san pham',
    ],
  })
  items: ReturnItem[];

  @Prop({
    type: String,
    enum: ReturnStatus,
    default: ReturnStatus.PENDING,
    index: true,
  })
  status: ReturnStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  refundAmount: number;

  @Prop({
    type: String,
    enum: ['cash', 'bank_transfer'],
    default: null,
  })
  refundMethod: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  processedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  processedAt: Date;

  @Prop({ type: String, default: null, maxlength: 1000 })
  customerNote: string;

  @Prop({ type: String, default: null, maxlength: 1000 })
  adminNote: string;

  @Prop({ type: [String], default: [] })
  images: string[];
}

export const ReturnSchema = SchemaFactory.createForClass(Return);

// ----- Indexes -----
ReturnSchema.index({ returnNumber: 1 }, { unique: true });
ReturnSchema.index({ orderId: 1 });
ReturnSchema.index({ customerId: 1 });
ReturnSchema.index({ status: 1 });
```

---

## 13. Notification Schema

```typescript
// ============================================================
// schemas/notification.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: NotificationType,
    required: true,
  })
  type: NotificationType;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 1000 })
  message: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  data: any; // Du lieu tuy y (vd: orderId, productId, ...)

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date;

  @Prop({ type: String, default: null })
  actionUrl: string; // URL de chuyen huong khi click thong bao
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// ----- Indexes -----
NotificationSchema.index({ userId: 1, isRead: 1 }); // Compound: lay thong bao chua doc cua user
NotificationSchema.index({ createdAt: -1 });
```

---

## 14. UploadedFile Schema

```typescript
// ============================================================
// schemas/uploaded-file.schema.ts
// ============================================================
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UploadCategory } from '../enums/upload-category.enum';

export type UploadedFileDocument = HydratedDocument<UploadedFile>;

@Schema({ timestamps: true })
export class UploadedFile {
  @Prop({ type: String, required: true, trim: true })
  fileName: string;

  @Prop({ type: String, required: true, trim: true })
  originalName: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: Number, required: true, min: 0 })
  size: number; // Bytes

  @Prop({ type: String, required: true, index: true })
  googleDriveFileId: string;

  @Prop({ type: String, default: null })
  googleDriveWebViewUrl: string;

  @Prop({ type: String, default: null })
  googleDriveWebContentUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploadedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: UploadCategory,
    default: UploadCategory.OTHER,
    index: true,
  })
  category: UploadCategory;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);

// ----- Indexes -----
UploadedFileSchema.index({ googleDriveFileId: 1 });
UploadedFileSchema.index({ uploadedBy: 1 });
UploadedFileSchema.index({ category: 1 });
```

---

## 15. Entity Relationship Diagram

```
+=====================================================================+
|              ENTITY RELATIONSHIP DIAGRAM - FurnitureVN              |
+=====================================================================+

  +------------------+          +-------------------+
  |      USER        |          |     CATEGORY      |
  |------------------|          |-------------------|
  | _id              |          | _id               |
  | fullName         |          | name              |
  | email (unique)   |          | slug (unique)     |
  | password         |          | parentId ---------+---> (self-ref)
  | phone            |          | isCombo           |
  | role             |          +-------------------+
  | status (shipper) |                 |
  | addresses[]      |                 | 1
  | loyaltyPoints    |                 |
  +------------------+                 | N
         |                      +-------------------+
         | 1                    |     PRODUCT       |
         |                      |-------------------|
         +------+               | _id               |
         |      |               | name              |
         |      |               | slug (unique)     |
         |      |               | categoryId -------+
         |      |               | basePrice         |
         |      |               | colors[]          |
         |      |               | dimensions[]      |
         |      |               | variants[]        |
         |      |               | comboItems[] -----+---> (self-ref Product)
         |      |               | status            |
         |      |               +-------------------+
         |      |                  |           |
         |      |                  | 1         | 1
         |      |                  |           |
         |      |     N            |           |          N
         |      +--------+---------+           +------+---------+
         |               |                            |         |
         |        +------+------+              +------+---+ +---+--------+
         |        |   REVIEW    |              | WISHLIST  | |  RETURN    |
         |        |-------------|              |-----------|+|  ITEM      |
         |        | productId   |              | userId    | | productId  |
         |        | userId      |              | productId | | variantSku |
         |        | orderId     |              +-----------+ +------------+
         |        | rating 1-5  |
         |        | status      |
         |        +-------------+
         |
         | N (customerId)
         |
  +------+-------------------------------------------+
  |                     ORDER                        |
  |--------------------------------------------------|
  | _id                                              |
  | orderNumber (unique, FV-YYYYMMDD-XXXX)           |
  | customerId ---- ref User                         |
  | items[] -------- ref Product (embedded)          |
  | status                                           |
  | paymentMethod (cash/bank_transfer/cod)           |
  | bankTransferConfirmed                            |
  | shipperId ----- ref User (shipper)               |
  | couponCode                                       |
  | isPosOrder                                       |
  | createdBy ----- ref User (staff, POS only)       |
  | statusHistory[]                                  |
  +--------------------------------------------------+
         |                    |                |
         | 1                  | 1              | 1
         |                    |                |
         | N                  | N              | N
  +------+------+    +-------+-------+  +-----+----------+
  | COUPON_USAGE|    |    RETURN     |  | NOTIFICATION   |
  |-------------|    |---------------|  |----------------|
  | couponId    |    | returnNumber  |  | userId         |
  | userId      |    | orderId       |  | type           |
  | orderId     |    | customerId    |  | title          |
  | discount    |    | items[]       |  | message        |
  +-------------+    | status        |  | isRead         |
         |           | refundAmount  |  +----------------+
         |           +---------------+
         |
  +------+------+
  |   COUPON    |
  |-------------|          +--------------------+
  | code(unique)|          | SHIPPER_LOCATION   |
  | discountType|          |--------------------|
  | scope       |          | shipperId -- User  |
  | applicable  |          | location (2dsphere)|
  |  Categories |          | currentOrderId --- Order  [FIXED]
  |  Products   |          | status             |
  +-------------+          | TTL: 24h           |
                           +--------------------+

  +------------------+     +--------------------+
  |     SHIFT        |     |  UPLOADED_FILE     |
  |------------------|     |--------------------|
  | cashierId - User |     | googleDriveFileId  |
  | openedAt         |     | uploadedBy -- User |
  | closingCash      |     | category           |
  | totalSales       |     | mimeType           |
  | orderIds[] -Order|     | size               |
  | isClosed         |     +--------------------+
  +------------------+

+=====================================================================+
|  Ghi chu:                                                           |
|  ----->  : Tham chieu (ref)                                         |
|  1 --- N : Quan he mot - nhieu                                      |
|  []      : Mang nhung (embedded array)                              |
|  [FIXED] : Truong moi them de sua loi                               |
+=====================================================================+
```

---

## 16. Index Summary Table

| # | Collection | Index | Type | Ghi chu |
|---|-----------|-------|------|---------|
| 1 | `users` | `{ email: 1 }` | Unique | Dang nhap, kiem tra trung |
| 2 | `users` | `{ phone: 1 }` | Sparse | Tim theo SDT |
| 3 | `users` | `{ role: 1 }` | Normal | Loc theo vai tro |
| 4 | `users` | `{ isDeleted: 1 }` | Normal | Loc soft delete |
| 5 | `categories` | `{ slug: 1 }` | Unique | URL friendly lookup |
| 6 | `categories` | `{ parentId: 1 }` | Normal | Lay danh muc con |
| 7 | `categories` | `{ isCombo: 1 }` | Normal | Loc danh muc combo |
| 8 | `products` | `{ slug: 1 }` | Unique | URL friendly lookup |
| 9 | `products` | `{ categoryId: 1 }` | Normal | Loc theo danh muc |
| 10 | `products` | `{ brand: 1 }` | Normal | Loc theo thuong hieu |
| 11 | `products` | `{ status: 1 }` | Normal | Loc theo trang thai |
| 12 | `products` | `{ isDeleted: 1 }` | Normal | Loc soft delete |
| 13 | `products` | `{ 'variants.sku': 1 }` | Unique, Sparse | Tim variant theo SKU |
| 14 | `products` | `{ name, shortDescription, description }` | Text (weighted) | Full-text search |
| 15 | `orders` | `{ orderNumber: 1 }` | Unique | Tra cuu don hang |
| 16 | `orders` | `{ customerId: 1 }` | Normal | Don hang cua khach |
| 17 | `orders` | `{ status: 1 }` | Normal | Loc theo trang thai |
| 18 | `orders` | `{ createdAt: -1 }` | Descending | Sap xep moi nhat |
| 19 | `orders` | `{ shipperId: 1 }` | Normal | Don hang cua shipper |
| 20 | `orders` | `{ isPosOrder: 1 }` | Normal | Loc don POS |
| 21 | `shipperlocations` | `{ location: '2dsphere' }` | 2dsphere | Tim shipper gan nhat |
| 22 | `shipperlocations` | `{ updatedAt: 1 }` | TTL (24h) | Tu dong xoa du lieu cu |
| 23 | `shifts` | `{ cashierId: 1 }` | Normal | Ca lam cua nhan vien |
| 24 | `shifts` | `{ openedAt: -1 }` | Descending | Sap xep moi nhat |
| 25 | `coupons` | `{ code: 1 }` | Unique | Tra cuu ma giam gia |
| 26 | `coupons` | `{ isActive: 1 }` | Normal | Loc coupon dang hoat dong |
| 27 | `couponusages` | `{ couponId: 1, userId: 1 }` | Compound | Kiem tra so lan dung |
| 28 | `couponusages` | `{ orderId: 1 }` | Normal | Tim usage theo don hang |
| 29 | `reviews` | `{ productId: 1, status: 1 }` | Compound | Lay review da duyet cua SP |
| 30 | `reviews` | `{ userId: 1 }` | Normal | Review cua user |
| 31 | `reviews` | `{ orderId: 1 }` | Normal | Review theo don hang |
| 32 | `reviews` | `{ rating: 1 }` | Normal | Loc theo so sao |
| 33 | `wishlists` | `{ userId: 1, productId: 1 }` | Unique, Compound | Khong trung yeu thich |
| 34 | `wishlists` | `{ userId: 1 }` | Normal | Danh sach yeu thich cua user |
| 35 | `returns` | `{ returnNumber: 1 }` | Unique | Tra cuu yeu cau tra hang |
| 36 | `returns` | `{ orderId: 1 }` | Normal | Tra hang theo don |
| 37 | `returns` | `{ customerId: 1 }` | Normal | Tra hang cua khach |
| 38 | `returns` | `{ status: 1 }` | Normal | Loc theo trang thai |
| 39 | `notifications` | `{ userId: 1, isRead: 1 }` | Compound | Thong bao chua doc cua user |
| 40 | `notifications` | `{ createdAt: -1 }` | Descending | Sap xep moi nhat |
| 41 | `uploadedfiles` | `{ googleDriveFileId: 1 }` | Normal | Tim file tren Drive |
| 42 | `uploadedfiles` | `{ uploadedBy: 1 }` | Normal | File cua user |
| 43 | `uploadedfiles` | `{ category: 1 }` | Normal | Loc theo loai file |

**Tong cong: 43 indexes tren 13 collections**

---

> **Luu y khi deploy:**
> - Cac index `unique` can duoc tao truoc khi insert du lieu.
> - Text index (`product_text_search`) chi cho phep 1 index/collection.
> - TTL index tren `shipperlocations` tu dong xoa document sau 24 gio.
> - 2dsphere index yeu cau du lieu `location` dung dinh dang GeoJSON.
> - Compound index `{ couponId: 1, userId: 1 }` phuc vu query kiem tra so lan dung coupon.
