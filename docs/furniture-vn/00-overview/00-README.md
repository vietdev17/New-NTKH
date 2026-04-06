# HE THONG BAN NOI THAT VIET NAM

> Nen tang thuong mai dien tu chuyen ve noi that - Monorepo fullstack voi NestJS + Next.js

---

## Muc luc

- [Tong quan](#tong-quan)
- [Kien truc he thong](#kien-truc-he-thong)
- [Cong nghe su dung](#cong-nghe-su-dung)
- [4 Ung dung Frontend](#4-ung-dung-frontend)
- [14 Backend Modules](#14-backend-modules)
- [Phuong thuc thanh toan](#phuong-thuc-thanh-toan)
- [UI/UX Yeu cau](#uiux-yeu-cau)
- [Thu tu trien khai (5 giai doan)](#thu-tu-trien-khai-5-giai-doan)
- [Cau truc du an](#cau-truc-du-an)
- [Huong dan chay du an](#huong-dan-chay-du-an)

---

## Tong quan

He thong ban noi that truc tuyen danh cho thi truong Viet Nam. Du an duoc to chuc theo **monorepo** gom 1 backend (NestJS) va 1 frontend (Next.js) phuc vu 4 ung dung khac nhau trong cung 1 project:

- **Customer Web** - Trang mua sam cho khach hang
- **Admin Dashboard** - Quan ly toan bo he thong
- **POS (Point of Sale)** - Ban hang tai quay cua hang
- **Shipper App (PWA)** - Ung dung cho nhan vien giao hang

---

## Kien truc he thong

```
+------------------------------------------------------------------+
|                         MONOREPO                                 |
|                                                                  |
|  +---------------------------+  +-----------------------------+  |
|  |        BACKEND            |  |         FRONTEND            |  |
|  |      (NestJS 10)          |  |       (Next.js 14)          |  |
|  |                           |  |      App Router             |  |
|  |  +---------------------+  |  |                             |  |
|  |  |   14 Modules        |  |  |  /          Customer Web    |  |
|  |  |                     |  |  |  /admin     Admin Dashboard |  |
|  |  |  Auth       Orders  |  |  |  /pos       POS System      |  |
|  |  |  Users      Coupons |  |  |  /shipper   Shipper PWA     |  |
|  |  |  Products   Shipper |  |  |                             |  |
|  |  |  Categories Upload  |  |  +-----------------------------+  |
|  |  |  Reviews    Notif.  |  |                                   |
|  |  |  Wishlist   Reports |  |                                   |
|  |  |  Customers  Socket  |  |                                   |
|  |  +---------------------+  |                                   |
|  |                           |                                   |
|  |  REST API + WebSocket     |                                   |
|  +---------------------------+                                   |
|              |                                                   |
|              v                                                   |
|  +---------------------------+  +-----------------------------+  |
|  |       MongoDB             |  |    Google Drive API          |  |
|  |    (Mongoose 8)           |  |    (Upload hinh anh)         |  |
|  +---------------------------+  +-----------------------------+  |
+------------------------------------------------------------------+

Luong du lieu:

  Browser/PWA ----HTTP/WS----> NestJS API ----Mongoose----> MongoDB
                                  |
                                  +--------> Google Drive (upload)
                                  |
                                  +--------> Socket.IO (realtime)
```

---

## Cong nghe su dung

### Backend

| Cong nghe      | Phien ban | Muc dich                          |
| -------------- | --------- | --------------------------------- |
| NestJS         | 10        | Framework API chinh               |
| MongoDB        | -         | Co so du lieu NoSQL               |
| Mongoose       | 8         | ODM cho MongoDB                   |
| Socket.IO      | 4         | Realtime (thong bao, cap nhat)    |
| JWT            | -         | Xac thuc token-based              |
| Google OAuth   | -         | Dang nhap bang tai khoan Google   |
| Passport.js    | -         | Middleware xac thuc               |

### Frontend

| Cong nghe      | Phien ban | Muc dich                          |
| -------------- | --------- | --------------------------------- |
| Next.js        | 14        | Framework React (App Router)      |
| TypeScript     | 5         | Ngon ngu lap trinh                |
| TailwindCSS    | 3         | Utility-first CSS framework       |
| shadcn/ui      | -         | Component library (Radix-based)   |
| Zustand        | 4         | State management                  |
| Framer Motion  | -         | Animation library                 |
| Lucide React   | -         | Icon library                      |

### Dich vu ben ngoai

| Dich vu          | Muc dich                              |
| ---------------- | ------------------------------------- |
| Google Drive API | Upload va luu tru hinh anh san pham   |
| Google OAuth     | Xac thuc nguoi dung qua Google        |

---

## 4 Ung dung Frontend

Tat ca 4 ung dung nam trong **1 du an Next.js 14 duy nhat**, su dung App Router de phan chia theo route groups.

### 1. Customer Web (`/`)

Trang mua sam danh cho khach hang cuoi.

| Tinh nang            | Mo ta                                          |
| -------------------- | ---------------------------------------------- |
| Trang chu            | Banner, san pham noi bat, danh muc             |
| Danh muc san pham    | Loc, sap xep, phan trang                       |
| Chi tiet san pham    | Hinh anh, mo ta, thong so, danh gia            |
| Gio hang             | Them/xoa/cap nhat so luong, ap ma giam gia     |
| Checkout             | Nhap dia chi, chon van chuyen, dat hang        |
| Tracking don hang    | Theo doi trang thai don hang realtime           |
| Danh gia (Reviews)   | Viet danh gia, xep hang sao san pham           |
| Wishlist             | Luu san pham yeu thich                         |
| So sanh san pham     | So sanh thong so nhieu san pham cung luc        |
| Tai khoan            | Thong tin ca nhan, lich su don hang             |

### 2. Admin Dashboard (`/admin`)

Giao dien quan tri danh cho nguoi quan ly.

| Tinh nang            | Mo ta                                          |
| -------------------- | ---------------------------------------------- |
| Quan ly san pham     | CRUD san pham, bien the, hinh anh              |
| Quan ly don hang     | Xem, cap nhat trang thai, in hoa don           |
| Quan ly khach hang   | Danh sach, chi tiet, lich su mua hang          |
| Quan ly coupon       | Tao/sua/xoa ma giam gia, dieu kien ap dung     |
| Quan ly danh gia     | Duyet, an, tra loi danh gia khach hang         |
| Bao cao              | Doanh thu, don hang, san pham ban chay         |
| Thong bao            | Gui thong bao cho khach hang, shipper          |

### 3. POS - Point of Sale (`/pos`)

He thong ban hang tai quay cua hang.

| Tinh nang            | Mo ta                                          |
| -------------------- | ---------------------------------------------- |
| Ban hang tai quay    | Tim san pham, them vao don, tinh tien          |
| In hoa don           | Xuat hoa don ban hang (in/PDF)                 |
| Quan ly ca lam viec  | Mo/dong ca, doi soat doanh thu theo ca         |
| Tra hang             | Xu ly tra hang, hoan tien                      |
| Ap dung khuyen mai   | Ap ma giam gia, chuong trinh khuyen mai        |

### 4. Shipper App (`/shipper`) - PWA

Ung dung Progressive Web App cho nhan vien giao hang.

| Tinh nang            | Mo ta                                          |
| -------------------- | ---------------------------------------------- |
| Nhan don giao        | Xem danh sach don can giao, nhan don           |
| GPS & dinh vi        | Theo doi vi tri, chi duong toi dia chi giao    |
| Cap nhat trang thai  | Dang giao, da giao, khong giao duoc            |
| Chung tu giao hang   | Chup anh xac nhan giao hang                    |
| Lich su giao hang    | Xem lai cac don da giao                        |
| Thong bao realtime   | Nhan thong bao don moi qua Socket.IO           |

---

## 14 Backend Modules

```
┌─────────────────────────────────────────────────────┐
│                  NestJS Backend                      │
├──────────────────┬──────────────────────────────────┤
│  #  │ Module     │ Mo ta                            │
├──────────────────┼──────────────────────────────────┤
│  1  │ Auth       │ Dang ky, dang nhap, JWT,         │
│     │            │ Google OAuth, refresh token       │
├──────────────────┼──────────────────────────────────┤
│  2  │ Users      │ Quan ly tai khoan nguoi dung,     │
│     │            │ phan quyen (admin/staff/shipper)  │
├──────────────────┼──────────────────────────────────┤
│  3  │ Products   │ CRUD san pham, bien the,          │
│     │            │ hinh anh, ton kho                 │
├──────────────────┼──────────────────────────────────┤
│  4  │ Categories │ Quan ly danh muc san pham         │
│     │            │ (da cap, tree structure)           │
├──────────────────┼──────────────────────────────────┤
│  5  │ Reviews    │ Danh gia san pham, xep hang,      │
│     │            │ duyet danh gia                    │
├──────────────────┼──────────────────────────────────┤
│  6  │ Wishlist   │ Danh sach san pham yeu thich      │
│     │            │ cua khach hang                    │
├──────────────────┼──────────────────────────────────┤
│  7  │ Customers  │ Ho so khach hang, dia chi,        │
│     │            │ lich su mua hang                  │
├──────────────────┼──────────────────────────────────┤
│  8  │ Orders     │ Tao don, xu ly don, trang thai,   │
│     │            │ POS orders, lich su               │
├──────────────────┼──────────────────────────────────┤
│  9  │ Coupons    │ Ma giam gia, dieu kien,           │
│     │            │ gioi han su dung                  │
├──────────────────┼──────────────────────────────────┤
│ 10  │ Shipper    │ Quan ly shipper, phan don,         │
│     │            │ theo doi giao hang                │
├──────────────────┼──────────────────────────────────┤
│ 11  │ Upload     │ Upload hinh anh len Google Drive,  │
│     │            │ quan ly file                      │
├──────────────────┼──────────────────────────────────┤
│ 12  │ Notif.     │ Thong bao realtime, push,          │
│     │            │ lich su thong bao                 │
├──────────────────┼──────────────────────────────────┤
│ 13  │ Reports    │ Bao cao doanh thu, don hang,       │
│     │            │ san pham, khach hang              │
├──────────────────┼──────────────────────────────────┤
│ 14  │ Socket.IO  │ WebSocket Gateway - realtime       │
│     │ Gateway    │ cho thong bao, tracking           │
└──────────────────┴──────────────────────────────────┘
```

---

## Phuong thuc thanh toan

He thong chi ho tro **2 phuong thuc thanh toan**:

| Phuong thuc          | Mo ta                                          |
| -------------------- | ---------------------------------------------- |
| **COD**              | Thanh toan khi nhan hang (Cash on Delivery)    |
| **Chuyen khoan**     | Chuyen khoan ngan hang (Bank Transfer)         |

> **Luu y:** He thong **KHONG** tich hop cong thanh toan truc tuyen (khong VNPay, khong MoMo, khong ZaloPay). Chi ho tro COD va chuyen khoan ngan hang.

Doi voi chuyen khoan:
- Hien thi thong tin tai khoan ngan hang cua cua hang
- Khach hang tu chuyen khoan va xac nhan
- Admin xac nhan da nhan tien va cap nhat trang thai don hang

---

## UI/UX Yeu cau

### Nguyen tac thiet ke

- **Modern & Clean** - Giao dien hien dai, toi gian, trang nha (phu hop voi nganh noi that)
- **Responsive** - Tuong thich toan bo thiet bi (desktop, tablet, mobile)
- **Smooth Animations** - Hieu ung muot ma, chuyen trang tu nhien
- **Accessible** - Tuan thu chuan tiep can co ban

### Thu vien UI/UX

```
shadcn/ui          - Component library chinh (Button, Dialog, Table, Form, ...)
TailwindCSS 3      - Utility classes, responsive design, dark mode support
Framer Motion      - Page transitions, hover effects, loading animations
Lucide React       - Icon system nhat quan xuyen suot ung dung
```

### Yeu cau cu the

- Skeleton loading cho moi trang co fetch du lieu
- Toast notifications cho moi thao tac (them gio hang, dat hang, ...)
- Smooth page transitions giua cac route
- Hover effects tren san pham cards
- Modal/Dialog cho xac nhan hanh dong
- Form validation voi hien thi loi truc quan
- Infinite scroll hoac pagination cho danh sach san pham
- Image gallery voi zoom cho chi tiet san pham

---

## Thu tu trien khai (5 giai doan)

### Wave 1 - Nen tang (Foundation)

> Thiet lap project, xac thuc, va cac module co ban

| STT | Cong viec                                | Backend | Frontend |
| --- | ---------------------------------------- | ------- | -------- |
| 1   | Khoi tao monorepo (NestJS + Next.js)     | x       | x        |
| 2   | Cau hinh MongoDB + Mongoose              | x       |          |
| 3   | Module Auth (JWT + Google OAuth)         | x       | x        |
| 4   | Module Users (CRUD, phan quyen)          | x       | x        |
| 5   | Module Upload (Google Drive API)         | x       |          |
| 6   | Layout chinh (Customer, Admin, POS, Shipper) |     | x        |
| 7   | Module Categories (CRUD, tree)           | x       | x        |

### Wave 2 - San pham & Khach hang (Products & Customers)

> Xay dung core thuong mai dien tu

| STT | Cong viec                                | Backend | Frontend |
| --- | ---------------------------------------- | ------- | -------- |
| 1   | Module Products (CRUD, bien the, ton kho)| x       | x        |
| 2   | Trang danh muc san pham (loc, sap xep)   |         | x        |
| 3   | Trang chi tiet san pham                  |         | x        |
| 4   | Module Customers (ho so, dia chi)        | x       | x        |
| 5   | Module Reviews (danh gia, xep hang)      | x       | x        |
| 6   | Module Wishlist                          | x       | x        |
| 7   | Tinh nang so sanh san pham               |         | x        |

### Wave 3 - Don hang & Thanh toan (Orders & Payments)

> Hoan thien luong mua hang

| STT | Cong viec                                | Backend | Frontend |
| --- | ---------------------------------------- | ------- | -------- |
| 1   | Gio hang (Zustand state management)      |         | x        |
| 2   | Module Coupons (ma giam gia)             | x       | x        |
| 3   | Module Orders (tao don, trang thai)      | x       | x        |
| 4   | Checkout flow (COD + Bank Transfer)      | x       | x        |
| 5   | Tracking don hang                        |         | x        |
| 6   | Admin - Quan ly don hang                 |         | x        |
| 7   | Admin - Quan ly coupon                   |         | x        |

### Wave 4 - POS & Giao hang (POS & Shipping)

> Mo rong kenh ban hang va giao hang

| STT | Cong viec                                | Backend | Frontend |
| --- | ---------------------------------------- | ------- | -------- |
| 1   | POS - Giao dien ban hang tai quay        |         | x        |
| 2   | POS - In hoa don (PDF)                   | x       | x        |
| 3   | POS - Quan ly ca lam viec                | x       | x        |
| 4   | POS - Tra hang                           | x       | x        |
| 5   | Module Shipper (phan don, quan ly)       | x       | x        |
| 6   | Shipper PWA (nhan don, GPS, trang thai)  |         | x        |
| 7   | Shipper - Chung tu giao hang (chup anh)  |         | x        |

### Wave 5 - Realtime, Bao cao & Hoan thien (Realtime, Reports & Polish)

> Thong bao realtime, bao cao, va toi uu

| STT | Cong viec                                | Backend | Frontend |
| --- | ---------------------------------------- | ------- | -------- |
| 1   | Socket.IO Gateway (thong bao realtime)   | x       | x        |
| 2   | Module Notifications                     | x       | x        |
| 3   | Module Reports (doanh thu, thong ke)     | x       | x        |
| 4   | Admin - Dashboard bao cao                |         | x        |
| 5   | Toi uu performance (caching, indexing)   | x       | x        |
| 6   | SEO cho Customer Web                     |         | x        |
| 7   | Testing & bug fixes                      | x       | x        |

---

## Cau truc du an

```
furniture-vn/
├── backend/                          # NestJS 10 Backend
│   ├── src/
│   │   ├── main.ts                   # Entry point
│   │   ├── app.module.ts             # Root module
│   │   ├── common/                   # Shared utilities
│   │   │   ├── decorators/           # Custom decorators
│   │   │   ├── guards/               # Auth guards, role guards
│   │   │   ├── interceptors/         # Response interceptors
│   │   │   ├── filters/              # Exception filters
│   │   │   ├── pipes/                # Validation pipes
│   │   │   └── dto/                  # Shared DTOs
│   │   ├── config/                   # Configuration files
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── google.config.ts
│   │   └── modules/
│   │       ├── auth/                 # Module 1: Auth
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── strategies/       # JWT, Google OAuth strategies
│   │       │   ├── guards/
│   │       │   └── dto/
│   │       ├── users/                # Module 2: Users
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   └── schemas/          # Mongoose schemas
│   │       ├── products/             # Module 3: Products
│   │       ├── categories/           # Module 4: Categories
│   │       ├── reviews/              # Module 5: Reviews
│   │       ├── wishlist/             # Module 6: Wishlist
│   │       ├── customers/            # Module 7: Customers
│   │       ├── orders/               # Module 8: Orders
│   │       ├── coupons/              # Module 9: Coupons
│   │       ├── shipper/              # Module 10: Shipper
│   │       ├── upload/               # Module 11: Upload
│   │       ├── notifications/        # Module 12: Notifications
│   │       ├── reports/              # Module 13: Reports
│   │       └── socket/               # Module 14: Socket.IO Gateway
│   ├── test/                         # E2E tests
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                         # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                      # App Router
│   │   │   ├── (customer)/           # Route group: Customer Web
│   │   │   │   ├── page.tsx          # Trang chu
│   │   │   │   ├── products/         # Danh muc, chi tiet san pham
│   │   │   │   ├── cart/             # Gio hang
│   │   │   │   ├── checkout/         # Thanh toan
│   │   │   │   ├── orders/           # Tracking don hang
│   │   │   │   ├── wishlist/         # Yeu thich
│   │   │   │   ├── compare/          # So sanh san pham
│   │   │   │   └── account/          # Tai khoan
│   │   │   ├── admin/                # Route group: Admin Dashboard
│   │   │   │   ├── page.tsx          # Dashboard
│   │   │   │   ├── products/         # Quan ly san pham
│   │   │   │   ├── orders/           # Quan ly don hang
│   │   │   │   ├── customers/        # Quan ly khach hang
│   │   │   │   ├── coupons/          # Quan ly coupon
│   │   │   │   ├── reviews/          # Quan ly danh gia
│   │   │   │   └── reports/          # Bao cao
│   │   │   ├── pos/                  # Route group: POS
│   │   │   │   ├── page.tsx          # Man hinh ban hang
│   │   │   │   ├── shifts/           # Quan ly ca
│   │   │   │   ├── returns/          # Tra hang
│   │   │   │   └── invoices/         # Hoa don
│   │   │   ├── shipper/              # Route group: Shipper PWA
│   │   │   │   ├── page.tsx          # Danh sach don giao
│   │   │   │   ├── delivery/         # Chi tiet giao hang
│   │   │   │   ├── history/          # Lich su
│   │   │   │   └── manifest.json     # PWA manifest
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── globals.css           # TailwindCSS globals
│   │   ├── components/               # Shared components
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── customer/             # Customer-specific components
│   │   │   ├── admin/                # Admin-specific components
│   │   │   ├── pos/                  # POS-specific components
│   │   │   └── shipper/              # Shipper-specific components
│   │   ├── lib/                      # Utilities
│   │   │   ├── api.ts                # API client (fetch wrapper)
│   │   │   ├── utils.ts              # Helper functions
│   │   │   └── socket.ts             # Socket.IO client
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── auth.store.ts
│   │   │   ├── cart.store.ts
│   │   │   └── notification.store.ts
│   │   ├── hooks/                    # Custom React hooks
│   │   └── types/                    # TypeScript type definitions
│   ├── public/                       # Static assets
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                             # Tai lieu du an
│   └── furniture-vn/
│       ├── 00-overview/
│       │   └── 00-README.md          # << Ban dang doc file nay
│       ├── 01-backend/               # Tai lieu backend modules
│       ├── 02-frontend/              # Tai lieu frontend apps
│       └── 03-api/                   # API documentation
│
├── .gitignore
├── package.json                      # Root package.json (workspaces)
└── README.md
```

---

## Huong dan chay du an

### Yeu cau he thong

- **Node.js** >= 18.x
- **npm** >= 9.x hoac **yarn** >= 1.22
- **MongoDB** >= 6.x (local hoac MongoDB Atlas)
- **Google Cloud Console** project (cho Drive API + OAuth)

### 1. Clone va cai dat

```bash
# Clone repository
git clone <repository-url>
cd furniture-vn

# Cai dat dependencies cho backend
cd backend
npm install

# Cai dat dependencies cho frontend
cd ../frontend
npm install
```

### 2. Cau hinh bien moi truong

**Backend** (`backend/.env`):

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/furniture-vn

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id
GOOGLE_SERVICE_ACCOUNT_KEY=path/to/service-account.json

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Chay du an

```bash
# Terminal 1 - Chay Backend
cd backend
npm run start:dev

# Terminal 2 - Chay Frontend
cd frontend
npm run dev
```

### 4. Truy cap ung dung

| Ung dung         | URL                          |
| ---------------- | ---------------------------- |
| Customer Web     | http://localhost:3000         |
| Admin Dashboard  | http://localhost:3000/admin   |
| POS              | http://localhost:3000/pos     |
| Shipper PWA      | http://localhost:3000/shipper |
| Backend API      | http://localhost:3001/api     |

### 5. Seed du lieu mau (tuy chon)

```bash
cd backend
npm run seed
```

---

## Ghi chu them

- **Socket.IO** duoc su dung cho: thong bao don hang moi (admin), cap nhat trang thai giao hang (shipper -> customer), thong bao realtime tren POS.
- **Google Drive API** duoc dung de upload hinh anh san pham thay vi luu tru local hoac dung S3.
- **PWA** cho Shipper app: ho tro offline basic, push notification, install tren man hinh chinh dien thoai.
- He thong phan quyen: `admin`, `staff`, `shipper`, `customer` - moi role chi truy cap duoc ung dung tuong ung.

---

> **Tac gia:** Furniture VN Team
> **Phien ban tai lieu:** 1.0
> **Cap nhat lan cuoi:** 04/2026
