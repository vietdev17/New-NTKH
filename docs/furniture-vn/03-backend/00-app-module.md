# APP MODULE - NestJS Bootstrap

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module goc (Root Module), bootstrap, global pipes, filters, interceptors, utilities
> Phien ban: 2.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Cau truc thu muc](#1-cau-truc-thu-muc)
2. [app.module.ts - Root Module](#2-appmodulets---root-module)
3. [main.ts - Bootstrap](#3-maints---bootstrap)
4. [Global HttpException Filter](#4-global-httpexception-filter)
5. [Custom BusinessException](#5-custom-businessexception)
6. [Response Interceptor](#6-response-interceptor)
7. [Pagination Utility](#7-pagination-utility)
8. [Bang tong hop cau hinh](#8-bang-tong-hop-cau-hinh)

---

## 1. Cau truc thu muc

```
src/
├── main.ts                              # Entry point, bootstrap
├── app.module.ts                        # Root module
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts     # Global exception filter
│   ├── interceptors/
│   │   └── response.interceptor.ts      # Transform response format
│   ├── exceptions/
│   │   └── business.exception.ts        # Custom business exception
│   ├── dto/
│   │   ├── pagination.dto.ts            # PaginationDto input
│   │   └── paginated-response.dto.ts    # PaginatedResponse<T> output
│   └── decorators/
│       └── api-paginated.decorator.ts   # Swagger pagination decorator
├── modules/
│   ├── auth/                            # Xac thuc
│   ├── users/                           # Quan ly nguoi dung
│   ├── categories/                      # Danh muc san pham
│   ├── products/                        # San pham
│   ├── orders/                          # Don hang
│   ├── coupons/                         # Ma giam gia
│   ├── reviews/                         # Danh gia san pham
│   ├── wishlist/                        # Danh sach yeu thich
│   ├── returns/                         # Tra hang / hoan tien
│   ├── notifications/                   # Thong bao real-time
│   ├── upload/                          # Upload file (Cloudinary)
│   ├── shippers/                        # Quan ly shipper & vi tri
│   ├── shifts/                          # Ca lam viec (POS)
│   └── dashboard/                       # Thong ke, bao cao
└── config/
    └── configuration.ts                 # Env config factory
```

---

## 2. app.module.ts - Root Module

> Import toan bo 14 feature modules + infrastructure modules.
> Su dung `ConfigModule.forRoot()` de load bien moi truong.
> `ThrottlerModule` gioi han request chong brute-force.

```typescript
// ============================================================
// src/app.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// ---- Feature Modules ----
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { ShippersModule } from './modules/shippers/shippers.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// ---- Config ----
import configuration from './config/configuration';

@Module({
  imports: [
    // ---- Environment Config ----
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // ---- MongoDB Connection ----
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        dbName: configService.get<string>('database.name'),
        autoIndex: true,
      }),
    }),

    // ---- Rate Limiting ----
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: configService.get<number>('throttle.shortTtl', 1000),
          limit: configService.get<number>('throttle.shortLimit', 3),
        },
        {
          name: 'medium',
          ttl: configService.get<number>('throttle.mediumTtl', 10000),
          limit: configService.get<number>('throttle.mediumLimit', 20),
        },
        {
          name: 'long',
          ttl: configService.get<number>('throttle.longTtl', 60000),
          limit: configService.get<number>('throttle.longLimit', 100),
        },
      ],
    }),

    // ---- Cron Jobs ----
    ScheduleModule.forRoot(),

    // ---- 14 Feature Modules ----
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    ReviewsModule,
    WishlistModule,
    ReturnsModule,
    NotificationsModule,
    UploadModule,
    ShippersModule,
    ShiftsModule,
    DashboardModule,
  ],
  providers: [
    // ThrottlerGuard ap dung global cho tat ca routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Configuration Factory

```typescript
// ============================================================
// src/config/configuration.ts
// ============================================================
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    name: process.env.MONGODB_NAME || 'furniture_vn',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || 'no-reply@furniture-vn.com',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  throttle: {
    shortTtl: parseInt(process.env.THROTTLE_SHORT_TTL, 10) || 1000,
    shortLimit: parseInt(process.env.THROTTLE_SHORT_LIMIT, 10) || 3,
    mediumTtl: parseInt(process.env.THROTTLE_MEDIUM_TTL, 10) || 10000,
    mediumLimit: parseInt(process.env.THROTTLE_MEDIUM_LIMIT, 10) || 20,
    longTtl: parseInt(process.env.THROTTLE_LONG_TTL, 10) || 60000,
    longLimit: parseInt(process.env.THROTTLE_LONG_LIMIT, 10) || 100,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});
```

---

## 3. main.ts - Bootstrap

> Entry point cua ung dung NestJS.
> Cau hinh: Global Validation Pipe, CORS, Swagger, Compression, Helmet, Socket.IO adapter.

```typescript
// ============================================================
// src/main.ts
// ============================================================
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  // ---- Global Prefix ----
  app.setGlobalPrefix('api/v1');

  // ---- CORS ----
  app.enableCors({
    origin: configService.get<string>('cors.origin', 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600,
  });

  // ---- Security: Helmet ----
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable CSP cho Swagger UI
    }),
  );

  // ---- Compression ----
  app.use(compression());

  // ---- Global Validation Pipe ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Loai bo cac field khong co trong DTO
      forbidNonWhitelisted: true,   // Throw error neu co field thua
      transform: true,              // Tu dong transform types (string -> number)
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      stopAtFirstError: false,
    }),
  );

  // ---- Global Exception Filter ----
  app.useGlobalFilters(new HttpExceptionFilter());

  // ---- Global Response Interceptor ----
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ---- Socket.IO Adapter ----
  app.useWebSocketAdapter(new IoAdapter(app));

  // ---- Swagger (chi bat trong development/staging) ----
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Furniture VN API')
      .setDescription(
        'API documentation cho he thong Thuong Mai Dien Tu Noi That Viet Nam. '
        + 'Bao gom: Auth, Users, Products, Orders, Coupons, Reviews, Notifications, ...',
      )
      .setVersion('2.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Nhap JWT access token',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Auth', 'Dang ky, dang nhap, refresh token, OAuth')
      .addTag('Users', 'Quan ly nguoi dung (Admin)')
      .addTag('Categories', 'Danh muc san pham')
      .addTag('Products', 'San pham noi that')
      .addTag('Orders', 'Don hang')
      .addTag('Coupons', 'Ma giam gia, khuyen mai')
      .addTag('Reviews', 'Danh gia san pham')
      .addTag('Wishlist', 'Danh sach yeu thich')
      .addTag('Returns', 'Tra hang / hoan tien')
      .addTag('Notifications', 'Thong bao real-time')
      .addTag('Upload', 'Upload file / hinh anh')
      .addTag('Shippers', 'Quan ly shipper, vi tri')
      .addTag('Shifts', 'Ca lam viec (POS)')
      .addTag('Dashboard', 'Thong ke, bao cao')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log('Swagger docs available at /api/docs');
  }

  // ---- Start Server ----
  const port = configService.get<number>('port', 3001);
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`API prefix: /api/v1`);
  logger.log(`Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap();
```

---

## 4. Global HttpException Filter

> Bat tat ca HttpException va BusinessException, tra ve response thong nhat.
> Log chi tiet error de debug.

```typescript
// ============================================================
// src/common/filters/http-exception.filter.ts
// ============================================================
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]> | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchTo<any>().getHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode: number;
    let message: string;
    let errors: Record<string, string[]> | string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || resp.error || 'An error occurred';
        errors = resp.errors;

        // class-validator tra ve mang message
        if (Array.isArray(resp.message)) {
          errors = resp.message;
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log full error cho internal errors
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      this.logger.error('Unknown exception', exception);
    }

    const errorResponse: ErrorResponseBody = {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log warning cho client errors, error cho server errors
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode}`,
        JSON.stringify(errorResponse),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}
```

### Vi du response loi

**Validation Error (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "timestamp": "2026-04-02T10:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "San pham khong ton tai",
  "timestamp": "2026-04-02T10:30:00.000Z",
  "path": "/api/v1/products/660a1b2c3d4e5f6a7b8c9d0e"
}
```

**Internal Server Error (500):**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-04-02T10:30:00.000Z",
  "path": "/api/v1/orders"
}
```

---

## 5. Custom BusinessException

> Exception class rieng cho business logic errors.
> Cho phep truyen error code de frontend xu ly cac truong hop cu the.

```typescript
// ============================================================
// src/common/exceptions/business.exception.ts
// ============================================================
import { HttpException, HttpStatus } from '@nestjs/common';

export interface BusinessErrorDetail {
  code: string;        // Ma loi, vd: 'PRODUCT_OUT_OF_STOCK', 'COUPON_EXPIRED'
  message: string;     // Mo ta loi
  field?: string;      // Truong bi loi (optional)
}

export class BusinessException extends HttpException {
  constructor(
    detail: BusinessErrorDetail,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        success: false,
        statusCode,
        message: detail.message,
        errorCode: detail.code,
        ...(detail.field && { field: detail.field }),
      },
      statusCode,
    );
  }
}

// ============================================================
// Cac error codes duoc dinh nghia san
// ============================================================
export const BusinessErrors = {
  // ---- Auth ----
  EMAIL_EXISTS: {
    code: 'EMAIL_EXISTS',
    message: 'Email da duoc su dung',
    field: 'email',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Email hoac mat khau khong chinh xac',
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Token da het han',
  },
  TOKEN_INVALID: {
    code: 'TOKEN_INVALID',
    message: 'Token khong hop le',
  },
  ACCOUNT_DEACTIVATED: {
    code: 'ACCOUNT_DEACTIVATED',
    message: 'Tai khoan da bi vo hieu hoa',
  },

  // ---- Product ----
  PRODUCT_NOT_FOUND: {
    code: 'PRODUCT_NOT_FOUND',
    message: 'San pham khong ton tai',
  },
  PRODUCT_OUT_OF_STOCK: {
    code: 'PRODUCT_OUT_OF_STOCK',
    message: 'San pham da het hang',
    field: 'quantity',
  },
  INSUFFICIENT_STOCK: {
    code: 'INSUFFICIENT_STOCK',
    message: 'So luong ton kho khong du',
    field: 'quantity',
  },

  // ---- Order ----
  ORDER_NOT_FOUND: {
    code: 'ORDER_NOT_FOUND',
    message: 'Don hang khong ton tai',
  },
  ORDER_CANNOT_CANCEL: {
    code: 'ORDER_CANNOT_CANCEL',
    message: 'Khong the huy don hang o trang thai hien tai',
  },
  ORDER_ALREADY_DELIVERED: {
    code: 'ORDER_ALREADY_DELIVERED',
    message: 'Don hang da duoc giao',
  },

  // ---- Coupon ----
  COUPON_NOT_FOUND: {
    code: 'COUPON_NOT_FOUND',
    message: 'Ma giam gia khong ton tai',
  },
  COUPON_EXPIRED: {
    code: 'COUPON_EXPIRED',
    message: 'Ma giam gia da het han',
  },
  COUPON_USAGE_LIMIT: {
    code: 'COUPON_USAGE_LIMIT',
    message: 'Ma giam gia da het luot su dung',
  },
  COUPON_MIN_ORDER: {
    code: 'COUPON_MIN_ORDER',
    message: 'Don hang chua dat gia tri toi thieu de ap dung ma giam gia',
  },

  // ---- User ----
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'Nguoi dung khong ton tai',
  },
  PHONE_EXISTS: {
    code: 'PHONE_EXISTS',
    message: 'So dien thoai da duoc su dung',
    field: 'phone',
  },

  // ---- Review ----
  REVIEW_ALREADY_EXISTS: {
    code: 'REVIEW_ALREADY_EXISTS',
    message: 'Ban da danh gia san pham nay',
  },
  REVIEW_NOT_PURCHASED: {
    code: 'REVIEW_NOT_PURCHASED',
    message: 'Ban chua mua san pham nay, khong the danh gia',
  },

  // ---- Return ----
  RETURN_WINDOW_EXPIRED: {
    code: 'RETURN_WINDOW_EXPIRED',
    message: 'Da qua thoi gian cho phep tra hang (7 ngay)',
  },

  // ---- Shipper ----
  SHIPPER_NOT_AVAILABLE: {
    code: 'SHIPPER_NOT_AVAILABLE',
    message: 'Shipper hien khong san sang',
  },
} as const;
```

### Vi du su dung BusinessException

```typescript
// Trong service
import { BusinessException, BusinessErrors } from '../../common/exceptions/business.exception';
import { HttpStatus } from '@nestjs/common';

// Truong hop 1: Su dung error code dinh nghia san
throw new BusinessException(BusinessErrors.PRODUCT_OUT_OF_STOCK);

// Truong hop 2: Custom message voi status code cu the
throw new BusinessException(
  {
    code: 'INSUFFICIENT_STOCK',
    message: `Chi con ${product.stock} san pham trong kho`,
    field: 'quantity',
  },
  HttpStatus.CONFLICT,
);
```

**Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "San pham da het hang",
  "errorCode": "PRODUCT_OUT_OF_STOCK",
  "field": "quantity"
}
```

---

## 6. Response Interceptor

> Transform tat ca response thanh cau truc thong nhat: `{ success, data, message }`.
> Ap dung cho moi route tra ve thanh cong.

```typescript
// ============================================================
// src/common/interceptors/response.interceptor.ts
// ============================================================
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchTo<any>().getHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // Neu data da co format { success, data, message } thi giu nguyen
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Xac dinh message dua tren HTTP method va status code
        const request = ctx.getRequest();
        let message = 'Thanh cong';

        switch (request.method) {
          case 'POST':
            message = statusCode === 201 ? 'Tao thanh cong' : 'Thanh cong';
            break;
          case 'PATCH':
          case 'PUT':
            message = 'Cap nhat thanh cong';
            break;
          case 'DELETE':
            message = 'Xoa thanh cong';
            break;
        }

        return {
          success: true,
          data: data ?? null,
          message,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

### Vi du response thanh cong

**GET /api/v1/products/660a1b2c3d4e5f6a7b8c9d0e**
```json
{
  "success": true,
  "data": {
    "_id": "660a1b2c3d4e5f6a7b8c9d0e",
    "name": "Ghe Sofa Da Cao Cap",
    "price": 12500000,
    "stock": 15
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:30:00.000Z"
}
```

**POST /api/v1/orders**
```json
{
  "success": true,
  "data": {
    "_id": "660b2c3d4e5f6a7b8c9d0e1f",
    "orderCode": "FVN-20260402-001",
    "totalAmount": 25000000
  },
  "message": "Tao thanh cong",
  "timestamp": "2026-04-02T10:31:00.000Z"
}
```

---

## 7. Pagination Utility

### 7.1 PaginationDto (Input)

> DTO chung cho tat ca cac API co phan trang.
> Su dung voi `@Query()` decorator.

```typescript
// ============================================================
// src/common/dto/pagination.dto.ts
// ============================================================
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'So trang (bat dau tu 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'So luong item moi trang',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Truong sap xep (vd: createdAt, price, name)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thu tu sap xep',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Tu khoa tim kiem',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // ---- Computed helpers (khong phai input) ----
  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get sortOption(): Record<string, 1 | -1> {
    return { [this.sortBy]: this.sortOrder === SortOrder.ASC ? 1 : -1 };
  }
}
```

### 7.2 PaginatedResponse<T> (Output)

> Generic response type cho tat ca paginated endpoints.
> Bao gom metadata: tong so item, tong so trang, trang hien tai, ...

```typescript
// ============================================================
// src/common/dto/paginated-response.dto.ts
// ============================================================

export class PaginationMeta {
  /** Trang hien tai */
  currentPage: number;

  /** So item moi trang */
  itemsPerPage: number;

  /** Tong so item */
  totalItems: number;

  /** Tong so trang */
  totalPages: number;

  /** Co trang tiep theo khong */
  hasNextPage: boolean;

  /** Co trang truoc khong */
  hasPreviousPage: boolean;
}

export class PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;

  constructor(items: T[], totalItems: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalItems / limit);

    this.items = items;
    this.meta = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

// ============================================================
// Helper function de tao PaginatedResponse tu Mongoose query
// ============================================================
import { Model, FilterQuery, PopulateOptions } from 'mongoose';
import { PaginationDto } from './pagination.dto';

export async function paginate<T>(
  model: Model<T>,
  paginationDto: PaginationDto,
  filter: FilterQuery<T> = {},
  options?: {
    populate?: PopulateOptions | PopulateOptions[];
    select?: string;
    lean?: boolean;
  },
): Promise<PaginatedResponse<T>> {
  const { page, limit, skip, sortOption } = paginationDto;

  const [items, totalItems] = await Promise.all([
    model
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate(options?.populate || [])
      .select(options?.select || '')
      .lean(options?.lean ?? true)
      .exec(),
    model.countDocuments(filter).exec(),
  ]);

  return new PaginatedResponse<T>(items as T[], totalItems, page, limit);
}
```

### Vi du su dung trong Service

```typescript
// products.service.ts
async findAll(query: QueryProductDto): Promise<PaginatedResponse<Product>> {
  const filter: FilterQuery<Product> = { isDeleted: false };

  if (query.category) {
    filter.category = new Types.ObjectId(query.category);
  }
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }

  return paginate(this.productModel, query, filter, {
    populate: { path: 'category', select: 'name slug' },
    select: '-isDeleted -deletedAt',
  });
}
```

### Vi du response phan trang

**GET /api/v1/products?page=2&limit=5&sortBy=price&sortOrder=asc**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "660a1b2c3d4e5f6a7b8c9d0e",
        "name": "Ban Tra Go Soi",
        "price": 3500000,
        "stock": 20,
        "category": {
          "_id": "660a0a1b2c3d4e5f6a7b8c9d",
          "name": "Ban",
          "slug": "ban"
        }
      },
      {
        "_id": "660a2b3c4d5e6f7a8b9c0d1e",
        "name": "Ke Sach 5 Tang",
        "price": 4200000,
        "stock": 8,
        "category": {
          "_id": "660a0b2c3d4e5f6a7b8c9d0e",
          "name": "Ke - Tu",
          "slug": "ke-tu"
        }
      }
    ],
    "meta": {
      "currentPage": 2,
      "itemsPerPage": 5,
      "totalItems": 47,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  },
  "message": "Thanh cong",
  "timestamp": "2026-04-02T10:30:00.000Z"
}
```

---

## 8. Bang tong hop cau hinh

### Bien moi truong (.env)

| Bien | Mo ta | Gia tri mac dinh |
|------|-------|------------------|
| `PORT` | Port server | `3001` |
| `NODE_ENV` | Moi truong | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_NAME` | Ten database | `furniture_vn` |
| `JWT_ACCESS_SECRET` | Secret cho access token | `access-secret-dev` |
| `JWT_REFRESH_SECRET` | Secret cho refresh token | `refresh-secret-dev` |
| `JWT_ACCESS_EXPIRATION` | Thoi gian het han access token | `15m` |
| `JWT_REFRESH_EXPIRATION` | Thoi gian het han refresh token | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | - |
| `GOOGLE_CALLBACK_URL` | Google OAuth Callback | `http://localhost:3001/api/v1/auth/google/callback` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP username | - |
| `MAIL_PASS` | SMTP password | - |
| `MAIL_FROM` | Sender email | `no-reply@furniture-vn.com` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL (dung cho email links) | `http://localhost:3000` |
| `THROTTLE_SHORT_TTL` | Rate limit - short window (ms) | `1000` |
| `THROTTLE_SHORT_LIMIT` | Rate limit - short max requests | `3` |
| `THROTTLE_MEDIUM_TTL` | Rate limit - medium window (ms) | `10000` |
| `THROTTLE_MEDIUM_LIMIT` | Rate limit - medium max requests | `20` |
| `THROTTLE_LONG_TTL` | Rate limit - long window (ms) | `60000` |
| `THROTTLE_LONG_LIMIT` | Rate limit - long max requests | `100` |

### Global Middlewares & Pipes

| Loai | Ten | Mo ta |
|------|-----|-------|
| Pipe | `ValidationPipe` | Validate DTO voi class-validator, whitelist, transform |
| Filter | `HttpExceptionFilter` | Bat moi exception, tra ve format thong nhat |
| Interceptor | `ResponseInterceptor` | Wrap response thanh `{ success, data, message }` |
| Guard | `ThrottlerGuard` | Rate limiting global |
| Middleware | `helmet` | Security headers |
| Middleware | `compression` | Gzip compression |
| Adapter | `IoAdapter` | Socket.IO WebSocket adapter |

### Packages can thiet

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/config": "^3.x",
    "@nestjs/mongoose": "^10.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@nestjs/throttler": "^5.x",
    "@nestjs/schedule": "^4.x",
    "@nestjs/platform-socket.io": "^10.x",
    "@nestjs/websockets": "^10.x",
    "mongoose": "^8.x",
    "passport": "^0.7.x",
    "passport-jwt": "^4.x",
    "passport-google-oauth20": "^2.x",
    "bcryptjs": "^2.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "compression": "^1.x",
    "helmet": "^7.x",
    "rxjs": "^7.x",
    "nodemailer": "^6.x",
    "cloudinary": "^2.x"
  }
}
```
