# PACKAGE CONFIGURATION

Huong dan cau hinh cac package va dependencies cho he thong Furniture E-Commerce Vietnam.
He thong su dung kien truc monorepo voi npm workspaces.

---

## 1. Root package.json (Monorepo)

File `package.json` tai thu muc goc cua project:

```json
{
  "name": "furniture-vn",
  "version": "1.0.0",
  "private": true,
  "description": "He thong E-Commerce noi that Viet Nam",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:backend": "npm run dev --workspace=apps/backend",
    "dev:fe": "npm run dev --workspace=apps/fe",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:fe\"",
    "build:backend": "npm run build --workspace=apps/backend",
    "build:fe": "npm run build --workspace=apps/fe",
    "build": "npm run build:backend && npm run build:fe",
    "lint": "npm run lint --workspaces --if-present",
    "clean": "rm -rf node_modules apps/*/node_modules packages/*/node_modules"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## 2. Backend package.json (apps/backend/package.json)

```json
{
  "name": "furniture-vn-backend",
  "version": "1.0.0",
  "private": true,
  "description": "Backend API cho he thong Furniture VN - NestJS",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "seed": "ts-node src/seeds/run-seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",

    "@nestjs/mongoose": "^10.0.2",
    "mongoose": "^8.1.1",

    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-google-oauth20": "^2.0.0",

    "@nestjs/platform-socket.io": "^10.3.0",
    "@nestjs/websockets": "^10.3.0",
    "socket.io": "^4.7.4",

    "@nestjs/swagger": "^7.2.0",

    "@nestjs/config": "^3.1.1",

    "@nestjs/throttler": "^5.1.1",

    "bcryptjs": "^2.4.3",

    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",

    "googleapis": "^131.0.0",

    "multer": "^1.4.5-lts.1",

    "nodemailer": "^6.9.8",

    "exceljs": "^4.4.0",

    "compression": "^1.7.4",
    "helmet": "^7.1.0",

    "rxjs": "^7.8.1",
    "reflect-metadata": "^0.2.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/compression": "^1.7.5",
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/passport-jwt": "^4.0.1",
    "@types/node": "^20.11.5",
    "@types/jest": "^29.5.11",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "rimraf": "^5.0.5",
    "source-map-support": "^0.5.21",
    "jest": "^29.7.0"
  }
}
```

### Giai thich cac package chinh:

| Package                        | Muc dich                                              |
|--------------------------------|-------------------------------------------------------|
| `@nestjs/mongoose`, `mongoose` | Ket noi va thao tac voi MongoDB                       |
| `@nestjs/jwt`, `passport-jwt`  | Xac thuc bang JWT (access token, refresh token)        |
| `passport-google-oauth20`      | Dang nhap bang tai khoan Google                        |
| `socket.io`                    | Thong bao realtime (don hang moi, cap nhat trang thai) |
| `@nestjs/swagger`              | Tu dong tao API documentation                         |
| `googleapis`                   | Upload hinh anh san pham len Google Drive              |
| `nodemailer`                   | Gui email thong bao don hang, xac nhan tai khoan       |
| `exceljs`                      | Xuat bao cao don hang, san pham ra file Excel          |
| `bcryptjs`                     | Ma hoa mat khau nguoi dung                            |
| `class-validator`              | Validate du lieu dau vao (DTO)                        |
| `helmet`, `compression`        | Bao mat va toi uu hoa response                        |
| `@nestjs/throttler`            | Gioi han so luong request (chong spam/DDoS)           |
| `multer`                       | Xu ly upload file (hinh anh san pham)                 |
| `crypto`                       | Co san trong Node.js, dung tao token ngau nhien        |

---

## 3. Frontend package.json (apps/fe/package.json)

```json
{
  "name": "furniture-vn-frontend",
  "version": "1.0.0",
  "private": true,
  "description": "Frontend cho he thong Furniture VN - Next.js",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",

    "@tanstack/react-query": "^5.17.19",

    "zustand": "^4.5.0",

    "socket.io-client": "^4.7.4",

    "axios": "^1.6.5",

    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "class-variance-authority": "^0.7.0",

    "lucide-react": "^0.312.0",

    "framer-motion": "^11.0.3",

    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-accordion": "^1.1.2",

    "react-hot-toast": "^2.4.1",

    "recharts": "^2.12.0",

    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",

    "date-fns": "^3.3.1",

    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/leaflet": "^1.9.8",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0"
  }
}
```

### Giai thich cac package chinh:

| Package                    | Muc dich                                                 |
|----------------------------|----------------------------------------------------------|
| `next 14`                  | Framework React voi SSR, routing, API routes             |
| `@tanstack/react-query`    | Quan ly server state, caching, refetch tu dong           |
| `zustand`                  | Quan ly client state (gio hang, auth, UI state)          |
| `socket.io-client`         | Ket noi WebSocket de nhan thong bao realtime             |
| `axios`                    | HTTP client goi API backend                              |
| `clsx`, `tailwind-merge`   | Utility gop classname TailwindCSS, tranh conflict        |
| `class-variance-authority` | Tao component variants (button primary, secondary, ...)  |
| `lucide-react`             | Bo icon nhe, dep cho UI                                  |
| `framer-motion`            | Animation cho cac component (modal, page transition)     |
| `@radix-ui/*`              | Headless UI components (accessible, customizable)        |
| `react-hot-toast`          | Hien thi thong bao toast (them gio hang, dat hang, ...)  |
| `recharts`                 | Bieu do thong ke cho trang admin (doanh thu, don hang)   |
| `leaflet`, `react-leaflet` | Ban do theo doi vi tri shipper giao hang                 |
| `date-fns`                 | Format ngay thang theo tieng Viet                        |
| `react-hook-form`, `zod`   | Quan ly form va validate du lieu phia client             |

---

## 4. Shared Types Package (packages/shared-types/package.json)

```json
{
  "name": "@furniture-vn/shared-types",
  "version": "1.0.0",
  "private": true,
  "description": "Shared TypeScript types giua backend va frontend",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint \"src/**/*.ts\" --fix"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### Cau truc thu muc shared-types:

```
packages/shared-types/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Export tat ca types
    ├── user.types.ts         # User, UserRole, AuthResponse
    ├── product.types.ts      # Product, Category, ProductVariant
    ├── order.types.ts        # Order, OrderStatus, OrderItem
    ├── cart.types.ts         # Cart, CartItem
    ├── review.types.ts       # Review, Rating
    ├── address.types.ts      # Address, Province, District, Ward
    ├── notification.types.ts # Notification, NotificationType
    ├── payment.types.ts      # PaymentMethod (COD, BankTransfer)
    └── common.types.ts       # Pagination, ApiResponse, SortOrder
```

### tsconfig.json cho shared-types:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Su dung shared-types trong backend va frontend:

```typescript
// Trong backend hoac frontend
import { User, OrderStatus, PaymentMethod } from '@furniture-vn/shared-types';
```

> **Luu y:** Vi su dung npm workspaces, package `@furniture-vn/shared-types` duoc symlink tu dong. Khong can publish len npm registry.

---

## 5. TailwindCSS Config (apps/fe/tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mau chu dao - Tone go tu nhien
        primary: {
          50: '#fdf8f0',
          100: '#f9eddb',
          200: '#f2d7b0',
          300: '#e9bc7e',
          400: '#df9a4b',
          500: '#d4802b',   // Mau chinh - Nau go
          600: '#be6521',
          700: '#9e4c1e',
          800: '#803e1f',
          900: '#69341c',
          950: '#39190d',
        },
        // Mau phu - Xanh reu (thien nhien, go xanh)
        secondary: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c7d7c7',
          300: '#a1baa1',
          400: '#779877',
          500: '#577b57',   // Mau phu chinh
          600: '#446244',
          700: '#384f38',
          800: '#2f402f',
          900: '#283528',
          950: '#131c13',
        },
        // Mau nen - Tone am, nhe nhu go sang
        surface: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e6',
          300: '#f5e9d3',
          400: '#eedcbe',
          500: '#e5cca5',
        },
        // Mau accent - Vang dong (diem nhan)
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#d4a017',   // Vang dong
          600: '#a47d12',
          700: '#7a5d10',
          800: '#654b14',
          900: '#553f17',
        },
        // Mau trang thai don hang
        status: {
          pending: '#f59e0b',     // Vang - Cho xac nhan
          confirmed: '#3b82f6',   // Xanh duong - Da xac nhan
          shipping: '#8b5cf6',    // Tim - Dang giao
          delivered: '#22c55e',   // Xanh la - Da giao
          cancelled: '#ef4444',   // Do - Da huy
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Playfair Display', 'serif'],  // Font cho tieu de, mang cam giac sang trong
      },
      borderRadius: {
        'furniture': '0.625rem',  // Bo goc dac trung
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'navbar': '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Giai thich bang mau:

| Nhom mau     | Muc dich su dung                                            |
|--------------|-------------------------------------------------------------|
| `primary`    | Buttons chinh, links, highlights - Tone nau go tu nhien     |
| `secondary`  | Buttons phu, badges, tags - Tone xanh reu thien nhien       |
| `surface`    | Background sections, cards - Tone am nhu go sang            |
| `accent`     | Gia khuyen mai, badges noi bat - Vang dong diem nhan        |
| `status`     | Mau trang thai don hang (cho, xac nhan, giao, hoan thanh)   |

---

## 6. Next.js Config (apps/fe/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        // Hinh anh tu Google Drive (san pham)
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/uc/**',
      },
      {
        // Hinh anh tu Google Drive API
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        // Avatar tu Google OAuth
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // Proxy API calls den backend (tranh CORS khi development)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    // Toi uu hoa import cac thu vien lon
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-label',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-avatar',
      '@radix-ui/react-accordion',
      'recharts',
      'framer-motion',
      'date-fns',
    ],
  },
};

module.exports = nextConfig;
```

---

## 7. PostCSS Config (apps/fe/postcss.config.js)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 8. Cai dat va Chay project

### Lan dau tien:

```bash
# Clone project
git clone <repository-url> furniture-vn
cd furniture-vn

# Cai dat tat ca dependencies (npm workspaces tu dong cai cho tat ca packages)
npm install

# Tao file .env cho backend
cp apps/backend/.env.example apps/backend/.env
# -> Sua cac gia tri trong .env theo huong dan o file 00-environment.md

# Tao file .env.local cho frontend
cp apps/fe/.env.example apps/fe/.env.local
# -> Sua cac gia tri trong .env.local

# Chay development
npm run dev
```

### Cac lenh thuong dung:

```bash
# Chay chi backend
npm run dev:backend

# Chay chi frontend
npm run dev:fe

# Chay ca 2
npm run dev

# Build production
npm run build

# Seed du lieu mau (categories, sample products)
npm run seed --workspace=apps/backend

# Chay tests
npm test --workspace=apps/backend
```

---

## 9. Cau truc thu muc tong quan

```
furniture-vn/
├── package.json                    # Root - npm workspaces config
├── node_modules/                   # Shared node_modules (hoisted)
├── apps/
│   ├── backend/
│   │   ├── package.json            # NestJS dependencies
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       └── modules/
│   └── fe/
│       ├── package.json            # Next.js dependencies
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── tsconfig.json
│       └── src/
│           ├── app/
│           ├── components/
│           ├── hooks/
│           ├── lib/
│           ├── stores/
│           └── types/
└── packages/
    └── shared-types/
        ├── package.json            # Shared TypeScript types
        ├── tsconfig.json
        └── src/
```
