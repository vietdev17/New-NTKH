# FRONTEND PROJECT STRUCTURE - Next.js 14

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Cau truc thu muc, route groups, providers, middleware, va cac quy uoc frontend
> Phien ban: 2.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Cau truc thu muc tong the](#1-cau-truc-thu-muc-tong-the)
2. [Route Groups - Chia ung dung theo vai tro](#2-route-groups---chia-ung-dung-theo-vai-tro)
3. [Providers Setup](#3-providers-setup)
4. [Root Layout](#4-root-layout)
5. [Middleware - Xac thuc va phan quyen](#5-middleware---xac-thuc-va-phan-quyen)
6. [Bien moi truong (Environment Variables)](#6-bien-moi-truong)
7. [Cac quy uoc quan trong](#7-cac-quy-uoc-quan-trong)
8. [Bang tong hop cong nghe Frontend](#8-bang-tong-hop-cong-nghe-frontend)

---

## 1. Cau truc thu muc tong the

```
apps/fe/
├── public/
│   ├── icons/                         # PWA icons (192x192, 512x512)
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   ├── images/                        # Static images (logo, banners)
│   │   ├── logo.svg
│   │   └── placeholder.webp
│   ├── manifest.json                  # PWA manifest
│   └── sw.js                          # Service Worker (offline support cho Shipper)
│
├── src/
│   ├── app/
│   │   ├── (customer)/                # -------- ROUTE GROUP: Customer Web --------
│   │   │   ├── layout.tsx             # Customer layout (Header + Footer + Breadcrumb)
│   │   │   ├── page.tsx               # Trang chu (Home) - SSR
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Danh sach san pham (co filter, sort, pagination)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       # Chi tiet san pham (generateMetadata dynamic)
│   │   │   │
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       # San pham theo danh muc
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   └── page.tsx           # Gio hang (client component - Zustand)
│   │   │   │
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx           # Trang thanh toan (protected)
│   │   │   │   └── success/
│   │   │   │       └── page.tsx       # Dat hang thanh cong
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # Danh sach don hang cua toi (protected)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Chi tiet don hang
│   │   │   │       └── tracking/
│   │   │   │           └── page.tsx   # Theo doi don hang real-time (Socket.IO)
│   │   │   │
│   │   │   ├── reviews/
│   │   │   │   └── page.tsx           # Danh gia cua toi (protected)
│   │   │   │
│   │   │   ├── wishlist/
│   │   │   │   └── page.tsx           # Danh sach yeu thich (protected)
│   │   │   │
│   │   │   ├── compare/
│   │   │   │   └── page.tsx           # So sanh san pham (toi da 4 san pham)
│   │   │   │
│   │   │   ├── search/
│   │   │   │   └── page.tsx           # Ket qua tim kiem (searchParams)
│   │   │   │
│   │   │   ├── account/
│   │   │   │   ├── page.tsx           # Tong quan tai khoan (protected)
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx       # Cap nhat thong tin ca nhan
│   │   │   │   ├── addresses/
│   │   │   │   │   └── page.tsx       # Quan ly dia chi giao hang
│   │   │   │   └── notifications/
│   │   │   │       └── page.tsx       # Thong bao cua toi
│   │   │   │
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Dang nhap
│   │   │   ├── register/
│   │   │   │   └── page.tsx           # Dang ky
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx           # Quen mat khau
│   │   │   └── reset-password/
│   │   │       └── page.tsx           # Dat lai mat khau
│   │   │
│   │   ├── admin/                     # -------- ROUTE GROUP: Admin Dashboard --------
│   │   │   ├── layout.tsx             # Admin layout (Sidebar + Topbar + Breadcrumb)
│   │   │   ├── page.tsx               # Dashboard (thong ke tong quan)
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Danh sach san pham (DataTable)
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx       # Tao san pham moi
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx   # Chinh sua san pham
│   │   │   │
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx           # Quan ly danh muc (tree view)
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx   # Chinh sua danh muc
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # Quan ly don hang (filter theo trang thai)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Chi tiet don hang (cap nhat trang thai)
│   │   │   │
│   │   │   ├── returns/
│   │   │   │   ├── page.tsx           # Danh sach yeu cau tra hang
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Xu ly yeu cau tra hang
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx           # Danh sach khach hang
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Chi tiet khach hang + lich su mua
│   │   │   │
│   │   │   ├── shippers/
│   │   │   │   ├── page.tsx           # Danh sach shipper
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Chi tiet shipper + hieu suat
│   │   │   │
│   │   │   ├── coupons/
│   │   │   │   ├── page.tsx           # Danh sach ma giam gia
│   │   │   │   └── create/
│   │   │   │       └── page.tsx       # Tao coupon moi
│   │   │   │
│   │   │   ├── reviews/
│   │   │   │   └── page.tsx           # Quan ly danh gia (duyet, an, xoa)
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx           # Tong quan bao cao
│   │   │   │   ├── revenue/
│   │   │   │   │   └── page.tsx       # Bao cao doanh thu (bieu do)
│   │   │   │   ├── products/
│   │   │   │   │   └── page.tsx       # Bao cao san pham ban chay
│   │   │   │   └── customers/
│   │   │   │       └── page.tsx       # Bao cao khach hang
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx           # Quan ly nhan vien
│   │   │   │   └── create/
│   │   │   │       └── page.tsx       # Them nhan vien moi
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx           # Cai dat he thong
│   │   │
│   │   ├── pos/                       # -------- ROUTE GROUP: POS Terminal --------
│   │   │   ├── layout.tsx             # POS layout (toi gian, toi uu man hinh cam ung)
│   │   │   ├── page.tsx               # Man hinh ban hang chinh (san pham + gio hang)
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # Don hang trong ca
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Chi tiet don hang POS
│   │   │   │
│   │   │   ├── shifts/
│   │   │   │   ├── page.tsx           # Quan ly ca lam viec
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Chi tiet ca (doanh thu, so don)
│   │   │   │
│   │   │   ├── returns/
│   │   │   │   └── page.tsx           # Xu ly tra hang tai quay
│   │   │   │
│   │   │   └── reports/
│   │   │       └── page.tsx           # Bao cao ban hang trong ngay
│   │   │
│   │   ├── shipper/                   # -------- ROUTE GROUP: Shipper PWA --------
│   │   │   ├── layout.tsx             # Shipper layout (mobile-first, bottom nav)
│   │   │   ├── page.tsx               # Dashboard shipper (don can giao)
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx           # Danh sach don hang duoc gan
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Chi tiet don giao (ban do, cap nhat trang thai)
│   │   │   │
│   │   │   ├── earnings/
│   │   │   │   └── page.tsx           # Thu nhap (thong ke theo ngay/tuan/thang)
│   │   │   │
│   │   │   ├── history/
│   │   │   │   └── page.tsx           # Lich su giao hang
│   │   │   │
│   │   │   └── profile/
│   │   │       └── page.tsx           # Thong tin shipper
│   │   │
│   │   ├── layout.tsx                 # Root layout (HTML, font, metadata, providers)
│   │   ├── providers.tsx              # Global providers (ReactQuery, Toaster)
│   │   ├── not-found.tsx              # Trang 404 tuy chinh
│   │   ├── error.tsx                  # Error boundary toan cuc
│   │   └── loading.tsx                # Loading UI toan cuc
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (khong chinh sua)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── ...                    # Cac component shadcn/ui khac
│   │   │
│   │   ├── shared/                    # Components dung chung moi route group
│   │   │   ├── data-table.tsx         # DataTable component (tanstack/react-table)
│   │   │   ├── image-upload.tsx       # Upload anh (Cloudinary)
│   │   │   ├── confirm-dialog.tsx     # Dialog xac nhan hanh dong
│   │   │   ├── loading-spinner.tsx    # Loading spinner
│   │   │   ├── empty-state.tsx        # Trang thai rong (khong co du lieu)
│   │   │   ├── price-display.tsx      # Hien thi gia tien (format VND)
│   │   │   ├── status-badge.tsx       # Badge trang thai (don hang, tra hang...)
│   │   │   ├── pagination-control.tsx # Dieu khien phan trang
│   │   │   ├── search-input.tsx       # O tim kiem voi debounce
│   │   │   └── notification-bell.tsx  # Chuong thong bao real-time
│   │   │
│   │   ├── customer/                  # Components rieng cho Customer
│   │   │   ├── header.tsx             # Header (logo, nav, search, cart icon, user menu)
│   │   │   ├── footer.tsx             # Footer (lien he, chinh sach, mang xa hoi)
│   │   │   ├── product-card.tsx       # Card san pham (anh, ten, gia, add to cart)
│   │   │   ├── product-gallery.tsx    # Gallery anh san pham (zoom, swipe)
│   │   │   ├── product-filters.tsx    # Bo loc san pham (gia, danh muc, thuong hieu)
│   │   │   ├── cart-sidebar.tsx       # Sidebar gio hang (slide-over)
│   │   │   ├── cart-item.tsx          # Item trong gio hang
│   │   │   ├── checkout-form.tsx      # Form thanh toan (dia chi, phuong thuc)
│   │   │   ├── order-status-tracker.tsx # Timeline trang thai don hang
│   │   │   ├── review-form.tsx        # Form viet danh gia
│   │   │   ├── review-list.tsx        # Danh sach danh gia
│   │   │   ├── comparison-table.tsx   # Bang so sanh san pham
│   │   │   ├── wishlist-button.tsx    # Nut yeu thich (toggle)
│   │   │   ├── compare-button.tsx     # Nut them vao so sanh
│   │   │   ├── breadcrumb.tsx         # Breadcrumb navigation
│   │   │   └── hero-banner.tsx        # Banner trang chu
│   │   │
│   │   ├── admin/                     # Components rieng cho Admin
│   │   │   ├── sidebar.tsx            # Sidebar dieu huong
│   │   │   ├── topbar.tsx             # Thanh tren (user info, notifications)
│   │   │   ├── stats-card.tsx         # Card thong ke (doanh thu, don hang...)
│   │   │   ├── revenue-chart.tsx      # Bieu do doanh thu (recharts)
│   │   │   ├── order-status-chart.tsx # Bieu do trang thai don hang
│   │   │   ├── product-form.tsx       # Form tao/sua san pham
│   │   │   ├── category-tree.tsx      # Cay danh muc (drag & drop)
│   │   │   ├── order-timeline.tsx     # Timeline xu ly don hang
│   │   │   ├── coupon-form.tsx        # Form tao ma giam gia
│   │   │   └── staff-form.tsx         # Form quan ly nhan vien
│   │   │
│   │   ├── pos/                       # Components rieng cho POS
│   │   │   ├── product-grid.tsx       # Luoi san pham (touch-friendly)
│   │   │   ├── pos-cart.tsx           # Gio hang POS (ben phai man hinh)
│   │   │   ├── payment-modal.tsx      # Modal thanh toan
│   │   │   ├── receipt-preview.tsx    # Xem truoc hoa don
│   │   │   ├── shift-summary.tsx      # Tong ket ca lam viec
│   │   │   ├── barcode-scanner.tsx    # Quet ma vach (camera)
│   │   │   └── numpad.tsx             # Ban phim so (nhap so luong)
│   │   │
│   │   └── shipper/                   # Components rieng cho Shipper
│   │       ├── bottom-nav.tsx         # Navigation duoi cung (mobile)
│   │       ├── order-card.tsx         # Card don giao (dia chi, trang thai)
│   │       ├── delivery-map.tsx       # Ban do giao hang (Google Maps / Leaflet)
│   │       ├── status-updater.tsx     # Cap nhat trang thai giao hang
│   │       ├── earning-summary.tsx    # Tong ket thu nhap
│   │       └── offline-indicator.tsx  # Chi bao trang thai offline (PWA)
│   │
│   ├── lib/
│   │   ├── api.ts                     # Axios instance (baseURL, interceptors, token)
│   │   ├── utils.ts                   # Utility functions (cn, formatPrice, formatDate)
│   │   ├── constants.ts               # Hang so (ORDER_STATUS, PAYMENT_METHODS...)
│   │   ├── socket.ts                  # Socket.IO client (singleton)
│   │   └── validators.ts             # Zod schemas dung chung
│   │
│   ├── services/                      # API service layer
│   │   ├── auth.service.ts            # Dang nhap, dang ky, refresh token
│   │   ├── product.service.ts         # CRUD san pham, tim kiem, filter
│   │   ├── category.service.ts        # CRUD danh muc
│   │   ├── order.service.ts           # Tao/cap nhat/huy don hang
│   │   ├── cart.service.ts            # Gio hang (sync voi server)
│   │   ├── review.service.ts          # CRUD danh gia
│   │   ├── wishlist.service.ts        # Them/xoa san pham yeu thich
│   │   ├── coupon.service.ts          # Kiem tra & ap dung ma giam gia
│   │   ├── upload.service.ts          # Upload anh len Cloudinary
│   │   ├── user.service.ts            # Cap nhat profile, dia chi
│   │   ├── shipper.service.ts         # API cho shipper (don giao, vi tri)
│   │   ├── report.service.ts          # API bao cao thong ke
│   │   ├── notification.service.ts    # API thong bao
│   │   └── return.service.ts          # API tra hang / hoan tien
│   │
│   ├── stores/                        # Zustand stores (client state)
│   │   ├── auth.store.ts              # Trang thai xac thuc (user, token, isAuthenticated)
│   │   ├── cart.store.ts              # Gio hang (items, addItem, removeItem, total)
│   │   ├── wishlist.store.ts          # Danh sach yeu thich
│   │   ├── comparison.store.ts        # So sanh san pham (max 4 items)
│   │   ├── notification.store.ts      # Thong bao (unreadCount, notifications)
│   │   └── pos.store.ts               # Trang thai POS (ca lam, gio hang POS)
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-auth.ts                # Hook xac thuc (login, logout, user)
│   │   ├── use-cart.ts                # Hook gio hang (addToCart, removeFromCart)
│   │   ├── use-debounce.ts            # Debounce gia tri (tim kiem)
│   │   ├── use-socket.ts              # Hook ket noi Socket.IO
│   │   ├── use-notification.ts        # Hook thong bao real-time
│   │   ├── use-infinite-scroll.ts     # Hook scroll vo han (danh sach san pham)
│   │   ├── use-media-query.ts         # Hook responsive (mobile/tablet/desktop)
│   │   └── use-local-storage.ts       # Hook doc/ghi localStorage
│   │
│   ├── types/                         # TypeScript type definitions
│   │   ├── product.type.ts            # Product, ProductVariant, ProductFilter
│   │   ├── order.type.ts              # Order, OrderItem, OrderStatus
│   │   ├── user.type.ts               # User, UserRole, Address
│   │   ├── category.type.ts           # Category (tree structure)
│   │   ├── review.type.ts             # Review, ReviewSummary
│   │   ├── coupon.type.ts             # Coupon, DiscountType
│   │   ├── cart.type.ts               # CartItem, CartSummary
│   │   ├── notification.type.ts       # Notification, NotificationType
│   │   ├── return.type.ts             # ReturnRequest, ReturnStatus
│   │   ├── shipper.type.ts            # Shipper, DeliveryStatus
│   │   ├── report.type.ts             # RevenueReport, ProductReport
│   │   ├── api.type.ts                # ApiResponse<T>, PaginatedResponse<T>
│   │   └── index.ts                   # Re-export tat ca types
│   │
│   └── middleware.ts                  # Next.js middleware (auth + role check)
│
├── tailwind.config.ts                 # Cau hinh Tailwind CSS
├── next.config.js                     # Cau hinh Next.js
├── tsconfig.json                      # TypeScript config
├── postcss.config.js                  # PostCSS config
├── .env.local                         # Bien moi truong local (KHONG commit)
├── .env.example                       # Mau bien moi truong
└── package.json                       # Dependencies
```

---

## 2. Route Groups - Chia ung dung theo vai tro

### 2.1. Khai niem Route Groups trong Next.js 14

Next.js 14 App Router ho tro **Route Groups** - cho phep nhom cac route lai ma **khong anh huong den URL path**. Folder co ten trong ngoac `(ten)` se bi bo qua trong URL.

Trong du an nay, ta dung Route Groups de gom **4 ung dung** vao **1 project Next.js duy nhat**:

| Route Group | URL Prefix | Vai tro | Layout |
|---|---|---|---|
| `(customer)` | `/` (khong co prefix) | Khach hang mua sam | Header + Footer |
| `admin` | `/admin` | Quan tri vien | Sidebar + Topbar |
| `pos` | `/pos` | Nhan vien ban hang | Toi gian, cam ung |
| `shipper` | `/shipper` | Tai xe giao hang | Mobile-first, PWA |

### 2.2. Tai sao (customer) dung ngoac tron?

```
src/app/
├── (customer)/        # URL: / (bo ngoac tron -> khong co prefix)
│   └── products/      # URL: /products
├── admin/             # URL: /admin
│   └── products/      # URL: /admin/products
├── pos/               # URL: /pos
└── shipper/           # URL: /shipper
```

- `(customer)` dung ngoac tron `()` vi day la route group thuc su cua Next.js. Ngoac tron lam cho folder nay **khong xuat hien trong URL**. Trang chu truy cap tai `/` thay vi `/customer`.
- `admin`, `pos`, `shipper` **khong dung ngoac tron** vi chung ta muon URL co prefix tuong ung (`/admin`, `/pos`, `/shipper`).

### 2.3. Moi Route Group co layout rieng

Moi route group co file `layout.tsx` rieng, cho phep giao dien hoan toan khac nhau:

```
(customer)/layout.tsx   -> Header (logo, menu, search, cart) + Footer
admin/layout.tsx        -> Sidebar trai + Topbar (co collapse)
pos/layout.tsx          -> Layout toi gian, 2 cot (san pham | gio hang)
shipper/layout.tsx      -> Header nho + Bottom Navigation (mobile)
```

**Vi du: Customer Layout**

```tsx
// src/app/(customer)/layout.tsx
import { Header } from '@/components/customer/header';
import { Footer } from '@/components/customer/footer';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

**Vi du: Admin Layout**

```tsx
// src/app/admin/layout.tsx
'use client';

import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col">
        <Topbar onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
```

**Vi du: Shipper Layout (PWA mobile-first)**

```tsx
// src/app/shipper/layout.tsx
import { BottomNav } from '@/components/shipper/bottom-nav';
import { OfflineIndicator } from '@/components/shipper/offline-indicator';

export default function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      <OfflineIndicator />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
```

### 2.4. Loi ich cua viec gom chung 1 project

| Loi ich | Mo ta |
|---|---|
| Dung chung components | `components/ui/` va `components/shared/` dung chung cho ca 4 ung dung |
| Dung chung lib/services | API client, utility functions, TypeScript types chi can viet 1 lan |
| Dung chung authentication | Logic xac thuc (Zustand store, middleware) la chung |
| Deploy don gian | Chi can deploy 1 Next.js app duy nhat |
| Consistency | Dam bao UI/UX nhat quan giua cac ung dung |

---

## 3. Providers Setup

File `providers.tsx` chua tat ca cac global provider boc quanh toan bo ung dung.

```tsx
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Khong refetch khi chuyen tab (tranh request thua)
            refetchOnWindowFocus: false,
            // Retry 1 lan khi loi
            retry: 1,
            // Du lieu stale sau 30 giay
            staleTime: 30 * 1000,
          },
          mutations: {
            // Khong retry cho mutations
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### Giai thich cau hinh

| Option | Gia tri | Ly do |
|---|---|---|
| `refetchOnWindowFocus` | `false` | Tranh goi API lien tuc khi nguoi dung chuyen tab |
| `retry` (queries) | `1` | Chi retry 1 lan, tranh spam server |
| `staleTime` | `30s` | Du lieu duoc coi la "tuoi" trong 30 giay, giam so lan goi API |
| `retry` (mutations) | `false` | Mutations (POST, PUT, DELETE) khong nen tu dong retry |

> **Luu y:** Khong can ThemeProvider vi he thong chi dung 1 theme (light). Neu can dark mode trong tuong lai, bo sung `next-themes` va ThemeProvider.

---

## 4. Root Layout

File `layout.tsx` goc la entry point cua toan bo ung dung.

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Font Inter - Google Font, tu dong optimize boi Next.js
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

// Metadata - SEO
export const metadata: Metadata = {
  title: {
    default: 'Furniture VN - Noi That Chat Luong',
    template: '%s | Furniture VN',
  },
  description:
    'He thong thuong mai dien tu noi that hang dau Viet Nam. Mua sam noi that online voi gia tot nhat, giao hang tan noi.',
  keywords: [
    'noi that',
    'furniture',
    'mua noi that online',
    'ban ghe',
    'giuong tu',
    'trang tri nha cua',
  ],
  authors: [{ name: 'Furniture VN' }],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Furniture VN',
  },
};

// Viewport config (tach rieng khoi metadata tu Next.js 14)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Chong zoom tren POS
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Diem quan trong

| Diem | Mo ta |
|---|---|
| `lang="vi"` | Khai bao ngon ngu tieng Viet cho SEO va accessibility |
| `Inter` font | Font chuan, ho tro Vietnamese subset |
| `display: 'swap'` | Hien text ngay, doi font load xong moi swap (tranh FOIT) |
| `title.template` | Tu dong tao title dang "Ten trang \| Furniture VN" |
| `viewport` tach rieng | Next.js 14+ yeu cau export `viewport` rieng, khong de trong `metadata` |
| `maximumScale: 1` | Can thiet cho POS (tranh zoom ngoai y muon tren man hinh cam ung) |

---

## 5. Middleware - Xac thuc va phan quyen

Middleware chay o **Edge Runtime**, xu ly truoc moi request.

```tsx
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cac route can dang nhap
const protectedRoutes = [
  '/admin',
  '/pos',
  '/shipper',
  '/account',
  '/orders',
  '/checkout',
  '/reviews',
  '/wishlist',
];

// Map role -> route prefix
const roleRouteMap: Record<string, string> = {
  admin: '/admin',
  staff: '/pos',
  shipper: '/shipper',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiem tra co phai route can bao ve khong
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Lay token tu cookie
  const token = request.cookies.get('access_token')?.value;

  // Chua dang nhap -> redirect ve login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode token de lay role (JWT payload)
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    const userRole: string = payload.role;

    // Kiem tra quyen truy cap theo role
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/pos') && userRole !== 'staff') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/shipper') && userRole !== 'shipper') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch {
    // Token khong hop le -> redirect ve login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  // Chi chay middleware cho cac route can thiet
  // Bo qua: API routes, static files, images
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
};
```

### Luong xu ly Middleware

```
Request den
    │
    ▼
Kiem tra pathname co trong protectedRoutes?
    │
    ├── KHONG -> Next() (cho qua)
    │
    └── CO -> Kiem tra access_token cookie
                │
                ├── KHONG co token -> Redirect /login?callbackUrl=...
                │
                └── CO token -> Decode JWT lay role
                                │
                                ├── /admin/* va role != admin -> Redirect /
                                ├── /pos/* va role != staff -> Redirect /
                                ├── /shipper/* va role != shipper -> Redirect /
                                └── OK -> Next() (cho qua)
```

### Luu y bao mat

> Middleware chi thuc hien **kiem tra so bo** (basic check) o Edge Runtime. **Moi API call tu client van phai duoc xac thuc lai o Backend** thong qua JWT Bearer token. Middleware chi giup UX tot hon (redirect som, khong cho user thay giao dien khong duoc phep).

---

## 6. Bien moi truong

### 6.1. File `.env.local`

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Cloudinary (upload anh)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=furniture-vn

# Google Maps (Shipper PWA)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your-api-key

# App info
NEXT_PUBLIC_APP_NAME=Furniture VN
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2. Quy tac truy cap

| Prefix | Noi truy cap | Vi du |
|---|---|---|
| `NEXT_PUBLIC_*` | Client + Server | `NEXT_PUBLIC_API_URL` - can thiet cho Axios tren client |
| Khong co prefix | Chi Server | Secret keys, database URL (khong dung trong du an nay vi BE rieng) |

### 6.3. Cach su dung trong code

```tsx
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tu dong gan token vao moi request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Xu ly loi 401 (token het han)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // TODO: Goi refresh token hoac redirect ve login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

> **Quan trong:** Tat ca bien moi truong dung tren client **bat buoc** phai co prefix `NEXT_PUBLIC_`. Neu thieu prefix, gia tri se la `undefined` tren browser.

---

## 7. Cac quy uoc quan trong

### 7.1. Server Components vs Client Components

```
Mac dinh: Server Component (khong can khai bao gi)
Chi dung 'use client' khi:
  - Can su dung hooks (useState, useEffect, useRef...)
  - Can xu ly su kien (onClick, onChange...)
  - Can truy cap Browser API (localStorage, window...)
  - Can dung thu vien chi chay tren client (Zustand, Socket.IO...)
```

**Nguyen tac:**

| Hanh dong | Dung |
|---|---|
| Fetch du lieu ban dau (SSR) | Server Component + `fetch()` hoac goi service truc tiep |
| Fetch du lieu phia client (sau khi mount) | `useQuery` cua React Query trong Client Component |
| State toan cuc (auth, cart) | Zustand store trong Client Component |
| Form xu ly | Client Component voi `react-hook-form` + `zod` |

**Vi du: Trang san pham (ket hop Server + Client)**

```tsx
// src/app/(customer)/products/page.tsx (Server Component)
import { productService } from '@/services/product.service';
import { ProductList } from '@/components/customer/product-list';

// Fetch du lieu tren server (nhanh, SEO-friendly)
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; sort?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const products = await productService.getProducts({
    page,
    category: searchParams.category,
    sort: searchParams.sort,
  });

  // Truyen du lieu xuong Client Component
  return <ProductList initialData={products} />;
}
```

```tsx
// src/components/customer/product-list.tsx (Client Component)
'use client';

import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';

export function ProductList({ initialData }: { initialData: PaginatedResponse<Product> }) {
  // React Query su dung initialData tu server, sau do tu refetch khi can
  const { data } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    initialData,
  });

  return (
    // ... render danh sach san pham
  );
}
```

### 7.2. Quy uoc dat ten file

| Loai | Quy uoc | Vi du |
|---|---|---|
| Pages & Layouts | `page.tsx`, `layout.tsx` | (bat buoc boi Next.js) |
| Components | `kebab-case.tsx` | `product-card.tsx`, `cart-sidebar.tsx` |
| Component export | `PascalCase` | `export function ProductCard()` |
| Hooks | `use-*.ts` | `use-auth.ts`, `use-cart.ts` |
| Services | `*.service.ts` | `product.service.ts` |
| Stores | `*.store.ts` | `cart.store.ts` |
| Types | `*.type.ts` | `product.type.ts` |
| Lib/Utils | `kebab-case.ts` | `api.ts`, `utils.ts` |

### 7.3. Quy uoc import (Path aliases)

Cau hinh trong `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Su dung:

```tsx
// Thay vi:
import { Button } from '../../../components/ui/button';

// Dung:
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { productService } from '@/services/product.service';
import { useCartStore } from '@/stores/cart.store';
import type { Product } from '@/types/product.type';
```

### 7.4. Zustand Store Pattern

```tsx
// src/stores/cart.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/cart.type';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
    }),
    {
      name: 'cart-storage', // Key trong localStorage
    }
  )
);
```

### 7.5. Service Pattern

```tsx
// src/services/product.service.ts
import api from '@/lib/api';
import type { Product, ProductFilter } from '@/types/product.type';
import type { PaginatedResponse } from '@/types/api.type';

export const productService = {
  // Lay danh sach san pham (co phan trang, filter)
  getProducts: async (
    params: ProductFilter
  ): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get('/products', { params });
    return data.data;
  },

  // Lay chi tiet san pham theo slug
  getBySlug: async (slug: string): Promise<Product> => {
    const { data } = await api.get(`/products/slug/${slug}`);
    return data.data;
  },

  // [Admin] Tao san pham moi
  create: async (payload: CreateProductDto): Promise<Product> => {
    const { data } = await api.post('/products', payload);
    return data.data;
  },

  // [Admin] Cap nhat san pham
  update: async (id: string, payload: UpdateProductDto): Promise<Product> => {
    const { data } = await api.patch(`/products/${id}`, payload);
    return data.data;
  },

  // [Admin] Xoa san pham
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
```

### 7.6. Socket.IO Client

```tsx
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket(token: string): void {
  const s = getSocket();
  s.auth = { token };
  s.connect();
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

```tsx
// src/hooks/use-socket.ts
'use client';

import { useEffect, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return socketRef.current;
}
```

---

## 8. Bang tong hop cong nghe Frontend

| Cong nghe | Phien ban | Muc dich |
|---|---|---|
| Next.js | 14+ | Framework React (App Router, SSR, SSG) |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3.4+ | Utility-first CSS |
| shadcn/ui | latest | Component library (xay tren Radix UI) |
| TanStack React Query | 5+ | Server state management (cache, refetch) |
| Zustand | 4+ | Client state management (auth, cart) |
| Axios | 1.6+ | HTTP client |
| React Hook Form | 7+ | Form management |
| Zod | 3+ | Schema validation |
| Socket.IO Client | 4+ | Real-time communication |
| react-hot-toast | 2+ | Toast notifications |
| Recharts | 2+ | Bieu do thong ke (Admin) |
| @tanstack/react-table | 8+ | DataTable (Admin) |
| Lucide React | latest | Icon library |
| date-fns | 3+ | Xu ly ngay thang |
| next/font | built-in | Font optimization |

---

> **Tham khao them:**
> - Kien truc tong the: `docs/furniture-vn/00-overview/01-architecture.md`
> - Backend API: `docs/furniture-vn/03-backend/`
> - Database schemas: `docs/furniture-vn/02-database/01-schemas.md`
