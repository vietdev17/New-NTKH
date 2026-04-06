import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tăng body size limit cho upload ảnh base64
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Furniture VN API')
    .setDescription('He thong ban noi that Viet Nam')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Xac thuc nguoi dung')
    .addTag('products', 'San pham')
    .addTag('categories', 'Danh muc')
    .addTag('orders', 'Don hang')
    .addTag('customers', 'Khach hang')
    .addTag('reviews', 'Danh gia')
    .addTag('wishlist', 'Yeu thich')
    .addTag('coupons', 'Coupon')
    .addTag('shipper', 'Shipper')
    .addTag('upload', 'Upload file')
    .addTag('notifications', 'Thong bao')
    .addTag('reports', 'Bao cao')
    .addTag('users', 'Nguoi dung')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`\nServer running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs:  http://localhost:${port}/api/docs\n`);
}

bootstrap();
