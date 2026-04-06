# SHARED TYPES - TypeScript Interfaces

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `packages/shared-types/src/` va `apps/fe/src/types/`
> Chua TAT CA TypeScript interfaces duoc su dung boi frontend
> Phai dong bo voi backend schemas (xem `02-database/01-schemas.md`)
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Re-export Enums](#1-re-export-enums)
2. [User Types](#2-user-types)
3. [Product Types](#3-product-types)
4. [Category Types](#4-category-types)
5. [Order Types](#5-order-types)
6. [Review Types](#6-review-types)
7. [Wishlist Types](#7-wishlist-types)
8. [Coupon Types](#8-coupon-types)
9. [Return Types](#9-return-types)
10. [Shipper Types](#10-shipper-types)
11. [Notification Types](#11-notification-types)
12. [Shift Types (POS)](#12-shift-types-pos)
13. [Upload Types](#13-upload-types)
14. [Report Types](#14-report-types)
15. [Utility Types](#15-utility-types)
16. [Socket Event Types](#16-socket-event-types)

---

## 1. Re-export Enums

> File: `packages/shared-types/src/index.ts`
> Re-export tat ca enums tu `enums.ts` de frontend import truc tiep.
> Chi tiet tung enum xem tai `02-database/00-enums.md`.

```typescript
// packages/shared-types/src/index.ts
// Re-export enums
export {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ProductStatus,
  ShipperStatus,
  NotificationType,
  DiscountType,
  ReviewStatus,
  ReturnStatus,
  ReturnReason,
  CouponScope,
  ShiftStatus,
  UploadCategory,
} from './enums';

// Re-export label maps
export {
  UserRoleLabel,
  OrderStatusLabel,
  PaymentStatusLabel,
  PaymentMethodLabel,
  ProductStatusLabel,
  ShipperStatusLabel,
  NotificationTypeLabel,
  DiscountTypeLabel,
  ReviewStatusLabel,
  ReturnStatusLabel,
  ReturnReasonLabel,
  CouponScopeLabel,
  ShiftStatusLabel,
  UploadCategoryLabel,
} from './enums';

// Re-export color maps
export {
  OrderStatusColor,
  PaymentStatusColor,
  ProductStatusColor,
  ShipperStatusColor,
  ReviewStatusColor,
  ReturnStatusColor,
  ShiftStatusColor,
} from './enums';

// Re-export constants
export {
  SHIPPING_FEE_CONFIG,
  PAGINATION,
  JWT_CONFIG,
  FILE_UPLOAD,
  LOYALTY_POINTS,
  INVENTORY,
} from './constants';

// Re-export all interfaces
export * from './interfaces';
```

**Frontend import:**

```typescript
// apps/fe/src/types/index.ts
// Re-export tat ca tu shared-types
export * from '@shared-types';
```

**Luu y ve PaymentMethod:**

```typescript
// CHI co 3 phuong thuc thanh toan:
export enum PaymentMethod {
  CASH = 'cash',              // Tien mat tai cua hang
  BANK_TRANSFER = 'bank_transfer', // Chuyen khoan ngan hang (xac nhan thu cong)
  COD = 'cod',                // Thanh toan khi nhan hang
}
// KHONG co VNPay, Momo, hay bat ky cong thanh toan dien tu nao
```

---

## 2. User Types

> File: `packages/shared-types/src/interfaces/user.interface.ts`

### Address

```typescript
export interface Address {
  /** Dia chi mac dinh hay khong */
  isDefault: boolean;

  /** Ho ten nguoi nhan */
  fullName: string;

  /** So dien thoai nguoi nhan */
  phone: string;

  /** Dia chi cu the (so nha, duong) */
  street: string;

  /** Phuong/Xa */
  ward: string;

  /** Quan/Huyen */
  district: string;

  /** Tinh/Thanh pho */
  province: string;

  /** Vi do (cho ban do) */
  lat?: number;

  /** Kinh do (cho ban do) */
  lng?: number;
}
```

### User

```typescript
import { UserRole, ShipperStatus } from '../enums';

export interface User {
  /** MongoDB ObjectId */
  id: string;

  /** Ho ten day du */
  fullName: string;

  /** Email (unique, lowercase) */
  email: string;

  /** So dien thoai (format: 0xxxxxxxxx hoac +84xxxxxxxxx) */
  phone: string;

  /** URL anh dai dien */
  avatar: string | null;

  /** Vai tro trong he thong */
  role: UserRole;

  /** Tai khoan dang hoat dong hay khong */
  isActive: boolean;

  /** Danh sach dia chi giao hang */
  addresses: Address[];

  /** Diem thuong tich luy */
  loyaltyPoints: number;

  /** Trang thai shipper (chi co khi role = shipper) */
  status?: ShipperStatus;

  /** Loai xe (chi co khi role = shipper) */
  vehicleType?: string;

  /** Bien so xe (chi co khi role = shipper) */
  licensePlate?: string;

  /** Ma nhan vien (chi co khi role = staff/manager) */
  staffCode?: string;

  createdAt: string;
  updatedAt: string;
}
```

### AuthResponse

```typescript
export interface AuthResponse {
  /** Thong tin user sau khi dang nhap */
  user: User;

  /** JWT access token (het han sau 15 phut) */
  accessToken: string;

  /** JWT refresh token (het han sau 7 ngay) */
  refreshToken: string;
}
```

### LoginCredentials

```typescript
export interface LoginCredentials {
  /** Email dang nhap */
  email: string;

  /** Mat khau */
  password: string;
}
```

### RegisterData

```typescript
export interface RegisterData {
  /** Ho ten day du */
  fullName: string;

  /** Email dang ky (unique) */
  email: string;

  /** Mat khau (toi thieu 6 ky tu) */
  password: string;

  /** So dien thoai */
  phone: string;
}
```

---

## 3. Product Types

> File: `packages/shared-types/src/interfaces/product.interface.ts`

### ProductColor

```typescript
export interface ProductColor {
  /** ID duy nhat cua mau (VD: 'color-1') */
  id: string;

  /** Ten mau tieng Viet (VD: 'Nau go oc cho') */
  name: string;

  /** Ma mau hex (VD: '#8B4513') */
  hexCode: string;

  /** Nhom mau (VD: 'nau', 'den', 'trang') */
  colorFamily: string | null;

  /** Dieu chinh gia so voi gia goc (VND, co the am) */
  priceModifier: number;

  /** URL hinh anh cua mau nay */
  images: string[];

  /** Mau nay con ban khong */
  available: boolean;
}
```

### ProductDimension

```typescript
export interface ProductDimension {
  /** ID duy nhat (VD: 'dim-1') */
  id: string;

  /** Nhan hien thi (VD: '1m2', '1m6', '1m8') */
  label: string;

  /** Chieu rong (cm) */
  width: number;

  /** Chieu sau (cm) */
  depth: number;

  /** Chieu cao (cm) */
  height: number;

  /** Can nang (kg) */
  weight: number;

  /** Dieu chinh gia so voi gia goc (VND) */
  priceModifier: number;

  /** Kich thuoc nay con ban khong */
  available: boolean;
}
```

### ProductVariant

```typescript
export interface ProductVariant {
  /** Ma SKU (VD: 'SOFA-NAU-1M6') - unique tren toan he thong */
  sku: string;

  /** Tham chieu den ProductColor.id */
  colorId: string;

  /** Tham chieu den ProductDimension.id */
  dimensionId: string;

  /** Gia ban cua variant nay (VND) */
  price: number;

  /** Gia von (VND) */
  costPrice: number;

  /** So luong ton kho */
  stock: number;

  /** Nguong canh bao het hang */
  minStock: number;

  /** URL hinh anh rieng cua variant */
  image: string | null;

  /** Variant con ban khong */
  available: boolean;
}
```

### ProductSpecifications

```typescript
export interface ProductSpecifications {
  /** Thoi gian bao hanh (VD: '12 thang', '24 thang') */
  warranty?: string;

  /** Yeu cau lap rap hay khong */
  assemblyRequired?: boolean;

  /** Thoi gian lap rap (VD: '30 phut', '1 gio') */
  assemblyTime?: string;

  /** Can nang (kg) */
  weight?: string;

  /** Noi san xuat (VD: 'Viet Nam', 'Trung Quoc') */
  madeIn?: string;

  /** Cac thong so khac dang key-value */
  [key: string]: string | boolean | undefined;
}
```

### ProductSeo

```typescript
export interface ProductSeo {
  /** Tieu de SEO (toi da 70 ky tu) */
  title: string | null;

  /** Mo ta SEO (toi da 160 ky tu) */
  description: string | null;
}
```

### ComboItem

```typescript
export interface ComboItem {
  /** ID san pham trong combo */
  productId: string;

  /** SKU variant cu the (null = san pham goc) */
  variantSku: string | null;

  /** So luong */
  quantity: number;
}
```

### Product

```typescript
import { ProductStatus } from '../enums';

export interface Product {
  /** MongoDB ObjectId */
  id: string;

  /** Ten san pham */
  name: string;

  /** Slug URL-friendly (unique) */
  slug: string;

  /** Mo ta ngan (toi da 500 ky tu) */
  shortDescription: string | null;

  /** Mo ta chi tiet (HTML rich text) */
  description: string | null;

  /** ID danh muc chinh */
  categoryId: string;

  /** Thong tin danh muc (populate) */
  category?: Category;

  /** ID danh muc combo (null neu khong phai combo) */
  comboCategoryId: string | null;

  /** Gia goc (VND) */
  basePrice: number;

  /** Gia von (VND) */
  costPrice: number;

  /** Thuong hieu */
  brand: string | null;

  /** Chat lieu (VD: 'Go soi', 'Go cao su') */
  material: string | null;

  /** Xuat xu */
  origin: string | null;

  /** Danh sach URL hinh anh san pham */
  images: string[];

  /** Danh sach mau sac */
  colors: ProductColor[];

  /** Danh sach kich thuoc */
  dimensions: ProductDimension[];

  /** Danh sach bien the (to hop mau + kich thuoc) */
  variants: ProductVariant[];

  /** Thong so ky thuat */
  specifications: ProductSpecifications;

  /** Trang thai san pham */
  status: ProductStatus;

  /** Tags tim kiem (VD: ['sofa', 'phong khach', 'hien dai']) */
  tags: string[];

  /** Cac san pham con trong combo */
  comboItems: ComboItem[];

  /** Thong tin SEO */
  seo: ProductSeo;

  /** Tong so luot xem */
  viewCount: number;

  /** Tong so luong da ban */
  totalSold: number;

  /** Diem danh gia trung binh (tinh tu reviews) */
  rating?: number;

  /** Tong so danh gia */
  reviewCount?: number;

  createdAt: string;
}
```

---

## 4. Category Types

> File: `packages/shared-types/src/interfaces/category.interface.ts`

```typescript
export interface Category {
  /** MongoDB ObjectId */
  id: string;

  /** Ten danh muc (VD: 'Sofa', 'Ban an', 'Giuong') */
  name: string;

  /** Slug URL-friendly (unique) */
  slug: string;

  /** Mo ta danh muc */
  description: string | null;

  /** URL hinh anh danh muc */
  image: string | null;

  /** ID danh muc cha (null = danh muc goc) */
  parentId: string | null;

  /** Thu tu hien thi */
  sortOrder: number;

  /** Danh muc dang hoat dong */
  isActive: boolean;

  /** Danh muc combo (combo noi that) */
  isCombo: boolean;

  /** Tags tim kiem */
  tags: string[];

  /** Danh sach danh muc con (populate) */
  children?: Category[];
}
```

---

## 5. Order Types

> File: `packages/shared-types/src/interfaces/order.interface.ts`

### OrderItem

```typescript
export interface OrderItem {
  /** ID san pham */
  productId: string;

  /** Ten san pham (snapshot tai thoi diem dat hang) */
  productName: string;

  /** URL hinh anh san pham */
  productImage: string | null;

  /** SKU variant da chon */
  variantSku: string | null;

  /** Thong tin variant de hien thi */
  variantInfo: {
    colorName: string | null;
    dimensionLabel: string | null;
  };

  /** So luong */
  quantity: number;

  /** Don gia (VND) */
  unitPrice: number;

  /** Thanh tien = quantity * unitPrice (VND) */
  totalPrice: number;
}
```

### OrderStatusHistory

```typescript
import { OrderStatus } from '../enums';

export interface OrderStatusHistory {
  /** Trang thai moi */
  status: OrderStatus;

  /** ID nguoi thay doi (staff/system) */
  changedBy: string | null;

  /** Thoi diem thay doi */
  changedAt: string;

  /** Ghi chu (VD: ly do huy, ghi chu giao hang) */
  note: string | null;
}
```

### Order

```typescript
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../enums';

export interface Order {
  /** MongoDB ObjectId */
  id: string;

  /** Ma don hang (format: FV-YYYYMMDD-XXXX) */
  orderNumber: string;

  /** ID khach hang (null cho don POS khach vang lai) */
  customerId: string | null;

  /** Ten khach hang */
  customerName: string;

  /** So dien thoai khach hang */
  customerPhone: string;

  /** Email khach hang */
  customerEmail: string | null;

  /** Danh sach san pham trong don */
  items: OrderItem[];

  /** Tong tien hang (chua giam gia, chua ship) */
  subtotal: number;

  /** So tien giam gia (VND) */
  discountAmount: number;

  /** Ly do giam gia (cho POS) */
  discountReason: string | null;

  /** Phi van chuyen (VND) */
  shippingFee: number;

  /** Tong thanh toan = subtotal - discountAmount + shippingFee */
  total: number;

  /** Trang thai don hang */
  status: OrderStatus;

  /** Phuong thuc thanh toan */
  paymentMethod: PaymentMethod;

  /** Trang thai thanh toan */
  paymentStatus: PaymentStatus;

  // ----- Dia chi giao hang -----
  /** Ho ten nguoi nhan */
  shippingFullName: string;

  /** SDT nguoi nhan */
  shippingPhone: string;

  /** Dia chi cu the */
  shippingStreet: string;

  /** Phuong/Xa */
  shippingWard: string;

  /** Quan/Huyen */
  shippingDistrict: string;

  /** Tinh/Thanh pho */
  shippingProvince: string;

  /** Ghi chu giao hang */
  shippingNote: string | null;

  // ----- Shipper -----
  /** ID shipper duoc gan */
  shipperId: string | null;

  /** Ten shipper */
  shipperName: string | null;

  /** SDT shipper */
  shipperPhone: string | null;

  /** Lich su thay doi trang thai */
  statusHistory: OrderStatusHistory[];

  /** Ma coupon da ap dung */
  couponCode: string | null;

  // ----- POS -----
  /** Don hang tao tu quay (POS) */
  isPosOrder: boolean;

  /** ID nhan vien tao don POS */
  createdBy: string | null;

  /** So tien khach dua (POS, tien mat) */
  cashReceived: number | null;

  /** Tien thua tra lai */
  changeAmount: number | null;

  // ----- Giao hang -----
  /** URL anh chung minh da giao hang */
  deliveryProofImage: string | null;

  /** Ly do huy don */
  cancelReason: string | null;

  /** Ly do tra hang */
  returnReason: string | null;

  /** Da xac nhan chuyen khoan (chi cho bank_transfer) */
  bankTransferConfirmed: boolean;

  /** Ngay giao du kien */
  estimatedDelivery: string | null;

  /** Ngay giao thuc te */
  deliveredAt: string | null;

  createdAt: string;
  updatedAt: string;
}
```

### CreateOrderDto

```typescript
export interface CreateOrderDto {
  /** Danh sach san pham can mua */
  items: {
    /** ID san pham */
    productId: string;
    /** SKU variant (null = san pham khong co variant) */
    variantSku?: string;
    /** So luong */
    quantity: number;
  }[];

  /**
   * Chi so dia chi trong mang addresses cua user (0-based).
   * Su dung khi chon dia chi co san.
   * Truyen shippingAddressIndex HOAC shippingAddress, khong truyen ca 2.
   */
  shippingAddressIndex?: number;

  /**
   * Dia chi giao hang moi (nhap truc tiep).
   * Su dung khi khach nhap dia chi moi, khong chon tu danh sach.
   */
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
  };

  /** Phuong thuc thanh toan: cash | bank_transfer | cod */
  paymentMethod: PaymentMethod;

  /** Ma giam gia (optional) */
  couponCode?: string;

  /** Ghi chu giao hang */
  note?: string;
}
```

### CreatePosOrderDto

```typescript
export interface CreatePosOrderDto {
  /** Danh sach san pham */
  items: {
    productId: string;
    variantSku?: string;
    quantity: number;
  }[];

  /** ID khach hang (null cho khach vang lai) */
  customerId?: string;

  /** SDT khach hang (cho khach vang lai) */
  customerPhone?: string;

  /** Phuong thuc thanh toan: chi cash hoac bank_transfer cho POS */
  paymentMethod: PaymentMethod;

  /** So tien khach dua (khi thanh toan tien mat) */
  cashReceived?: number;

  /** So tien giam gia (nhan vien ap dung) */
  discountAmount?: number;

  /** Ly do giam gia */
  discountReason?: string;
}
```

---

## 6. Review Types

> File: `packages/shared-types/src/interfaces/review.interface.ts`

### Review

```typescript
import { ReviewStatus } from '../enums';

export interface Review {
  /** MongoDB ObjectId */
  id: string;

  /** ID san pham duoc danh gia */
  productId: string;

  /** ID nguoi danh gia */
  userId: string;

  /** Thong tin nguoi danh gia (populate) */
  user?: {
    id: string;
    fullName: string;
    avatar: string | null;
  };

  /** ID don hang lien quan */
  orderId: string;

  /** SKU variant da mua */
  orderItemSku: string | null;

  /** So sao (1-5) */
  rating: number;

  /** Tieu de danh gia */
  title: string | null;

  /** Noi dung danh gia */
  comment: string;

  /** URL hinh anh dinh kem (toi da 5) */
  images: string[];

  /** Trang thai duyet */
  status: ReviewStatus;

  /** So luot danh dau "huu ich" */
  helpfulCount: number;

  /** So luot danh dau "khong huu ich" */
  unhelpfulCount: number;

  /** Vote cua user hien tai (null = chua vote) */
  myVote?: 'helpful' | 'unhelpful' | null;

  createdAt: string;
}
```

### ReviewStats

```typescript
export interface ReviewStats {
  /** Diem trung binh (1.0 - 5.0) */
  averageRating: number;

  /** Tong so danh gia */
  totalReviews: number;

  /** Phan bo so sao */
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
```

### CreateReviewDto

```typescript
export interface CreateReviewDto {
  /** ID san pham can danh gia */
  productId: string;

  /** ID don hang (xac minh da mua) */
  orderId: string;

  /** SKU variant da mua */
  orderItemSku: string;

  /** So sao (1-5) */
  rating: number;

  /** Tieu de (optional) */
  title?: string;

  /** Noi dung danh gia */
  comment: string;

  /** URL hinh anh dinh kem (optional, toi da 5) */
  images?: string[];
}
```

---

## 7. Wishlist Types

> File: `packages/shared-types/src/interfaces/wishlist.interface.ts`

```typescript
export interface WishlistItem {
  /** MongoDB ObjectId */
  id: string;

  /** ID user so huu */
  userId: string;

  /** ID san pham yeu thich */
  productId: string;

  /** Thong tin san pham (populate) */
  product?: Product;

  /** Ngay them vao danh sach */
  addedAt: string;
}
```

---

## 8. Coupon Types

> File: `packages/shared-types/src/interfaces/coupon.interface.ts`

### Coupon

```typescript
import { DiscountType, CouponScope } from '../enums';

export interface Coupon {
  /** MongoDB ObjectId */
  id: string;

  /** Ma giam gia (uppercase, unique) */
  code: string;

  /** Mo ta coupon */
  description: string | null;

  /** Loai giam gia: percentage | fixed */
  discountType: DiscountType;

  /** Gia tri giam (% hoac VND tuy loai) */
  discountValue: number;

  /** Gia tri don hang toi thieu de ap dung (VND) */
  minOrderValue: number;

  /** So tien giam toi da (cho percentage, VND) */
  maxDiscountAmount: number | null;

  /** Ngay bat dau hieu luc */
  startDate: string;

  /** Ngay het han */
  endDate: string;

  /** Tong so lan su dung toi da */
  maxUsage: number | null;

  /** So lan da su dung */
  usedCount: number;

  /** So lan su dung toi da moi user */
  maxUsagePerUser: number;

  /** Coupon dang hoat dong */
  isActive: boolean;

  /** Pham vi ap dung: all | category | product */
  scope: CouponScope;

  /** Danh sach ID danh muc ap dung (khi scope = category) */
  applicableCategories: string[];

  /** Danh sach ID san pham ap dung (khi scope = product) */
  applicableProducts: string[];
}
```

### CouponValidation

```typescript
export interface CouponValidation {
  /** Ma hop le hay khong */
  isValid: boolean;

  /** So tien duoc giam (VND) */
  discountAmount: number;

  /** Thong bao (VD: 'Giam 10%', 'Ma da het han') */
  message: string;
}
```

---

## 9. Return Types

> File: `packages/shared-types/src/interfaces/return.interface.ts`

### ReturnItem

```typescript
import { ReturnReason } from '../enums';

export interface ReturnItem {
  /** ID san pham tra */
  productId: string;

  /** SKU variant tra */
  variantSku: string;

  /** So luong tra */
  quantity: number;

  /** Ly do tra hang */
  reason: ReturnReason;

  /** Ghi chu chi tiet */
  note: string | null;
}
```

### Return

```typescript
import { ReturnStatus, PaymentMethod } from '../enums';

export interface Return {
  /** MongoDB ObjectId */
  id: string;

  /** Ma yeu cau tra hang (VD: 'RT-20260402-0001') */
  returnNumber: string;

  /** ID don hang goc */
  orderId: string;

  /** Thong tin don hang (populate) */
  order?: Order;

  /** ID khach hang */
  customerId: string;

  /** Danh sach san pham tra */
  items: ReturnItem[];

  /** Trang thai yeu cau tra hang */
  status: ReturnStatus;

  /** So tien hoan (VND) */
  refundAmount: number;

  /** Phuong thuc hoan tien */
  refundMethod: PaymentMethod | null;

  /** ID nguoi xu ly (staff/manager) */
  processedBy: string | null;

  /** Thoi diem xu ly */
  processedAt: string | null;

  /** Ghi chu cua khach hang */
  customerNote: string | null;

  /** Ghi chu cua admin */
  adminNote: string | null;

  /** Hinh anh san pham loi / hu hong */
  images: string[];

  createdAt: string;
}
```

### CreateReturnDto

```typescript
export interface CreateReturnDto {
  /** ID don hang can tra */
  orderId: string;

  /** Danh sach san pham tra */
  items: {
    productId: string;
    variantSku: string;
    quantity: number;
    reason: ReturnReason;
    note?: string;
  }[];

  /** Ghi chu cua khach hang */
  customerNote?: string;

  /** URL hinh anh dinh kem */
  images?: string[];
}
```

---

## 10. Shipper Types

> File: `packages/shared-types/src/interfaces/shipper.interface.ts`

### ShipperLocation

```typescript
import { ShipperStatus } from '../enums';

export interface ShipperLocation {
  /** ID shipper */
  shipperId: string;

  /** Vi tri GeoJSON */
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };

  /** Do chinh xac GPS (met) */
  accuracy: number | null;

  /** Trang thai shipper */
  status: ShipperStatus;

  /** ID don hang dang giao */
  currentOrderId: string | null;

  /** Thoi diem cap nhat cuoi */
  updatedAt: string;
}
```

### ShipperStats

```typescript
export interface ShipperStats {
  /** Tong so don da nhan */
  totalOrders: number;

  /** So don da giao thanh cong */
  completedOrders: number;

  /** Tong thu nhap (VND) */
  totalEarnings: number;

  /** Thu nhap hom nay (VND) */
  todayEarnings: number;

  /** Tong tien COD da thu */
  totalCod: number;

  /** Tien COD chua nop lai */
  pendingCod: number;
}
```

### ShipperEarning

```typescript
export interface ShipperEarning {
  /** Ngay (format: YYYY-MM-DD) */
  date: string;

  /** So don trong ngay */
  orders: number;

  /** Thu nhap trong ngay (VND) */
  earnings: number;

  /** Tien COD thu trong ngay (VND) */
  cod: number;
}
```

---

## 11. Notification Types

> File: `packages/shared-types/src/interfaces/notification.interface.ts`

```typescript
import { NotificationType } from '../enums';

export interface Notification {
  /** MongoDB ObjectId */
  id: string;

  /** ID nguoi nhan */
  userId: string;

  /** Loai thong bao */
  type: NotificationType;

  /** Tieu de thong bao */
  title: string;

  /** Noi dung thong bao */
  message: string;

  /** Du lieu bo sung (VD: orderId, productId) */
  data: Record<string, any> | null;

  /** Da doc hay chua */
  isRead: boolean;

  /** Thoi diem doc */
  readAt: string | null;

  /** URL dieu huong khi click thong bao */
  actionUrl: string | null;

  createdAt: string;
}
```

---

## 12. Shift Types (POS)

> File: `packages/shared-types/src/interfaces/shift.interface.ts`

```typescript
export interface Shift {
  /** MongoDB ObjectId */
  id: string;

  /** ID nhan vien thu ngan */
  cashierId: string;

  /** Ten nhan vien thu ngan */
  cashierName: string;

  /** Thoi diem mo ca */
  openedAt: string;

  /** Thoi diem dong ca (null = dang mo) */
  closedAt: string | null;

  /** So tien dau ca (VND) */
  openingCash: number;

  /** So tien cuoi ca (VND) */
  closingCash: number | null;

  /** Tong doanh thu trong ca (VND) */
  totalSales: number;

  /** Tong so don trong ca */
  totalOrders: number;

  /** Doanh thu tien mat (VND) */
  totalCashSales: number;

  /** Doanh thu chuyen khoan (VND) */
  totalBankSales: number;

  /** Tong giam gia trong ca (VND) */
  totalDiscounts: number;

  /** Danh sach ID don hang trong ca */
  orderIds: string[];

  /** Ghi chu dong ca */
  note: string | null;

  /** Ca da dong hay chua */
  isClosed: boolean;
}
```

---

## 13. Upload Types

> File: `packages/shared-types/src/interfaces/upload.interface.ts`

```typescript
import { UploadCategory } from '../enums';

export interface UploadedFile {
  /** MongoDB ObjectId */
  id: string;

  /** Ten file tren server */
  fileName: string;

  /** Ten file goc khi upload */
  originalName: string;

  /** Loai file (VD: 'image/jpeg', 'image/png', 'image/webp') */
  mimeType: string;

  /** Kich thuoc file (bytes) */
  size: number;

  /** Google Drive file ID */
  googleDriveFileId: string;

  /** URL xem file tren Google Drive */
  googleDriveWebViewUrl: string;

  /** URL download/embed file tu Google Drive */
  googleDriveWebContentUrl: string;

  /** ID nguoi upload */
  uploadedBy: string;

  /** Phan loai file */
  category: UploadCategory;

  createdAt: string;
}
```

---

## 14. Report Types

> File: `packages/shared-types/src/interfaces/report.interface.ts`

### DashboardStats

```typescript
import { OrderStatus } from '../enums';

export interface DashboardStats {
  /** Doanh thu hom nay (VND) */
  todayRevenue: number;

  /** Doanh thu tuan nay (VND) */
  weekRevenue: number;

  /** Doanh thu thang nay (VND) */
  monthRevenue: number;

  /** Tong so don hang (trong khoang thoi gian) */
  totalOrders: number;

  /** So don hang theo tung trang thai */
  ordersByStatus: Record<OrderStatus, number>;

  /** So khach hang moi (trong khoang thoi gian) */
  newCustomers: number;

  /** So san pham sap het hang */
  lowStockCount: number;
}
```

### RevenueData

```typescript
export interface RevenueData {
  /** Ngay (format: YYYY-MM-DD) */
  date: string;

  /** Doanh thu ngay do (VND) */
  revenue: number;

  /** So don hang ngay do */
  orders: number;
}
```

### TopProduct

```typescript
export interface TopProduct {
  /** ID san pham */
  productId: string;

  /** Ten san pham */
  name: string;

  /** URL hinh anh */
  image: string | null;

  /** Tong doanh thu (VND) */
  totalRevenue: number;

  /** Tong so luong ban */
  totalQuantity: number;
}
```

---

## 15. Utility Types

> File: `packages/shared-types/src/interfaces/common.interface.ts`

### PaginatedResponse\<T\>

```typescript
export interface PaginatedResponse<T> {
  /** Mang du lieu */
  data: T[];

  /** Thong tin phan trang */
  meta: {
    /** Tong so ban ghi */
    total: number;

    /** Trang hien tai */
    page: number;

    /** So ban ghi moi trang */
    limit: number;

    /** Tong so trang */
    totalPages: number;
  };
}
```

### ApiResponse\<T\>

```typescript
export interface ApiResponse<T> {
  /** Request thanh cong hay that bai */
  success: boolean;

  /** Du lieu tra ve (khi thanh cong) */
  data?: T;

  /** Thong bao (thanh cong hoac loi) */
  message?: string;

  /** Chi tiet loi (khi that bai) */
  error?: string;
}
```

### QueryParams

```typescript
export interface QueryParams {
  /** Trang hien tai (mac dinh: 1) */
  page?: number;

  /** So ban ghi moi trang (mac dinh: 20, toi da: 100) */
  limit?: number;

  /** Tu khoa tim kiem */
  search?: string;

  /** Truong sap xep (VD: 'createdAt', 'price', 'name') */
  sortBy?: string;

  /** Thu tu sap xep */
  sortOrder?: 'asc' | 'desc';
}
```

**Vi du su dung:**

```typescript
// API call voi query params
const response = await api.get<PaginatedResponse<Product>>('/products', {
  params: {
    page: 1,
    limit: 20,
    search: 'sofa',
    sortBy: 'price',
    sortOrder: 'asc',
  } satisfies QueryParams,
});

// Truy cap du lieu
const products = response.data.data;
const totalPages = response.data.meta.totalPages;
```

---

## 16. Socket Event Types

> File: `packages/shared-types/src/interfaces/socket.interface.ts`
> Dong bo voi `03-backend/14-socket-gateway.md`

### SocketEvents

```typescript
/**
 * Tat ca event names dung trong Socket.IO.
 * Su dung const enum de co the dung lam key va gia tri.
 */
export const SocketEvents = {
  // ----- Server -> Client (server emit) -----
  /** Don hang moi duoc tao (web hoac POS) */
  ORDER_CREATED: 'order:created',

  /** Trang thai don hang thay doi */
  ORDER_STATUS_UPDATED: 'order:status_updated',

  /** Shipper duoc gan cho don hang */
  ORDER_ASSIGNED: 'order:assigned',

  /** Cap nhat vi tri shipper */
  SHIPPER_LOCATION_UPDATED: 'shipper:location_updated',

  /** Trang thai shipper thay doi (online/offline/delivering) */
  SHIPPER_STATUS_CHANGED: 'shipper:status_changed',

  /** Thong bao ca nhan gui den user */
  NOTIFICATION: 'notification',

  /** Don POS moi duoc tao */
  POS_ORDER_CREATED: 'pos:order_created',

  /** Co danh gia moi can duyet */
  REVIEW_NEW: 'review:new',

  /** Co yeu cau tra hang moi */
  RETURN_REQUESTED: 'return:requested',

  /** Canh bao san pham sap het hang */
  STOCK_LOW: 'stock:low',

  // ----- Client -> Server (client emit) -----
  /** Yeu cau join room */
  JOIN_ROOM: 'join_room',

  /** Yeu cau leave room */
  LEAVE_ROOM: 'leave_room',

  /** Shipper gui vi tri GPS */
  SHIPPER_UPDATE_LOCATION: 'shipper:update_location',

  /** Shipper cap nhat trang thai */
  SHIPPER_UPDATE_STATUS: 'shipper:update_status',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
```

### Payload Interfaces

```typescript
// ============================================================
// Server-emitted event payloads
// ============================================================

/** Payload cho event: order:created va pos:order_created */
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  channel: 'web' | 'pos';
  createdAt: string;
}

/** Payload cho event: order:status_updated */
export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
}

/** Payload cho event: order:assigned */
export interface OrderAssignedPayload {
  orderId: string;
  orderNumber: string;
  shippingAddress: {
    fullAddress: string;
    province: string;
  };
}

/** Payload cho event: shipper:location_updated */
export interface ShipperLocationPayload {
  shipperId: string;
  shipperName: string;
  latitude: number;
  longitude: number;
  currentOrderId?: string;
  timestamp: string;
}

/** Payload cho event: shipper:status_changed */
export interface ShipperStatusPayload {
  shipperId: string;
  name: string;
  status: 'online' | 'offline' | 'delivering';
  timestamp: string;
}

/** Payload cho event: notification */
export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt: string;
}

/** Payload cho event: review:new */
export interface ReviewPayload {
  reviewId: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  customerName: string;
}

/** Payload cho event: return:requested */
export interface ReturnPayload {
  returnId: string;
  orderId: string;
  reason: string;
  createdAt: string;
}

/** Payload cho event: stock:low */
export interface StockAlertPayload {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  color?: string;
  dimension?: string;
}

// ============================================================
// Client-emitted event payloads
// ============================================================

/** Payload cho event: shipper:update_location */
export interface ShipperLocationUpdate {
  latitude: number;
  longitude: number;
  currentOrderId?: string;
}

/** Payload cho event: shipper:update_status */
export interface ShipperStatusUpdate {
  status: 'online' | 'offline' | 'delivering';
}
```

### Type-safe Socket Usage

```typescript
// Map event name -> payload type (cho type-safe socket)
export interface ServerToClientEvents {
  [SocketEvents.ORDER_CREATED]: (payload: OrderCreatedPayload) => void;
  [SocketEvents.ORDER_STATUS_UPDATED]: (payload: OrderStatusPayload) => void;
  [SocketEvents.ORDER_ASSIGNED]: (payload: OrderAssignedPayload) => void;
  [SocketEvents.SHIPPER_LOCATION_UPDATED]: (payload: ShipperLocationPayload) => void;
  [SocketEvents.SHIPPER_STATUS_CHANGED]: (payload: ShipperStatusPayload) => void;
  [SocketEvents.NOTIFICATION]: (payload: NotificationPayload) => void;
  [SocketEvents.POS_ORDER_CREATED]: (payload: OrderCreatedPayload) => void;
  [SocketEvents.REVIEW_NEW]: (payload: ReviewPayload) => void;
  [SocketEvents.RETURN_REQUESTED]: (payload: ReturnPayload) => void;
  [SocketEvents.STOCK_LOW]: (payload: StockAlertPayload) => void;
}

export interface ClientToServerEvents {
  [SocketEvents.JOIN_ROOM]: (room: string) => void;
  [SocketEvents.LEAVE_ROOM]: (room: string) => void;
  [SocketEvents.SHIPPER_UPDATE_LOCATION]: (data: ShipperLocationUpdate) => void;
  [SocketEvents.SHIPPER_UPDATE_STATUS]: (data: ShipperStatusUpdate) => void;
}
```

**Vi du su dung type-safe socket trong frontend:**

```typescript
import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketEvents,
} from '@shared-types';

// Tao typed socket
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  process.env.NEXT_PUBLIC_API_URL!,
  {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
  },
);

// Type-safe event listening
socket.on(SocketEvents.ORDER_STATUS_UPDATED, (payload) => {
  // payload duoc tu dong infer kieu OrderStatusPayload
  console.log(payload.orderNumber, payload.newStatus);
});

// Type-safe event emitting
socket.emit(SocketEvents.JOIN_ROOM, `room:order:${orderId}`);
```

---

## Cau truc file tong hop

```
packages/shared-types/src/
├── index.ts                         # Re-export tat ca
├── enums.ts                         # Tat ca enums + label maps + color maps
├── constants.ts                     # Constants (shipping, pagination, jwt, upload...)
└── interfaces/
    ├── index.ts                     # Re-export tat ca interfaces
    ├── common.interface.ts          # PaginatedResponse, ApiResponse, QueryParams
    ├── user.interface.ts            # User, Address, AuthResponse, LoginCredentials, RegisterData
    ├── product.interface.ts         # Product, ProductColor, ProductDimension, ProductVariant, ...
    ├── category.interface.ts        # Category
    ├── order.interface.ts           # Order, OrderItem, OrderStatusHistory, CreateOrderDto, CreatePosOrderDto
    ├── review.interface.ts          # Review, ReviewStats, CreateReviewDto
    ├── wishlist.interface.ts        # WishlistItem
    ├── coupon.interface.ts          # Coupon, CouponValidation
    ├── return.interface.ts          # Return, ReturnItem, CreateReturnDto
    ├── shipper.interface.ts         # ShipperLocation, ShipperStats, ShipperEarning
    ├── notification.interface.ts    # Notification
    ├── shift.interface.ts           # Shift
    ├── upload.interface.ts          # UploadedFile
    ├── report.interface.ts          # DashboardStats, RevenueData, TopProduct
    └── socket.interface.ts          # SocketEvents, all payload interfaces, typed socket maps

apps/fe/src/types/
├── index.ts                         # Re-export tu @shared-types
└── (khong can file rieng - dung truc tiep tu shared-types)
```

---

> **Luu y quan trong:**
> - Tat ca `id` tren frontend la `string` (MongoDB ObjectId duoc chuyen thanh string qua API)
> - Tat ca `Date` tren frontend la `string` (ISO 8601 format, VD: `'2026-04-02T10:30:00.000Z'`)
> - `PaymentMethod` CHI co 3 gia tri: `cash`, `bank_transfer`, `cod`
> - Khi them interface moi, phai dong thoi cap nhat file nay va backend schema tuong ung
> - Su dung `@shared-types` import path (cau hinh trong `tsconfig.json` cua monorepo)
