# Kien truc He thong - Furniture E-Commerce Vietnam

> Tai lieu ky thuat mo ta kien truc tong the cua he thong thuong mai dien tu noi that.

---

## Muc luc

1. [So do kien truc tong the](#1-so-do-kien-truc-tong-the)
2. [Luong du lieu (Data Flow)](#2-luong-du-lieu)
3. [Quy uoc API](#3-quy-uoc-api)
4. [Xu ly loi (Error Handling)](#4-xu-ly-loi)
5. [Gioi han truy cap (Rate Limiting)](#5-gioi-han-truy-cap)
6. [Cau hinh CORS](#6-cau-hinh-cors)
7. [Kien truc xac thuc (Authentication)](#7-kien-truc-xac-thuc)
8. [Kien truc Socket.IO](#8-kien-truc-socketio)
9. [Nguyen tac thiet ke Database](#9-nguyen-tac-thiet-ke-database)
10. [Quy uoc cau truc thu muc](#10-quy-uoc-cau-truc-thu-muc)

---

## 1. So do kien truc tong the

```
                          +---------------------------+
                          |        CLIENTS            |
                          +---------------------------+
                          |                           |
                  +-------+-------+          +--------+--------+
                  | Web Browser   |          | Mobile Browser  |
                  | (Customer/    |          | (Shipper App)   |
                  |  Admin/POS)   |          |                 |
                  +-------+-------+          +--------+--------+
                          |                           |
                          +----------+  +-------------+
                                     |  |
                                     v  v
                  +------------------------------------------+
                  |           FRONTEND (Next.js 14+)         |
                  |                                          |
                  |  +----------+ +----------+ +-----------+ |
                  |  | Customer | | Admin    | | POS       | |
                  |  | App      | | Dashboard| | Terminal  | |
                  |  +----------+ +----------+ +-----------+ |
                  |  +-----------+                           |
                  |  | Shipper   |    Server-Side Rendering  |
                  |  | App       |    + Client Components    |
                  |  +-----------+                           |
                  +---+------------------+-------------------+
                      |                  |
                      | REST API         | WebSocket (Socket.IO)
                      | (HTTPS)          | (WSS)
                      v                  v
                  +------------------------------------------+
                  |           BACKEND (NestJS)                |
                  |                                          |
                  |  +-------------+  +--------------------+ |
                  |  | REST API    |  | Socket.IO Gateway  | |
                  |  | Controllers |  | (Real-time Events) | |
                  |  +------+------+  +---------+----------+ |
                  |         |                   |            |
                  |  +------+-------------------+----------+ |
                  |  |          Service Layer               | |
                  |  |  (Business Logic + Validation)       | |
                  |  +------+-------------------+----------+ |
                  |         |                   |            |
                  |  +------+------+  +---------+----------+ |
                  |  | Mongoose    |  | External Services  | |
                  |  | ODM Layer   |  |                    | |
                  |  +------+------+  +----+----------+----+ |
                  |         |              |          |      |
                  +---------|--------------|----------|------+
                            |              |          |
                  +---------+--+    +------+---+ +---+----------+
                  |            |    |          | |              |
                  |  MongoDB   |    |  Google  | |  Payment     |
                  |  Atlas     |    |  Drive   | |  Gateway     |
                  |            |    |  (Files) | |  (Bank API)  |
                  |  - Users   |    |          | |              |
                  |  - Products|    +----------+ +--------------+
                  |  - Orders  |
                  |  - Reviews |
                  |  - Carts   |
                  |  - ...     |
                  +------------+
```

### Thanh phan chinh

| Thanh phan         | Cong nghe          | Muc dich                                       |
| ------------------ | ------------------ | ---------------------------------------------- |
| Frontend           | Next.js 14+ (App Router) | SSR/CSR, routing, UI                     |
| Backend API        | NestJS             | REST API, business logic, validation           |
| Real-time          | Socket.IO          | Theo doi don hang, thong bao, GPS shipper      |
| Database           | MongoDB (Mongoose) | Luu tru du lieu                                |
| File Storage       | Google Drive API   | Luu anh san pham, anh xac nhan giao hang       |
| Authentication     | JWT (Passport.js)  | Xac thuc va phan quyen                         |
| State Management   | Zustand            | Quan ly trang thai client-side                  |

---

## 2. Luong du lieu

### 2.1. Vong doi don hang (Order Lifecycle)

```
  CUSTOMER                      SYSTEM                        ADMIN/SHIPPER
  ========                      ======                        =============

  [Duyet san pham]
       |
       v
  [Xem chi tiet] ----GET /products/:id---->  [Tra ve san pham]
       |
       v
  [Them vao gio] ---POST /cart/items-------> [Luu vao Cart DB]
       |                                          |
       v                                          v
  [Xem gio hang] ---GET /cart---------------> [Tinh tong tien]
       |                                      [Kiem tra ton kho]
       |
       v
  [Dat hang]  ----POST /orders/checkout--->  [Tao don hang]
       |                                      status: PENDING
       |                                          |
       |        <--Socket: order:created---       |
       |                                          |
       |                                          v
       |                                     [Admin nhan thong bao]
       |                                          |
       |                                          v
       |                            +-------------+---------------+
       |                            |                             |
       |                            v                             v
       |                     [COD - Xac nhan]           [Bank Transfer]
       |                     status: CONFIRMED          [Cho chuyen khoan]
       |                            |                         |
       |                            |                   [Xac nhan thanh toan]
       |                            |                   status: CONFIRMED
       |                            +--------+--------+
       |                                     |
       |                                     v
       |                              [Chuan bi hang]
       |                              status: PREPARING
       |                                     |
       |                                     v
       |                              [Chi dinh shipper]
       |                              status: ASSIGNED
       |                                     |
       |        <--Socket: order:assigned--  |
       |                                     |------> [Shipper nhan don]
       |                                              status: PICKED_UP
       |                                                    |
       |        <--Socket: order:picked_up--                |
       |                                                    v
       |                                              [Dang giao hang]
       |                                              status: IN_TRANSIT
       |                                                    |
       |        <--Socket: gps:update-------                |
       |        (Theo doi vi tri real-time)                  |
       |                                                    v
       |                                              [Giao thanh cong]
       |                                              status: DELIVERED
       |                                              [Chup anh xac nhan]
       |                                              [Upload Google Drive]
       |        <--Socket: order:delivered--                |
       |                                                    |
       v                                                    v
  [Danh gia san pham]                                 [Hoan thanh]
  POST /reviews                                       status: COMPLETED
```

**Trang thai don hang (Order Status Enum):**

```
PENDING --> CONFIRMED --> PREPARING --> ASSIGNED --> PICKED_UP --> IN_TRANSIT --> DELIVERED --> COMPLETED
    |           |             |            |            |             |              |
    +------>----+-------->----+------->----+------->----+-------->----+--------->----+---> CANCELLED
```

### 2.2. Luong xac thuc (Authentication Flow)

```
  CLIENT                           BACKEND                         DATABASE
  ======                           =======                         ========

  === DANG KY (Register) ===

  [Form dang ky]
       |
       +---POST /auth/register---->  [Validate DTO]
            {                              |
              name, email,                 v
              password, phone        [Hash password (bcrypt)]
            }                              |
                                           v
                                     [Luu user moi] -----------> [MongoDB: users]
                                           |
                                           v
                                     [Tao JWT tokens]
                                     access:  15 phut
                                     refresh: 30 ngay
                                           |
       <---{ accessToken, refreshToken }---+
       |
       v
  [Luu tokens]
  accessToken  -> Memory/Cookie (httpOnly)
  refreshToken -> Cookie (httpOnly, secure)


  === DANG NHAP (Login) ===

  [Form dang nhap]
       |
       +---POST /auth/login-------->  [Validate credentials]
            {                               |
              email,                        v
              password               [So sanh bcrypt hash] <--- [MongoDB: users]
            }                               |
                                            v
                                      [Tao JWT tokens]
                                      access:  15 phut
                                      refresh: 30 ngay
                                            |
       <---{ accessToken, refreshToken }----+


  === TU DONG LAM MOI TOKEN (Auto Refresh) ===

  [API Request]
       |
       +--Authorization: Bearer {accessToken}-->  [Verify JWT]
                                                       |
                                              +--------+--------+
                                              |                 |
                                           VALID             EXPIRED
                                              |                 |
                                              v                 v
                                         [Xu ly           [Tra ve 401]
                                          request]
       <--401 Unauthorized-----------------------------------------+
       |
       v
  [Interceptor bat 401]
       |
       +---POST /auth/refresh--------->  [Verify refresh token]
            {                                   |
              refreshToken                      v
            }                            [Tao access token moi]
                                                |
       <---{ accessToken (moi) }----------------+
       |
       v
  [Retry API request ban dau voi token moi]


  === DANG XUAT (Logout) ===

  [Nhan Logout]
       |
       +---POST /auth/logout---------> [Xoa refresh token khoi DB]
                                       [Blacklist access token]
       <---{ success: true }
       |
       v
  [Xoa tokens khoi client]
```

**JWT Token Structure:**

```
Access Token Payload:
{
  sub: "userId",           // User ID
  email: "user@email.com",
  role: "customer",        // admin | manager | staff | customer | shipper
  iat: 1234567890,         // Issued at
  exp: 1234568790          // Expires (15 min)
}

Refresh Token Payload:
{
  sub: "userId",
  tokenId: "uuid-v4",     // Unique token ID (de revoke)
  iat: 1234567890,
  exp: 1237159890          // Expires (30 days)
}
```

### 2.3. Luong theo doi real-time (Real-time Tracking Flow)

```
  SHIPPER APP              SOCKET.IO SERVER              CUSTOMER APP
  ===========              ================              ============

  [Bat GPS tracking]
       |
       +--connect(token)------>  [Xac thuc JWT]
       |                         [Join room: shipper:{id}]
       |                         [Join room: order:{orderId}]
       |
       |  (Moi 5 giay)
       |
       +--emit: gps:update---->  [Nhan toa do GPS]
            {                         |
              lat: 10.762,            v
              lng: 106.660,     [Luu vi tri moi nhat]
              orderId,          [vao Redis/Memory]
              timestamp              |
            }                        +--broadcast to room------> [Nhan vi tri]
                                     |  order:{orderId}          [Cap nhat ban do]
                                     |
                                     +--broadcast to room-------> [Admin Dashboard]
                                        admin                     [Xem tat ca shipper
                                                                   tren ban do]


  === ADMIN MAP VIEW ===

                              SOCKET.IO SERVER              ADMIN DASHBOARD
                              ================              ===============

                              [Tat ca shipper               [Ket noi socket]
                               gui GPS]                          |
                                   |                             v
                                   +--emit to room: admin--->  [Hien thi ban do]
                                      {                        [Tat ca shipper]
                                        shipperId,             [Vi tri real-time]
                                        lat, lng,
                                        orderId,
                                        status
                                      }


  === THONG BAO DON HANG ===

  [Admin cap nhat          [Server xu ly]              [Customer nhan]
   trang thai don]              |                       thong bao
       |                       v                            ^
       +--HTTP: PATCH--->  [Update DB]                      |
          /orders/:id      [Emit socket event]              |
          {status}              |                           |
                                +--to room: order:{id}------+
                                +--to room: customer:{userId}--+
                                |
                                +--to room: admin (log)
```

---

## 3. Quy uoc API

### 3.1. Base URL

```
Production:  https://api.furniture-vn.com/api/v1/
Development: http://localhost:3001/api/v1/
```

Tat ca endpoint deu bat dau voi prefix `/api/v1/`.

### 3.2. Response Format - Thanh cong

```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tac thanh cong"
}
```

**Vi du: Lay chi tiet san pham**

```
GET /api/v1/products/64a1b2c3d4e5f6a7b8c9d0e1

Response 200:
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Ghe sofa phong khach",
    "price": 5500000,
    "category": "sofa",
    "images": ["https://drive.google.com/..."],
    "inStock": true,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  },
  "message": "Lay san pham thanh cong"
}
```

### 3.3. Response Format - Phan trang (Pagination)

```
GET /api/v1/products?page=2&limit=20&sort=-createdAt&category=sofa

Response 200:
{
  "success": true,
  "data": [
    { "_id": "...", "name": "...", "price": 5500000 },
    { "_id": "...", "name": "...", "price": 3200000 },
    ...
  ],
  "meta": {
    "total": 156,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Query Parameters chung cho phan trang:**

| Parameter | Kieu    | Mac dinh | Mo ta                                    |
| --------- | ------- | -------- | ---------------------------------------- |
| `page`    | number  | 1        | Trang hien tai (bat dau tu 1)            |
| `limit`   | number  | 20       | So luong ban ghi moi trang (max: 100)    |
| `sort`    | string  | `-createdAt` | Sap xep (prefix `-` = giam dan)     |
| `search`  | string  | -        | Tim kiem theo keyword                    |

### 3.4. Response Format - Loi (Error)

```json
{
  "statusCode": 400,
  "message": "Email da ton tai",
  "error": "BAD_REQUEST"
}
```

**Validation Error (422):**

```json
{
  "statusCode": 422,
  "message": [
    "name khong duoc de trong",
    "price phai la so duong",
    "email khong hop le"
  ],
  "error": "UNPROCESSABLE_ENTITY"
}
```

### 3.5. HTTP Methods & RESTful Convention

| Method   | Endpoint                  | Mo ta                    |
| -------- | ------------------------- | ------------------------ |
| `GET`    | `/resources`              | Lay danh sach            |
| `GET`    | `/resources/:id`          | Lay chi tiet             |
| `POST`   | `/resources`              | Tao moi                  |
| `PATCH`  | `/resources/:id`          | Cap nhat mot phan        |
| `DELETE` | `/resources/:id`          | Xoa (soft delete)        |

### 3.6. HTTP Status Codes

| Code | Y nghia                                |
| ---- | -------------------------------------- |
| 200  | Thanh cong                             |
| 201  | Tao moi thanh cong                     |
| 204  | Xoa thanh cong (no content)            |
| 400  | Request khong hop le                   |
| 401  | Chua xac thuc (Unauthorized)           |
| 403  | Khong co quyen (Forbidden)             |
| 404  | Khong tim thay (Not Found)             |
| 409  | Xung dot du lieu (Conflict)            |
| 422  | Du lieu khong hop le (Validation)      |
| 429  | Qua nhieu request (Rate Limited)       |
| 500  | Loi server                             |

---

## 4. Xu ly loi (Error Handling)

### 4.1. Global HttpException Filter

```
  Request ---> Controller ---> Service ---> [Loi xay ra]
                                                 |
                                                 v
                                      [Throw HttpException]
                                                 |
                                                 v
                                    +---------------------------+
                                    | GlobalExceptionFilter     |
                                    |                           |
                                    | 1. Log loi (logger)       |
                                    | 2. Format response        |
                                    | 3. Tra ve JSON chuan      |
                                    +---------------------------+
                                                 |
                                                 v
                                    {
                                      statusCode: 400,
                                      message: "...",
                                      error: "BAD_REQUEST",
                                      timestamp: "...",
                                      path: "/api/v1/..."
                                    }
```

**Cau truc filter:**

```typescript
// src/common/filters/http-exception.filter.ts

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 1. HttpException -> lay status + message tu exception
    // 2. ValidationError -> 422 + danh sach loi
    // 3. MongoError (duplicate key) -> 409 Conflict
    // 4. Unknown error -> 500 Internal Server Error
    // 5. Log tat ca loi vao logger
  }
}
```

### 4.2. Validation Pipe voi class-validator

```typescript
// main.ts - Global Validation Pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // Loai bo cac field khong co trong DTO
  forbidNonWhitelisted: true, // Tra loi neu gui field la
  transform: true,          // Tu dong chuyen kieu (string -> number, ...)
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors) => {
    // Custom format cho validation errors
    const messages = errors.map(err =>
      Object.values(err.constraints).join(', ')
    );
    return new UnprocessableEntityException(messages);
  },
}));
```

**Vi du DTO voi validation:**

```typescript
// dto/create-product.dto.ts
export class CreateProductDto {
  @IsNotEmpty({ message: 'Ten san pham khong duoc de trong' })
  @IsString()
  @MaxLength(200)
  name: string;

  @IsPositive({ message: 'Gia phai la so duong' })
  @IsNumber()
  price: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsEnum(ProductCategory)
  category: ProductCategory;
}
```

### 4.3. Custom Business Exception

```typescript
// src/common/exceptions/business.exception.ts

export class BusinessException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: number = 400,
  ) {
    super(
      {
        statusCode,
        errorCode,      // Ma loi noi bo (enum)
        message,
        error: 'BUSINESS_ERROR',
      },
      statusCode,
    );
  }
}

// Su dung:
throw new BusinessException(
  ErrorCode.INSUFFICIENT_STOCK,
  'San pham khong du hang trong kho',
  400,
);
```

### 4.4. Error Codes Enum

```typescript
// src/common/enums/error-code.enum.ts

export enum ErrorCode {
  // Auth errors (1xxx)
  AUTH_INVALID_CREDENTIALS   = 1001,
  AUTH_TOKEN_EXPIRED         = 1002,
  AUTH_TOKEN_INVALID         = 1003,
  AUTH_REFRESH_TOKEN_EXPIRED = 1004,
  AUTH_ACCOUNT_DISABLED      = 1005,
  AUTH_EMAIL_EXISTS           = 1006,
  AUTH_PHONE_EXISTS           = 1007,

  // User errors (2xxx)
  USER_NOT_FOUND             = 2001,
  USER_ALREADY_EXISTS        = 2002,

  // Product errors (3xxx)
  PRODUCT_NOT_FOUND          = 3001,
  PRODUCT_OUT_OF_STOCK       = 3002,
  PRODUCT_INSUFFICIENT_STOCK = 3003,

  // Order errors (4xxx)
  ORDER_NOT_FOUND            = 4001,
  ORDER_INVALID_STATUS       = 4002,
  ORDER_CANNOT_CANCEL        = 4003,
  ORDER_ALREADY_ASSIGNED     = 4004,

  // Cart errors (5xxx)
  CART_EMPTY                 = 5001,
  CART_ITEM_NOT_FOUND        = 5002,

  // Payment errors (6xxx)
  PAYMENT_FAILED             = 6001,
  PAYMENT_TIMEOUT            = 6002,

  // File errors (7xxx)
  FILE_UPLOAD_FAILED         = 7001,
  FILE_TOO_LARGE             = 7002,
  FILE_INVALID_TYPE          = 7003,

  // Shipping errors (8xxx)
  SHIPPER_NOT_AVAILABLE      = 8001,
  SHIPPER_ALREADY_ASSIGNED   = 8002,
  DELIVERY_PROOF_REQUIRED    = 8003,
}
```

---

## 5. Gioi han truy cap (Rate Limiting)

### Cau hinh @nestjs/throttler

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,     // 60 giay (1 phut)
        limit: 60,      // 60 requests / phut
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
```

**Gioi han rieng cho Auth endpoints:**

```typescript
// auth.controller.ts

@Controller('auth')
export class AuthController {

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 lan / phut
  async login(@Body() dto: LoginDto) { ... }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 lan / phut
  async register(@Body() dto: RegisterDto) { ... }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })  // 3 lan / phut
  async forgotPassword(@Body() dto: ForgotPasswordDto) { ... }
}
```

**Bang tom tat Rate Limiting:**

| Endpoint group     | Limit          | TTL      |
| ------------------ | -------------- | -------- |
| Mac dinh (tat ca)  | 60 requests    | 1 phut   |
| Auth (login/register) | 5 requests  | 1 phut   |
| Forgot password    | 3 requests     | 1 phut   |
| File upload        | 10 requests    | 1 phut   |

**Response khi bi rate limited (429):**

```json
{
  "statusCode": 429,
  "message": "Ban da gui qua nhieu yeu cau. Vui long thu lai sau.",
  "error": "TOO_MANY_REQUESTS"
}
```

---

## 6. Cau hinh CORS

```typescript
// main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL,               // VD: https://furniture-vn.com
      'http://localhost:3000',                 // Dev frontend
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
    credentials: true,                         // Cho phep gui cookies
    maxAge: 86400,                             // Preflight cache 24h
  });

  await app.listen(process.env.PORT || 3001);
}
```

```
  Browser (localhost:3000)          NestJS (localhost:3001)
  =========================        ========================

  [Preflight OPTIONS] -----------> [Kiem tra CORS config]
                                        |
                                        v
                                   origin co trong whitelist?
                                        |
                                   +----+----+
                                   |         |
                                  YES        NO
                                   |         |
                                   v         v
  <--Access-Control-Allow-*---  [200 OK]  [403 Forbidden]
  |
  v
  [Gui request chinh] ----------> [Xu ly binh thuong]
  <--Response + CORS headers----
```

---

## 7. Kien truc xac thuc (Authentication Architecture)

### 7.1. JWT Strategy

```
  +------------------------------------------------------------------+
  |                      Authentication Flow                          |
  +------------------------------------------------------------------+
  |                                                                    |
  |  Request voi Authorization Header                                  |
  |       |                                                            |
  |       v                                                            |
  |  +------------------+                                              |
  |  | JwtAuthGuard     | ---- Kiem tra Bearer token trong header      |
  |  +--------+---------+                                              |
  |           |                                                        |
  |           v                                                        |
  |  +------------------+                                              |
  |  | JwtStrategy      | ---- Verify token voi secret key             |
  |  | (passport-jwt)   |      Kiem tra expiration                     |
  |  +--------+---------+      Decode payload                          |
  |           |                                                        |
  |           v                                                        |
  |  +------------------+                                              |
  |  | Validate method  | ---- Tim user trong DB theo payload.sub      |
  |  |                  |      Kiem tra user con active khong           |
  |  +--------+---------+      Gan user vao request.user               |
  |           |                                                        |
  |           v                                                        |
  |  +------------------+                                              |
  |  | RolesGuard       | ---- Kiem tra role co du quyen khong         |
  |  | (neu co @Roles)  |      So sanh voi @Roles() decorator         |
  |  +--------+---------+                                              |
  |           |                                                        |
  |           v                                                        |
  |     [Controller]                                                   |
  +------------------------------------------------------------------+
```

### 7.2. Role-based Guards

```typescript
// Cac role trong he thong
export enum UserRole {
  ADMIN    = 'admin',     // Quan tri vien - full quyen
  MANAGER  = 'manager',   // Quan ly - quan ly don hang, san pham, nhan vien
  STAFF    = 'staff',     // Nhan vien - xu ly don hang, ho tro khach
  CUSTOMER = 'customer',  // Khach hang - mua hang, dat don
  SHIPPER  = 'shipper',   // Nguoi giao hang - nhan + giao don
}
```

**Ma tran phan quyen:**

```
                    ADMIN  MANAGER  STAFF  CUSTOMER  SHIPPER
                    =====  =======  =====  ========  =======
Quan ly users        X
Quan ly san pham     X       X
Quan ly danh muc     X       X
Xem tat ca don       X       X        X
Xu ly don hang       X       X        X
Quan ly shipper      X       X
Dat hang                                      X
Xem don cua minh                              X
Danh gia san pham                             X
Nhan don giao        X       X                          X
Cap nhat vi tri                                         X
Xac nhan giao hang                                      X
Thong ke doanh thu   X       X
POS ban hang         X       X        X
```

**Su dung decorators:**

```typescript
// Bat buoc dang nhap + chi admin va manager
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Get('admin/orders')
async getAllOrders() { ... }

// Bat buoc dang nhap + tat ca role
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: User) { ... }
```

### 7.3. Optional JWT Guard (Public Endpoints)

```typescript
// guards/optional-jwt.guard.ts
// Cho phep truy cap khong can dang nhap,
// nhung neu co token thi van decode user.

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Khong throw loi neu khong co token
    // Tra ve user neu co, null neu khong
    return user || null;
  }
}
```

**Truong hop su dung:**

```typescript
// Xem san pham - ai cung xem duoc
// Nhung neu da dang nhap -> hien thi da thich / da mua
@UseGuards(OptionalJwtGuard)
@Get('products/:id')
async getProduct(
  @Param('id') id: string,
  @CurrentUser() user: User | null,  // co the null
) {
  const product = await this.productsService.findById(id);
  if (user) {
    product.isFavorited = await this.checkFavorite(user._id, id);
  }
  return product;
}
```

---

## 8. Kien truc Socket.IO

### 8.1. Tong quan ket noi

```
  +------------------------------------------------------------------+
  |                    Socket.IO Architecture                         |
  +------------------------------------------------------------------+
  |                                                                    |
  |  Client connect voi JWT token                                      |
  |       |                                                            |
  |       +--io('ws://server', {                                       |
  |       |    auth: { token: 'Bearer xxx' }                           |
  |       |  })                                                        |
  |       |                                                            |
  |       v                                                            |
  |  +------------------+                                              |
  |  | WsJwtGuard       | ---- Verify JWT tu handshake auth            |
  |  +--------+---------+                                              |
  |           |                                                        |
  |       +---+---+                                                    |
  |       |       |                                                    |
  |    VALID   INVALID                                                 |
  |       |       |                                                    |
  |       v       v                                                    |
  |  [Connect]  [Disconnect + error event]                             |
  |       |                                                            |
  |       v                                                            |
  |  +---------------------+                                           |
  |  | Auto-join rooms     |                                           |
  |  | dua tren role:      |                                           |
  |  |                     |                                           |
  |  | admin   -> 'admin'  |                                           |
  |  | shipper -> 'shippers', 'shipper:{id}'                           |
  |  | customer-> 'customer:{id}'                                      |
  |  +---------------------+                                           |
  +------------------------------------------------------------------+
```

### 8.2. He thong Rooms

```
  +------------------------------------------------------------------+
  |                        SOCKET.IO ROOMS                            |
  +------------------------------------------------------------------+
  |                                                                    |
  |  Room: "admin"                                                     |
  |  +---------------------------+                                     |
  |  | Tat ca admin/manager/staff|  Nhan: tat ca thong bao don hang,   |
  |  | dang online               |  vi tri shipper, thong ke           |
  |  +---------------------------+                                     |
  |                                                                    |
  |  Room: "shippers"                                                  |
  |  +---------------------------+                                     |
  |  | Tat ca shipper dang online|  Nhan: don hang moi can giao,       |
  |  |                           |  thong bao tu admin                 |
  |  +---------------------------+                                     |
  |                                                                    |
  |  Room: "order:{orderId}"                                           |
  |  +---------------------------+                                     |
  |  | Customer + Shipper +      |  Nhan: cap nhat trang thai don,     |
  |  | Admin cua don hang do     |  vi tri giao hang                   |
  |  +---------------------------+                                     |
  |                                                                    |
  |  Room: "customer:{userId}"                                         |
  |  +---------------------------+                                     |
  |  | 1 customer cu the         |  Nhan: thong bao ca nhan,           |
  |  |                           |  cap nhat don hang cua minh         |
  |  +---------------------------+                                     |
  |                                                                    |
  |  Room: "shipper:{shipperId}"                                       |
  |  +---------------------------+                                     |
  |  | 1 shipper cu the          |  Nhan: don hang duoc chi dinh,      |
  |  |                           |  thong bao tu admin                 |
  |  +---------------------------+                                     |
  +------------------------------------------------------------------+
```

### 8.3. Quy uoc dat ten Event

**Format:** `{domain}:{action}`

| Event Name              | Huong           | Mo ta                                |
| ----------------------- | --------------- | ------------------------------------ |
| `order:created`         | Server -> Client| Don hang moi duoc tao                |
| `order:status_updated`  | Server -> Client| Trang thai don thay doi              |
| `order:assigned`        | Server -> Client| Don duoc chi dinh shipper            |
| `order:picked_up`       | Server -> Client| Shipper da lay hang                  |
| `order:delivered`       | Server -> Client| Don da giao thanh cong               |
| `order:cancelled`       | Server -> Client| Don bi huy                           |
| `gps:update`            | Client -> Server| Shipper gui vi tri GPS               |
| `gps:location`          | Server -> Client| Vi tri shipper (broadcast)           |
| `notification:new`      | Server -> Client| Thong bao moi                        |
| `chat:message`          | Bi-directional  | Tin nhan ho tro                      |
| `connection:error`      | Server -> Client| Loi ket noi                          |

### 8.4. Event Payload Convention

```typescript
// Tat ca event deu co chung interface:

interface SocketEvent<T = any> {
  event: string;        // Ten event
  data: T;              // Du lieu chinh
  timestamp: string;    // ISO 8601
  senderId?: string;    // ID nguoi gui (neu co)
}

// Vi du: order:status_updated
{
  event: 'order:status_updated',
  data: {
    orderId: '64a1b2c3...',
    oldStatus: 'PREPARING',
    newStatus: 'ASSIGNED',
    shipperId: '64b2c3d4...',
    shipperName: 'Nguyen Van A',
    shipperPhone: '0901234567',
  },
  timestamp: '2024-01-15T14:30:00.000Z',
  senderId: 'admin-user-id',
}
```

---

## 9. Nguyen tac thiet ke Database

### 9.1. Soft Delete Pattern

```
Tat ca document deu co field `isDeleted` va `deletedAt`.
Khi "xoa", chi danh dau isDeleted = true, KHONG xoa that.

  +-------------------+
  |  Product Schema   |
  +-------------------+
  | name: String      |
  | price: Number     |
  | ...               |
  | isDeleted: Boolean|  <-- Mac dinh: false
  | deletedAt: Date   |  <-- null khi chua xoa
  +-------------------+

  // Middleware tu dong loc:
  schema.pre(/^find/, function() {
    this.where({ isDeleted: { $ne: true } });
  });

  // Khi can xoa:
  await product.updateOne({
    isDeleted: true,
    deletedAt: new Date(),
  });
```

**Ly do su dung Soft Delete:**
- Khoi phuc du lieu khi xoa nham
- Bao toan tinh toan ven tham chieu (don hang cu van tham chieu san pham da xoa)
- Audit trail - theo doi lich su thay doi

### 9.2. Timestamps tren tat ca Schemas

```typescript
// Tat ca schema deu bat timestamps
@Schema({
  timestamps: true,        // Tu dong tao createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Product {
  // ... fields

  // Mongoose tu dong quan ly:
  // createdAt: Date  - thoi diem tao
  // updatedAt: Date  - thoi diem cap nhat cuoi
}
```

### 9.3. Index Strategy

```
  +------------------------------------------------------------------+
  |                     INDEXING STRATEGY                              |
  +------------------------------------------------------------------+

  === Single Field Indexes ===

  users:
    - email         (unique)    -> Dang nhap, tim kiem
    - phone         (unique)    -> Dang nhap bang SDT
    - role          (normal)    -> Loc theo vai tro

  products:
    - slug          (unique)    -> URL than thien SEO
    - category      (normal)    -> Loc theo danh muc
    - price         (normal)    -> Sap xep theo gia
    - isDeleted     (normal)    -> Loc soft delete

  orders:
    - orderCode     (unique)    -> Tim don theo ma
    - status        (normal)    -> Loc theo trang thai
    - customerId    (normal)    -> Don hang cua khach
    - shipperId     (normal)    -> Don hang cua shipper

  === Compound Indexes ===

  products:
    - { category: 1, price: 1 }           -> Loc danh muc + sap xep gia
    - { isDeleted: 1, category: 1 }       -> Query thuong dung
    - { name: 'text', description: 'text' } -> Full-text search

  orders:
    - { customerId: 1, createdAt: -1 }    -> Lich su don cua khach
    - { shipperId: 1, status: 1 }         -> Don dang giao cua shipper
    - { status: 1, createdAt: -1 }        -> Admin loc don theo trang thai

  reviews:
    - { productId: 1, createdAt: -1 }     -> Danh gia san pham
    - { userId: 1, productId: 1 }(unique) -> Moi user chi review 1 lan / SP
```

### 9.4. Embedded vs Referenced Documents

```
  +------------------------------------------------------------------+
  |              KHI NAO EMBEDDED vs REFERENCED?                      |
  +------------------------------------------------------------------+

  === EMBEDDED (Nhung truc tiep) ===

  Su dung khi:
  - Du lieu thuoc ve document cha (1:few)
  - Thuong doc cung nhau
  - Khong can query rieng

  Vi du:
  +------------------------+
  | Order                  |
  | +--------------------+ |
  | | shippingAddress:   | |    <-- Embedded: dia chi gan voi don hang
  | |   street           | |        khong thay doi sau khi dat
  | |   ward             | |
  | |   district         | |
  | |   city             | |
  | +--------------------+ |
  | +--------------------+ |
  | | items: [           | |    <-- Embedded: snapshot san pham tai thoi
  | |   {                | |        diem dat hang (gia, ten, hinh)
  | |     productId      | |
  | |     name           | |
  | |     price          | |
  | |     quantity        | |
  | |     image          | |
  | |   }                | |
  | | ]                  | |
  | +--------------------+ |
  +------------------------+


  === REFERENCED (Tham chieu) ===

  Su dung khi:
  - Quan he 1:many hoac many:many
  - Du lieu thay doi doc lap
  - Can query rieng le

  Vi du:
  +-------------+         +-------------+         +-------------+
  | User        |         | Order       |         | Product     |
  | _id --------+----<----+ customerId  |    +--->+ _id         |
  |             |         | items[].    |    |    | name        |
  |             |         |  productId -+----+    | price       |
  +-------------+         +-------------+         +-------------+
        |
        +----<----+-------------+
                  | Review      |
                  | userId      |
                  | productId --+---->  Product
                  +-------------+


  === TOM TAT ===

  +------------------+---------------------------+--------------------------+
  | Pattern          | Embedded                  | Referenced               |
  +------------------+---------------------------+--------------------------+
  | Dia chi giao hang| Order.shippingAddress     |                          |
  | Items trong don  | Order.items[]             |                          |
  | Hinh anh SP      | Product.images[]          |                          |
  | Bien the SP      | Product.variants[]        |                          |
  | User - Orders    |                           | Order.customerId -> User |
  | Product - Reviews|                           | Review.productId -> Prod |
  | User - Cart      |                           | Cart.userId -> User      |
  | Category - Prods |                           | Product.categoryId -> Cat|
  +------------------+---------------------------+--------------------------+
```

---

## 10. Quy uoc cau truc thu muc

### 10.1. Backend (NestJS)

```
backend/
|-- src/
|   |-- main.ts                          # Entry point, bootstrap app
|   |-- app.module.ts                    # Root module
|   |
|   |-- common/                          # Code dung chung
|   |   |-- decorators/
|   |   |   |-- current-user.decorator.ts    # @CurrentUser()
|   |   |   |-- roles.decorator.ts           # @Roles(...)
|   |   |   +-- public.decorator.ts          # @Public()
|   |   |-- dto/
|   |   |   |-- pagination-query.dto.ts      # Query params chung
|   |   |   +-- paginated-response.dto.ts    # Response phan trang
|   |   |-- enums/
|   |   |   |-- error-code.enum.ts
|   |   |   |-- order-status.enum.ts
|   |   |   +-- user-role.enum.ts
|   |   |-- exceptions/
|   |   |   +-- business.exception.ts
|   |   |-- filters/
|   |   |   +-- http-exception.filter.ts     # Global exception filter
|   |   |-- guards/
|   |   |   |-- jwt-auth.guard.ts
|   |   |   |-- optional-jwt.guard.ts
|   |   |   |-- roles.guard.ts
|   |   |   +-- ws-jwt.guard.ts              # Socket.IO auth guard
|   |   |-- interceptors/
|   |   |   |-- response.interceptor.ts      # Wrap response format
|   |   |   +-- logging.interceptor.ts
|   |   |-- pipes/
|   |   |   +-- parse-objectid.pipe.ts       # Validate MongoDB ObjectId
|   |   +-- utils/
|   |       |-- hash.util.ts                 # Bcrypt helpers
|   |       +-- slug.util.ts                 # Tao slug tu ten
|   |
|   |-- config/                          # Cau hinh
|   |   |-- database.config.ts
|   |   |-- jwt.config.ts
|   |   +-- google-drive.config.ts
|   |
|   +-- modules/                         # Feature modules
|       |
|       |-- auth/
|       |   |-- auth.module.ts
|       |   |-- auth.controller.ts
|       |   |-- auth.service.ts
|       |   |-- dto/
|       |   |   |-- login.dto.ts
|       |   |   |-- register.dto.ts
|       |   |   +-- refresh-token.dto.ts
|       |   |-- strategies/
|       |   |   |-- jwt.strategy.ts
|       |   |   +-- jwt-refresh.strategy.ts
|       |   +-- schemas/
|       |       +-- refresh-token.schema.ts
|       |
|       |-- users/
|       |   |-- users.module.ts
|       |   |-- users.controller.ts
|       |   |-- users.service.ts
|       |   |-- dto/
|       |   |   |-- create-user.dto.ts
|       |   |   +-- update-user.dto.ts
|       |   +-- schemas/
|       |       +-- user.schema.ts
|       |
|       |-- products/
|       |   |-- products.module.ts
|       |   |-- products.controller.ts
|       |   |-- products.service.ts
|       |   |-- dto/
|       |   |   |-- create-product.dto.ts
|       |   |   |-- update-product.dto.ts
|       |   |   +-- query-product.dto.ts
|       |   +-- schemas/
|       |       +-- product.schema.ts
|       |
|       |-- categories/
|       |   |-- categories.module.ts
|       |   |-- categories.controller.ts
|       |   |-- categories.service.ts
|       |   |-- dto/
|       |   +-- schemas/
|       |       +-- category.schema.ts
|       |
|       |-- orders/
|       |   |-- orders.module.ts
|       |   |-- orders.controller.ts
|       |   |-- orders.service.ts
|       |   |-- dto/
|       |   |   |-- create-order.dto.ts
|       |   |   |-- update-order-status.dto.ts
|       |   |   +-- assign-shipper.dto.ts
|       |   +-- schemas/
|       |       +-- order.schema.ts
|       |
|       |-- cart/
|       |   |-- cart.module.ts
|       |   |-- cart.controller.ts
|       |   |-- cart.service.ts
|       |   |-- dto/
|       |   +-- schemas/
|       |       +-- cart.schema.ts
|       |
|       |-- reviews/
|       |   |-- reviews.module.ts
|       |   |-- reviews.controller.ts
|       |   |-- reviews.service.ts
|       |   |-- dto/
|       |   +-- schemas/
|       |       +-- review.schema.ts
|       |
|       |-- shipping/
|       |   |-- shipping.module.ts
|       |   |-- shipping.controller.ts
|       |   |-- shipping.service.ts
|       |   |-- shipping.gateway.ts          # Socket.IO gateway
|       |   |-- dto/
|       |   +-- schemas/
|       |       +-- delivery-proof.schema.ts
|       |
|       |-- upload/
|       |   |-- upload.module.ts
|       |   |-- upload.controller.ts
|       |   |-- upload.service.ts            # Google Drive upload
|       |   +-- dto/
|       |
|       |-- notifications/
|       |   |-- notifications.module.ts
|       |   |-- notifications.gateway.ts     # Socket.IO gateway
|       |   |-- notifications.service.ts
|       |   +-- schemas/
|       |       +-- notification.schema.ts
|       |
|       +-- statistics/
|           |-- statistics.module.ts
|           |-- statistics.controller.ts
|           +-- statistics.service.ts
|
|-- test/                                # E2E tests
|-- .env                                 # Bien moi truong
|-- .env.example
|-- nest-cli.json
|-- package.json
+-- tsconfig.json
```

### 10.2. Frontend (Next.js 14+ App Router)

```
frontend/
|-- app/
|   |-- layout.tsx                       # Root layout
|   |-- page.tsx                         # Trang chu (redirect)
|   |-- globals.css
|   |
|   |-- (customer)/                      # Route group - Giao dien khach hang
|   |   |-- layout.tsx                   # Customer layout (header, footer)
|   |   |-- page.tsx                     # Trang chu
|   |   |-- san-pham/                    # /san-pham
|   |   |   |-- page.tsx                 # Danh sach san pham
|   |   |   +-- [slug]/
|   |   |       +-- page.tsx             # Chi tiet san pham
|   |   |-- gio-hang/
|   |   |   +-- page.tsx                 # Trang gio hang
|   |   |-- thanh-toan/
|   |   |   +-- page.tsx                 # Trang thanh toan
|   |   |-- don-hang/
|   |   |   |-- page.tsx                 # Danh sach don hang
|   |   |   +-- [id]/
|   |   |       +-- page.tsx             # Chi tiet + theo doi don hang
|   |   |-- tai-khoan/
|   |   |   +-- page.tsx                 # Thong tin ca nhan
|   |   +-- theo-doi/
|   |       +-- [id]/
|   |           +-- page.tsx             # Trang theo doi GPS real-time
|   |
|   |-- admin/                           # /admin - Dashboard quan tri
|   |   |-- layout.tsx                   # Admin layout (sidebar, topbar)
|   |   |-- page.tsx                     # Dashboard tong quan
|   |   |-- don-hang/
|   |   |   |-- page.tsx                 # Quan ly don hang
|   |   |   +-- [id]/
|   |   |       +-- page.tsx             # Chi tiet don hang
|   |   |-- san-pham/
|   |   |   |-- page.tsx                 # Quan ly san pham
|   |   |   |-- tao-moi/
|   |   |   |   +-- page.tsx
|   |   |   +-- [id]/
|   |   |       +-- page.tsx             # Chinh sua san pham
|   |   |-- danh-muc/
|   |   |   +-- page.tsx                 # Quan ly danh muc
|   |   |-- nguoi-dung/
|   |   |   +-- page.tsx                 # Quan ly user
|   |   |-- shipper/
|   |   |   |-- page.tsx                 # Quan ly shipper
|   |   |   +-- ban-do/
|   |   |       +-- page.tsx             # Ban do theo doi shipper
|   |   +-- thong-ke/
|   |       +-- page.tsx                 # Bao cao doanh thu
|   |
|   |-- pos/                             # /pos - Diem ban hang
|   |   |-- layout.tsx                   # POS layout (toi gian)
|   |   +-- page.tsx                     # Giao dien ban hang
|   |
|   |-- shipper/                         # /shipper - App giao hang
|   |   |-- layout.tsx                   # Shipper layout
|   |   |-- page.tsx                     # Danh sach don can giao
|   |   +-- [id]/
|   |       +-- page.tsx                 # Chi tiet don + dieu huong
|   |
|   +-- (auth)/                          # Route group - Xac thuc
|       |-- dang-nhap/
|       |   +-- page.tsx
|       +-- dang-ky/
|           +-- page.tsx
|
|-- components/                          # Shared components
|   |-- ui/                              # UI primitives (Button, Input, Modal, ...)
|   |-- layout/
|   |   |-- Header.tsx
|   |   |-- Footer.tsx
|   |   |-- AdminSidebar.tsx
|   |   +-- ShipperBottomNav.tsx
|   |-- product/
|   |   |-- ProductCard.tsx
|   |   |-- ProductGrid.tsx
|   |   +-- ProductDetail.tsx
|   |-- cart/
|   |   |-- CartItem.tsx
|   |   +-- CartSummary.tsx
|   |-- order/
|   |   |-- OrderCard.tsx
|   |   |-- OrderTimeline.tsx
|   |   +-- OrderTrackingMap.tsx
|   +-- common/
|       |-- LoadingSpinner.tsx
|       |-- ErrorBoundary.tsx
|       +-- Pagination.tsx
|
|-- lib/                                 # Utilities & configs
|   |-- api.ts                           # Axios instance + interceptors
|   |-- socket.ts                        # Socket.IO client setup
|   |-- auth.ts                          # Auth helpers (getToken, refresh)
|   |-- utils.ts                         # Format tien, ngay, ...
|   +-- constants.ts                     # API URLs, config values
|
|-- stores/                              # Zustand stores
|   |-- useAuthStore.ts                  # Trang thai xac thuc
|   |-- useCartStore.ts                  # Gio hang
|   |-- useOrderStore.ts                 # Don hang
|   +-- useNotificationStore.ts          # Thong bao real-time
|
|-- hooks/                               # Custom React hooks
|   |-- useAuth.ts                       # Logic xac thuc
|   |-- useSocket.ts                     # Socket.IO connection
|   |-- useGPS.ts                        # GPS tracking (shipper)
|   |-- useDebounce.ts                   # Debounce input
|   +-- useInfiniteScroll.ts             # Lazy loading
|
|-- types/                               # TypeScript type definitions
|   |-- user.ts
|   |-- product.ts
|   |-- order.ts
|   +-- api.ts                           # Response types
|
|-- public/                              # Static assets
|   |-- images/
|   +-- icons/
|
|-- middleware.ts                         # Next.js middleware (auth redirect)
|-- next.config.js
|-- tailwind.config.ts
|-- package.json
+-- tsconfig.json
```

### 10.3. Quy tac dat ten

| Loai              | Convention         | Vi du                              |
| ----------------- | ------------------ | ---------------------------------- |
| Module (BE)       | kebab-case         | `orders.module.ts`                 |
| Controller (BE)   | kebab-case         | `orders.controller.ts`             |
| Service (BE)      | kebab-case         | `orders.service.ts`                |
| Schema (BE)       | kebab-case         | `order.schema.ts`                  |
| DTO (BE)          | kebab-case         | `create-order.dto.ts`              |
| Component (FE)    | PascalCase         | `ProductCard.tsx`                  |
| Hook (FE)         | camelCase          | `useAuth.ts`                       |
| Store (FE)        | camelCase          | `useCartStore.ts`                  |
| Route (FE)        | Vietnamese slug    | `san-pham/`, `don-hang/`           |
| Utility (FE)      | camelCase          | `formatCurrency.ts`                |

---

## Tham khao nhanh: Tat ca API Endpoints

```
AUTH
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password

USERS
  GET    /api/v1/users                    (admin)
  GET    /api/v1/users/:id                (admin)
  PATCH  /api/v1/users/:id                (admin)
  DELETE /api/v1/users/:id                (admin)
  GET    /api/v1/users/profile            (authenticated)
  PATCH  /api/v1/users/profile            (authenticated)

PRODUCTS
  GET    /api/v1/products                 (public)
  GET    /api/v1/products/:id             (public)
  POST   /api/v1/products                 (admin, manager)
  PATCH  /api/v1/products/:id             (admin, manager)
  DELETE /api/v1/products/:id             (admin, manager)

CATEGORIES
  GET    /api/v1/categories               (public)
  POST   /api/v1/categories               (admin, manager)
  PATCH  /api/v1/categories/:id           (admin, manager)
  DELETE /api/v1/categories/:id           (admin, manager)

CART
  GET    /api/v1/cart                     (authenticated)
  POST   /api/v1/cart/items               (authenticated)
  PATCH  /api/v1/cart/items/:itemId       (authenticated)
  DELETE /api/v1/cart/items/:itemId       (authenticated)
  DELETE /api/v1/cart                     (authenticated)

ORDERS
  POST   /api/v1/orders/checkout          (customer)
  GET    /api/v1/orders                   (authenticated - filtered by role)
  GET    /api/v1/orders/:id               (authenticated)
  PATCH  /api/v1/orders/:id/status        (admin, manager, staff)
  PATCH  /api/v1/orders/:id/assign        (admin, manager)
  PATCH  /api/v1/orders/:id/pickup        (shipper)
  PATCH  /api/v1/orders/:id/deliver       (shipper)
  PATCH  /api/v1/orders/:id/cancel        (customer, admin)

REVIEWS
  GET    /api/v1/reviews/product/:productId  (public)
  POST   /api/v1/reviews                     (customer)
  PATCH  /api/v1/reviews/:id                 (customer - owner)
  DELETE /api/v1/reviews/:id                 (customer - owner, admin)

SHIPPING
  GET    /api/v1/shipping/my-deliveries      (shipper)
  PATCH  /api/v1/shipping/:orderId/location  (shipper)
  POST   /api/v1/shipping/:orderId/proof     (shipper)

UPLOAD
  POST   /api/v1/upload/image               (authenticated)
  POST   /api/v1/upload/images              (authenticated)
  DELETE /api/v1/upload/:fileId             (authenticated)

STATISTICS
  GET    /api/v1/statistics/dashboard        (admin, manager)
  GET    /api/v1/statistics/revenue          (admin, manager)
  GET    /api/v1/statistics/orders           (admin, manager)
  GET    /api/v1/statistics/products         (admin, manager)
```

---

> Tai lieu nay la nguon tham khao chinh cho viec phat trien he thong.
> Cap nhat lan cuoi: 2026-04-02
