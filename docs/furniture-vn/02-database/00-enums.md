# ENUMS & CONSTANTS

> File goc: `packages/shared-types/src/enums.ts`
> Shared package duoc su dung boi ca backend (NestJS) va frontend (Next.js).
> Moi thay doi enum phai dong bo ca 2 phia.

---

## Muc luc

1. [UserRole](#1-userrole)
2. [OrderStatus](#2-orderstatus)
3. [PaymentStatus](#3-paymentstatus)
4. [PaymentMethod](#4-paymentmethod)
5. [ProductStatus](#5-productstatus)
6. [ShipperStatus](#6-shipperstatus)
7. [NotificationType](#7-notificationtype)
8. [DiscountType](#8-discounttype)
9. [ReviewStatus](#9-reviewstatus)
10. [ReturnStatus](#10-returnstatus)
11. [ReturnReason](#11-returnreason)
12. [CouponScope](#12-couponscope)
13. [ShiftStatus](#13-shiftstatus)
14. [UploadCategory](#14-uploadcategory)
15. [Label Maps](#15-label-maps)
16. [Color Maps](#16-color-maps)
17. [Constants](#17-constants)

---

## 1. UserRole

Phan quyen nguoi dung trong he thong.

```typescript
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CUSTOMER = 'customer',
  SHIPPER = 'shipper',
}
```

| Gia tri    | Mo ta                                              |
| ---------- | -------------------------------------------------- |
| `admin`    | Quan tri vien toan quyen, quan ly toan bo he thong  |
| `manager`  | Quan ly cua hang, duyet don, quan ly nhan vien      |
| `staff`    | Nhan vien ban hang, xu ly don hang tai cua hang     |
| `customer` | Khach hang mua sam online va tai cua hang           |
| `shipper`  | Tai xe giao hang, cap nhat trang thai van chuyen    |

---

## 2. OrderStatus

Trang thai don hang - theo flow: tao don -> xac nhan -> chuan bi -> cho lay -> dang giao -> da giao.

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  WAITING_PICKUP = 'waiting_pickup',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}
```

**Flow chinh:**

```
pending -> confirmed -> preparing -> waiting_pickup -> in_transit -> delivered
                                                                       |
                                                                       v
                                                                   returned -> refunded
```

**Flow huy:**

```
pending -----> cancelled
confirmed ---> cancelled
```

| Gia tri          | Mo ta                                        |
| ---------------- | -------------------------------------------- |
| `pending`        | Don moi tao, cho xac nhan tu staff/manager   |
| `confirmed`      | Da xac nhan, cho chuan bi hang               |
| `preparing`      | Dang dong goi, chuan bi hang                 |
| `waiting_pickup` | Hang da san sang, cho shipper den lay         |
| `in_transit`     | Shipper dang giao hang cho khach              |
| `delivered`      | Da giao thanh cong, khach da nhan hang        |
| `cancelled`      | Don bi huy (boi khach hoac staff)             |
| `returned`       | Khach tra hang, dang xu ly hoan tien          |
| `refunded`       | Da hoan tien thanh cong                       |

---

## 3. PaymentStatus

Trang thai thanh toan cua don hang.

```typescript
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}
```

| Gia tri    | Mo ta                                           |
| ---------- | ----------------------------------------------- |
| `unpaid`   | Chua thanh toan                                 |
| `paid`     | Da thanh toan toan bo                           |
| `partial`  | Thanh toan mot phan (dat coc noi that lon)      |
| `refunded` | Da hoan tien                                    |
| `failed`   | Thanh toan that bai                             |

> **Luu y:** `partial` dung cho truong hop khach dat coc san pham noi that gia tri lon (sofa, ban an, giuong...). He thong ghi nhan so tien da tra va so tien con lai.

---

## 4. PaymentMethod

Phuong thuc thanh toan duoc ho tro.

```typescript
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod',
}
```

| Gia tri         | Mo ta                                           |
| --------------- | ----------------------------------------------- |
| `cash`          | Thanh toan tien mat tai cua hang                |
| `bank_transfer` | Chuyen khoan ngan hang (xac nhan thu cong)      |
| `cod`           | Thanh toan khi nhan hang (shipper thu tien)     |

> **QUAN TRONG:** He thong CHI ho tro 3 phuong thuc tren. KHONG tich hop VNPay, Momo hay bat ky cong thanh toan dien tu nao. Moi thanh toan chuyen khoan duoc staff/manager xac nhan thu cong qua admin panel.

---

## 5. ProductStatus

Trang thai san pham tren he thong.

```typescript
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}
```

| Gia tri        | Mo ta                                            |
| -------------- | ------------------------------------------------ |
| `active`       | Dang ban, hien thi tren website                  |
| `inactive`     | Tam an, khong hien thi nhung con trong kho       |
| `out_of_stock` | Het hang, hien thi nhung khong cho mua            |
| `discontinued` | Ngung kinh doanh vinh vien, an khoi catalog      |

---

## 6. ShipperStatus

Trang thai hoat dong cua shipper.

```typescript
export enum ShipperStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}
```

| Gia tri     | Mo ta                                           |
| ----------- | ----------------------------------------------- |
| `available` | San sang nhan don giao hang moi                 |
| `busy`      | Dang giao hang, khong nhan don moi              |
| `offline`   | Nghi lam, khong hoat dong                       |

---

## 7. NotificationType

Loai thong bao trong he thong.

```typescript
export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  PAYMENT_RECEIVED = 'payment_received',
  SHIPPER_ASSIGNED = 'shipper_assigned',
  LOW_STOCK = 'low_stock',
  NEW_REVIEW = 'new_review',
  RETURN_REQUESTED = 'return_requested',
  SYSTEM = 'system',
}
```

| Gia tri                | Gui den            | Mo ta                                  |
| ---------------------- | ------------------ | -------------------------------------- |
| `order_created`        | staff, manager     | Co don hang moi can xu ly              |
| `order_status_changed` | customer           | Trang thai don hang thay doi           |
| `payment_received`     | staff, manager     | Nhan duoc thanh toan (chuyen khoan)    |
| `shipper_assigned`     | shipper            | Duoc phan cong don giao hang moi       |
| `low_stock`            | manager            | San pham sap het hang (duoi nguong)    |
| `new_review`           | staff, manager     | Co danh gia moi can duyet              |
| `return_requested`     | staff, manager     | Khach yeu cau tra hang                 |
| `system`               | tat ca             | Thong bao he thong (bao tri, cap nhat) |

---

## 8. DiscountType

Loai giam gia ap dung cho coupon va khuyen mai.

```typescript
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}
```

| Gia tri      | Mo ta                                               |
| ------------ | --------------------------------------------------- |
| `percentage` | Giam theo phan tram (vd: 10% tong don)              |
| `fixed`      | Giam so tien co dinh (vd: 500.000d tong don)        |

---

## 9. ReviewStatus

Trang thai danh gia san pham. Moi danh gia phai duoc duyet truoc khi hien thi.

```typescript
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}
```

| Gia tri    | Mo ta                                                |
| ---------- | ---------------------------------------------------- |
| `pending`  | Cho duyet, chua hien thi tren website                |
| `approved` | Da duyet, hien thi cong khai                         |
| `rejected` | Bi tu choi (noi dung khong phu hop, spam)            |
| `flagged`  | Bi bao cao boi nguoi dung khac, can xem xet lai      |

---

## 10. ReturnStatus

Trang thai yeu cau tra hang/doi hang.

```typescript
export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

**Flow tra hang:**

```
requested -> approved -> processing -> completed
    |            |
    v            v
cancelled    rejected
```

| Gia tri      | Mo ta                                             |
| ------------ | ------------------------------------------------- |
| `requested`  | Khach gui yeu cau tra hang                        |
| `approved`   | Staff/manager chap nhan yeu cau                   |
| `rejected`   | Tu choi yeu cau tra hang                          |
| `processing` | Dang xu ly: nhan hang tra, kiem tra chat luong     |
| `completed`  | Hoan tat tra hang, da hoan tien                   |
| `cancelled`  | Khach huy yeu cau tra hang                        |

---

## 11. ReturnReason

Ly do tra hang.

```typescript
export enum ReturnReason {
  WRONG_ITEM = 'wrong_item',
  DAMAGED = 'damaged',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DEFECTIVE = 'defective',
  OTHER = 'other',
}
```

| Gia tri            | Mo ta                                          |
| ------------------ | ---------------------------------------------- |
| `wrong_item`       | Giao sai san pham                              |
| `damaged`          | Hang bi hu hong trong qua trinh van chuyen     |
| `not_as_described` | Hang khong dung mo ta (mau sac, kich thuoc...) |
| `changed_mind`     | Khach doi y, khong muon mua nua                |
| `defective`        | San pham bi loi ky thuat, khong su dung duoc   |
| `other`            | Ly do khac (khach ghi chi tiet trong ghi chu)  |

---

## 12. CouponScope

Pham vi ap dung cua ma giam gia.

```typescript
export enum CouponScope {
  ALL = 'all',
  CATEGORY = 'category',
  PRODUCT = 'product',
}
```

| Gia tri    | Mo ta                                                    |
| ---------- | -------------------------------------------------------- |
| `all`      | Ap dung cho toan bo don hang                             |
| `category` | Chi ap dung cho danh muc cu the (vd: chi sofa, chi ban)  |
| `product`  | Chi ap dung cho san pham cu the (theo product_id)        |

> Khi `scope = category`, truong `scope_ids` trong bang `coupons` chua danh sach `category_id`.
> Khi `scope = product`, truong `scope_ids` chua danh sach `product_id`.

---

## 13. ShiftStatus

Trang thai ca lam viec (POS).

```typescript
export enum ShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}
```

| Gia tri  | Mo ta                                                   |
| -------- | ------------------------------------------------------- |
| `open`   | Ca dang mo, staff co the tao don va thu tien            |
| `closed` | Ca da dong, da doi soat tien va ket thuc ban hang       |

---

## 14. UploadCategory

Phan loai file upload de to chuc luu tru tren cloud storage.

```typescript
export enum UploadCategory {
  PRODUCT = 'product',
  AVATAR = 'avatar',
  BANNER = 'banner',
  PROOF = 'proof',
  REVIEW = 'review',
  OTHER = 'other',
}
```

| Gia tri   | Thu muc luu tru       | Mo ta                                       |
| --------- | --------------------- | ------------------------------------------- |
| `product` | `uploads/products/`   | Hinh anh san pham (nhieu anh/san pham)      |
| `avatar`  | `uploads/avatars/`    | Anh dai dien nguoi dung                     |
| `banner`  | `uploads/banners/`    | Banner quang cao trang chu                  |
| `proof`   | `uploads/proofs/`     | Anh xac nhan chuyen khoan, bien lai        |
| `review`  | `uploads/reviews/`    | Hinh anh dinh kem trong danh gia san pham   |
| `other`   | `uploads/others/`     | File khac                                   |

---

## 15. Label Maps

Map nhan tieng Viet cho tung enum, dung de hien thi tren giao dien (UI).

### UserRoleLabel

```typescript
export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Quan tri vien',
  [UserRole.MANAGER]: 'Quan ly',
  [UserRole.STAFF]: 'Nhan vien',
  [UserRole.CUSTOMER]: 'Khach hang',
  [UserRole.SHIPPER]: 'Tai xe giao hang',
};
```

### OrderStatusLabel

```typescript
export const OrderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Cho xac nhan',
  [OrderStatus.CONFIRMED]: 'Da xac nhan',
  [OrderStatus.PREPARING]: 'Dang chuan bi',
  [OrderStatus.WAITING_PICKUP]: 'Cho lay hang',
  [OrderStatus.IN_TRANSIT]: 'Dang giao hang',
  [OrderStatus.DELIVERED]: 'Da giao hang',
  [OrderStatus.CANCELLED]: 'Da huy',
  [OrderStatus.RETURNED]: 'Da tra hang',
  [OrderStatus.REFUNDED]: 'Da hoan tien',
};
```

### PaymentStatusLabel

```typescript
export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Chua thanh toan',
  [PaymentStatus.PAID]: 'Da thanh toan',
  [PaymentStatus.PARTIAL]: 'Thanh toan mot phan',
  [PaymentStatus.REFUNDED]: 'Da hoan tien',
  [PaymentStatus.FAILED]: 'That bai',
};
```

### PaymentMethodLabel

```typescript
export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tien mat',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyen khoan',
  [PaymentMethod.COD]: 'Thanh toan khi nhan hang',
};
```

### ProductStatusLabel

```typescript
export const ProductStatusLabel: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: 'Dang ban',
  [ProductStatus.INACTIVE]: 'Tam ngung',
  [ProductStatus.OUT_OF_STOCK]: 'Het hang',
  [ProductStatus.DISCONTINUED]: 'Ngung kinh doanh',
};
```

### ShipperStatusLabel

```typescript
export const ShipperStatusLabel: Record<ShipperStatus, string> = {
  [ShipperStatus.AVAILABLE]: 'San sang',
  [ShipperStatus.BUSY]: 'Dang ban',
  [ShipperStatus.OFFLINE]: 'Nghi lam',
};
```

### NotificationTypeLabel

```typescript
export const NotificationTypeLabel: Record<NotificationType, string> = {
  [NotificationType.ORDER_CREATED]: 'Don hang moi',
  [NotificationType.ORDER_STATUS_CHANGED]: 'Cap nhat don hang',
  [NotificationType.PAYMENT_RECEIVED]: 'Nhan thanh toan',
  [NotificationType.SHIPPER_ASSIGNED]: 'Phan cong giao hang',
  [NotificationType.LOW_STOCK]: 'Sap het hang',
  [NotificationType.NEW_REVIEW]: 'Danh gia moi',
  [NotificationType.RETURN_REQUESTED]: 'Yeu cau tra hang',
  [NotificationType.SYSTEM]: 'He thong',
};
```

### DiscountTypeLabel

```typescript
export const DiscountTypeLabel: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Phan tram',
  [DiscountType.FIXED]: 'So tien co dinh',
};
```

### ReviewStatusLabel

```typescript
export const ReviewStatusLabel: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'Cho duyet',
  [ReviewStatus.APPROVED]: 'Da duyet',
  [ReviewStatus.REJECTED]: 'Tu choi',
  [ReviewStatus.FLAGGED]: 'Bi bao cao',
};
```

### ReturnStatusLabel

```typescript
export const ReturnStatusLabel: Record<ReturnStatus, string> = {
  [ReturnStatus.REQUESTED]: 'Da yeu cau',
  [ReturnStatus.APPROVED]: 'Da chap nhan',
  [ReturnStatus.REJECTED]: 'Tu choi',
  [ReturnStatus.PROCESSING]: 'Dang xu ly',
  [ReturnStatus.COMPLETED]: 'Hoan tat',
  [ReturnStatus.CANCELLED]: 'Da huy',
};
```

### ReturnReasonLabel

```typescript
export const ReturnReasonLabel: Record<ReturnReason, string> = {
  [ReturnReason.WRONG_ITEM]: 'Giao sai san pham',
  [ReturnReason.DAMAGED]: 'Hang bi hu hong',
  [ReturnReason.NOT_AS_DESCRIBED]: 'Khong dung mo ta',
  [ReturnReason.CHANGED_MIND]: 'Doi y',
  [ReturnReason.DEFECTIVE]: 'San pham bi loi',
  [ReturnReason.OTHER]: 'Ly do khac',
};
```

### CouponScopeLabel

```typescript
export const CouponScopeLabel: Record<CouponScope, string> = {
  [CouponScope.ALL]: 'Toan bo',
  [CouponScope.CATEGORY]: 'Theo danh muc',
  [CouponScope.PRODUCT]: 'Theo san pham',
};
```

### ShiftStatusLabel

```typescript
export const ShiftStatusLabel: Record<ShiftStatus, string> = {
  [ShiftStatus.OPEN]: 'Dang mo',
  [ShiftStatus.CLOSED]: 'Da dong',
};
```

### UploadCategoryLabel

```typescript
export const UploadCategoryLabel: Record<UploadCategory, string> = {
  [UploadCategory.PRODUCT]: 'Hinh san pham',
  [UploadCategory.AVATAR]: 'Anh dai dien',
  [UploadCategory.BANNER]: 'Banner',
  [UploadCategory.PROOF]: 'Bien lai',
  [UploadCategory.REVIEW]: 'Hinh danh gia',
  [UploadCategory.OTHER]: 'Khac',
};
```

---

## 16. Color Maps

Map mau sac cho cac status enum, dung cho badge/tag tren giao dien. Su dung Tailwind CSS classes.

### OrderStatusColor

```typescript
export const OrderStatusColor: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PREPARING]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.WAITING_PICKUP]: 'bg-purple-100 text-purple-800',
  [OrderStatus.IN_TRANSIT]: 'bg-cyan-100 text-cyan-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [OrderStatus.RETURNED]: 'bg-orange-100 text-orange-800',
  [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
};
```

### PaymentStatusColor

```typescript
export const PaymentStatusColor: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'bg-red-100 text-red-800',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.PARTIAL]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
};
```

### ProductStatusColor

```typescript
export const ProductStatusColor: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ProductStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
  [ProductStatus.OUT_OF_STOCK]: 'bg-orange-100 text-orange-800',
  [ProductStatus.DISCONTINUED]: 'bg-red-100 text-red-800',
};
```

### ShipperStatusColor

```typescript
export const ShipperStatusColor: Record<ShipperStatus, string> = {
  [ShipperStatus.AVAILABLE]: 'bg-green-100 text-green-800',
  [ShipperStatus.BUSY]: 'bg-yellow-100 text-yellow-800',
  [ShipperStatus.OFFLINE]: 'bg-gray-100 text-gray-800',
};
```

### ReviewStatusColor

```typescript
export const ReviewStatusColor: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ReviewStatus.APPROVED]: 'bg-green-100 text-green-800',
  [ReviewStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ReviewStatus.FLAGGED]: 'bg-orange-100 text-orange-800',
};
```

### ReturnStatusColor

```typescript
export const ReturnStatusColor: Record<ReturnStatus, string> = {
  [ReturnStatus.REQUESTED]: 'bg-yellow-100 text-yellow-800',
  [ReturnStatus.APPROVED]: 'bg-blue-100 text-blue-800',
  [ReturnStatus.REJECTED]: 'bg-red-100 text-red-800',
  [ReturnStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800',
  [ReturnStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ReturnStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
};
```

### ShiftStatusColor

```typescript
export const ShiftStatusColor: Record<ShiftStatus, string> = {
  [ShiftStatus.OPEN]: 'bg-green-100 text-green-800',
  [ShiftStatus.CLOSED]: 'bg-gray-100 text-gray-800',
};
```

---

## 17. Constants

File: `packages/shared-types/src/constants.ts`

### SHIPPING_FEE_CONFIG

Phi van chuyen theo khu vuc. Noi that thuong co kich thuoc lon nen phi ship cao hon hang thuong.

```typescript
export const SHIPPING_FEE_CONFIG = {
  /** Noi thanh TP.HCM va Ha Noi */
  INNER_CITY: 30_000,

  /** Ngoai thanh TP.HCM va Ha Noi */
  SUBURBAN: 50_000,

  /** Tinh lan can (Binh Duong, Dong Nai, Long An, Bac Ninh, Hung Yen...) */
  NEARBY_PROVINCE: 80_000,

  /** Cac tinh khac */
  OTHER_PROVINCE: 150_000,

  /** Don hang tren muc nay duoc mien phi ship noi thanh (VND) */
  FREE_SHIP_THRESHOLD: 2_000_000,

  /** Phu phi cho san pham cong kenh (sofa, tu, giuong...) - tinh theo san pham */
  BULKY_ITEM_SURCHARGE: 200_000,
} as const;
```

### PAGINATION

Cau hinh phan trang mac dinh.

```typescript
export const PAGINATION = {
  /** So item mac dinh moi trang */
  DEFAULT_PAGE_SIZE: 20,

  /** So item toi da moi trang (chong abuse) */
  MAX_PAGE_SIZE: 100,

  /** Trang bat dau */
  DEFAULT_PAGE: 1,
} as const;
```

### JWT_CONFIG

Cau hinh thoi gian het han cho JSON Web Token.

```typescript
export const JWT_CONFIG = {
  /** Access token het han sau 15 phut */
  ACCESS_TOKEN_EXPIRES_IN: '15m',

  /** Refresh token het han sau 7 ngay */
  REFRESH_TOKEN_EXPIRES_IN: '7d',

  /** Token reset password het han sau 1 gio */
  RESET_PASSWORD_EXPIRES_IN: '1h',

  /** Token xac nhan email het han sau 24 gio */
  EMAIL_VERIFICATION_EXPIRES_IN: '24h',
} as const;
```

### FILE_UPLOAD

Gioi han upload file.

```typescript
export const FILE_UPLOAD = {
  /** Kich thuoc toi da moi file (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /** So luong anh toi da cho moi san pham */
  MAX_PRODUCT_IMAGES: 10,

  /** So luong anh toi da cho moi danh gia */
  MAX_REVIEW_IMAGES: 5,

  /** Dinh dang file cho phep */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  /** Kich thuoc toi da anh avatar (2MB) */
  MAX_AVATAR_SIZE: 2 * 1024 * 1024,
} as const;
```

### LOYALTY_POINTS

Cau hinh diem thuong khach hang.

```typescript
export const LOYALTY_POINTS = {
  /** So diem thuong cho moi 1.000 VND trong don hang */
  POINTS_PER_1000_VND: 1,

  /** So diem toi thieu de doi thuong */
  MIN_REDEEM_POINTS: 100,

  /** Gia tri VND cua moi diem khi doi thuong */
  VND_PER_POINT: 1_000,

  /** So diem thuong khi danh gia san pham (da duyet) */
  POINTS_PER_REVIEW: 50,

  /** So diem thuong khi dang ky tai khoan moi */
  POINTS_ON_SIGNUP: 200,
} as const;
```

### INVENTORY

Cau hinh canh bao ton kho.

```typescript
export const INVENTORY = {
  /** Nguong canh bao het hang (gui notification LOW_STOCK) */
  LOW_STOCK_THRESHOLD: 5,

  /** Thoi gian giu hang trong gio hang (phut) */
  CART_RESERVATION_MINUTES: 30,
} as const;
```

---

## Su dung trong code

### Backend (NestJS) - Import enum

```typescript
import { OrderStatus, PaymentMethod } from '@shared-types/enums';

// Validate trong DTO
@IsEnum(OrderStatus)
status: OrderStatus;

// Dung trong Prisma query
const orders = await prisma.order.findMany({
  where: { status: OrderStatus.PENDING },
});
```

### Frontend (Next.js) - Import label & color

```typescript
import {
  OrderStatus,
  OrderStatusLabel,
  OrderStatusColor,
} from '@shared-types/enums';

// Render badge
function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${OrderStatusColor[status]}`}>
      {OrderStatusLabel[status]}
    </span>
  );
}
```

### Tao helper function

```typescript
// Helper: lay danh sach options cho Select/Dropdown
export function getEnumOptions<T extends string>(
  enumObj: Record<string, T>,
  labelMap: Record<T, string>,
): Array<{ value: T; label: string }> {
  return Object.values(enumObj).map((value) => ({
    value,
    label: labelMap[value],
  }));
}

// Su dung:
const orderStatusOptions = getEnumOptions(OrderStatus, OrderStatusLabel);
// => [{ value: 'pending', label: 'Cho xac nhan' }, ...]
```

---

> **Luu y khi them enum moi:**
> 1. Them enum vao file `packages/shared-types/src/enums.ts`
> 2. Them Label Map tuong ung
> 3. Them Color Map (neu la status enum)
> 4. Export tu `packages/shared-types/src/index.ts`
> 5. Cap nhat tai lieu nay
> 6. Chay `pnpm build:shared` de build lai shared package
