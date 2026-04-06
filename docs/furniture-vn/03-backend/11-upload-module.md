# UPLOAD MODULE - Google Drive

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Module upload file len Google Drive va luu metadata vao MongoDB
> Su dung Google Drive API v3 voi Service Account
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Tong quan](#1-tong-quan)
2. [Cau truc module](#2-cau-truc-module)
3. [Multer Configuration](#3-multer-configuration)
4. [Google Drive Service](#4-google-drive-service)
5. [DTOs](#5-dtos)
6. [UploadService](#6-uploadservice)
7. [UploadController](#7-uploadcontroller)
8. [Bang API Endpoints](#8-bang-api-endpoints)
9. [Vi du Request/Response](#9-vi-du-requestresponse)

---

## 1. Tong quan

Module Upload xu ly toan bo viec upload/xoa file:

- **Google Drive lam storage:** Dung Google Drive API v3 voi Service Account. File duoc upload vao cac folder rieng theo category (product, avatar, review, ...).
- **Metadata luu MongoDB:** Luu thong tin file (fileName, mimeType, size, googleDriveFileId, uploadedBy, category) vao collection `uploadedfiles`.
- **Multer middleware:** Filter chi cho phep file anh (jpg, png, webp, gif), gioi han 5MB.
- **URL format:** `https://drive.google.com/uc?id={fileId}&export=view` - URL nay co the nhung truc tiep vao `<img>` tag.
- **Ownership check:** Chi nguoi upload moi co the xoa file (tru admin).

**Schemas su dung:**
- UploadedFile (xem `02-database/01-schemas.md` muc 14)

**Enums:**
- UploadCategory: `product`, `avatar`, `review`, `return`, `delivery_proof`, `other`

---

## 2. Cau truc module

```
src/modules/upload/
  ├── upload.module.ts
  ├── upload.service.ts
  ├── upload.controller.ts
  ├── google-drive.service.ts
  ├── multer.config.ts
  └── dto/
      └── query-upload.dto.ts
```

### upload.module.ts

```typescript
// ============================================================
// modules/upload/upload.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import {
  UploadedFile,
  UploadedFileSchema,
} from '../../schemas/uploaded-file.schema';
import { GoogleDriveService } from './google-drive.service';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { multerConfig } from './multer.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UploadedFile.name, schema: UploadedFileSchema },
    ]),
    MulterModule.register(multerConfig),
  ],
  controllers: [UploadController],
  providers: [GoogleDriveService, UploadService],
  exports: [UploadService, GoogleDriveService],
})
export class UploadModule {}
```

---

## 3. Multer Configuration

```typescript
// ============================================================
// modules/upload/multer.config.ts
// ============================================================
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

// ===== DINH DANG FILE DUOC PHEP =====
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif)$/i;

// ===== GIOI HAN KICH THUOC =====
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ===== FILE FILTER =====
const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  // Kiem tra MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Dinh dang file khong hop le. Chi chap nhan: ${ALLOWED_MIME_TYPES.join(', ')}`,
      ),
      false,
    );
  }

  // Kiem tra extension
  if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
    return callback(
      new BadRequestException(
        'Extension file khong hop le. Chi chap nhan: jpg, jpeg, png, webp, gif',
      ),
      false,
    );
  }

  callback(null, true);
};

// ===== MULTER CONFIG =====
export const multerConfig: MulterOptions = {
  // Dung memory storage (buffer) de gui thang len Google Drive
  // Khong luu tam len disk
  storage: memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Toi da 10 file moi request
  },
};
```

---

## 4. Google Drive Service

### Google Drive Service Account Setup

Truoc khi code, can cau hinh Google Drive API:

1. Tao project tren Google Cloud Console
2. Bat Google Drive API
3. Tao Service Account va download JSON key
4. Tao folder tren Google Drive, chia se voi Service Account email
5. Luu thong tin vao `.env`:

```env
# .env
GOOGLE_DRIVE_CLIENT_EMAIL=upload-service@my-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1ABC_xyzFolderIdFromGoogleDrive
```

### google-drive.service.ts

```typescript
// ============================================================
// modules/upload/google-drive.service.ts
// ============================================================
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface DriveUploadResult {
  fileId: string;
  webViewUrl: string;
  webContentUrl: string;
  directUrl: string;
}

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly rootFolderId: string;

  // Mapping category -> subfolder name tren Google Drive
  private readonly CATEGORY_FOLDERS: Record<string, string> = {
    product: 'products',
    avatar: 'avatars',
    review: 'reviews',
    return: 'returns',
    delivery_proof: 'delivery-proofs',
    banner: 'banners',
    other: 'others',
  };

  // Cache subfolder IDs de khong phai query lai
  private folderIdCache: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    // Khoi tao Google Drive client voi Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.configService.get<string>(
          'GOOGLE_DRIVE_CLIENT_EMAIL',
        ),
        private_key: this.configService
          .get<string>('GOOGLE_DRIVE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'), // Fix escaped newlines trong .env
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.rootFolderId = this.configService.get<string>(
      'GOOGLE_DRIVE_FOLDER_ID',
    );

    this.logger.log('Google Drive service initialized');
  }

  // ===== UPLOAD FILE LEN GOOGLE DRIVE =====
  async uploadFile(
    file: Express.Multer.File,
    category: string,
  ): Promise<DriveUploadResult> {
    try {
      // Lay hoac tao subfolder theo category
      const folderId = await this.getOrCreateFolder(category);

      // Tao ten file duy nhat
      const timestamp = Date.now();
      const safeName = file.originalname.replace(
        /[^a-zA-Z0-9.\-_]/g,
        '_',
      );
      const fileName = `${timestamp}-${safeName}`;

      // Chuyen buffer thanh readable stream
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      // Upload len Google Drive
      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: file.mimetype,
        },
        media: {
          mimeType: file.mimetype,
          body: stream,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = response.data.id;

      // Set permission: anyone can view (de nhung anh vao web)
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Tao URL truc tiep
      const directUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;

      this.logger.log(
        `Uploaded file: ${fileName} -> Drive ID: ${fileId}`,
      );

      return {
        fileId,
        webViewUrl: response.data.webViewLink || '',
        webContentUrl: response.data.webContentLink || '',
        directUrl,
      };
    } catch (error) {
      this.logger.error(
        `Upload to Google Drive failed: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Upload file that bai. Vui long thu lai sau.',
      );
    }
  }

  // ===== XOA FILE TREN GOOGLE DRIVE =====
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId });
      this.logger.log(`Deleted file from Drive: ${fileId}`);
    } catch (error) {
      // Neu file khong ton tai tren Drive (da bi xoa thu cong), bo qua
      if (error.code === 404) {
        this.logger.warn(
          `File ${fileId} not found on Drive, skipping delete`,
        );
        return;
      }
      this.logger.error(
        `Delete from Google Drive failed: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Xoa file that bai. Vui long thu lai sau.',
      );
    }
  }

  // ===== LAY URL CUA FILE =====
  getFileUrl(fileId: string): {
    webViewUrl: string;
    downloadUrl: string;
    directUrl: string;
  } {
    return {
      webViewUrl: `https://drive.google.com/file/d/${fileId}/view`,
      downloadUrl: `https://drive.google.com/uc?id=${fileId}&export=download`,
      directUrl: `https://drive.google.com/uc?id=${fileId}&export=view`,
    };
  }

  // ----- Lay hoac tao subfolder -----
  private async getOrCreateFolder(
    category: string,
  ): Promise<string> {
    const folderName =
      this.CATEGORY_FOLDERS[category] || 'others';

    // Check cache truoc
    if (this.folderIdCache.has(folderName)) {
      return this.folderIdCache.get(folderName);
    }

    // Tim folder da ton tai
    const searchResponse = await this.drive.files.list({
      q: `name='${folderName}' and '${this.rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (searchResponse.data.files?.length > 0) {
      const folderId = searchResponse.data.files[0].id;
      this.folderIdCache.set(folderName, folderId);
      return folderId;
    }

    // Tao folder moi
    const createResponse = await this.drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.rootFolderId],
      },
      fields: 'id',
    });

    const newFolderId = createResponse.data.id;
    this.folderIdCache.set(folderName, newFolderId);

    this.logger.log(
      `Created Drive folder: ${folderName} (${newFolderId})`,
    );

    return newFolderId;
  }
}
```

---

## 5. DTOs

### QueryUploadDto

```typescript
// ============================================================
// modules/upload/dto/query-upload.dto.ts
// ============================================================
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UploadCategory } from '../../../enums/upload-category.enum';

export class QueryUploadDto {
  @IsOptional()
  @IsEnum(UploadCategory)
  category?: UploadCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
```

---

## 6. UploadService

```typescript
// ============================================================
// modules/upload/upload.service.ts
// ============================================================
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UploadedFile,
  UploadedFileDocument,
} from '../../schemas/uploaded-file.schema';
import { UploadCategory } from '../../enums/upload-category.enum';
import { GoogleDriveService } from './google-drive.service';
import { QueryUploadDto } from './dto/query-upload.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectModel(UploadedFile.name)
    private uploadedFileModel: Model<UploadedFileDocument>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  // ===== UPLOAD ANH SAN PHAM (ADMIN) =====
  async uploadProductImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedFileDocument> {
    this.validateFile(file);
    return this.processUpload(
      file,
      userId,
      UploadCategory.PRODUCT,
    );
  }

  // ===== UPLOAD AVATAR (JWT USER) =====
  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedFileDocument> {
    this.validateFile(file);
    return this.processUpload(
      file,
      userId,
      UploadCategory.AVATAR,
    );
  }

  // ===== UPLOAD ANH CHUNG MINH GIAO HANG (SHIPPER) =====
  async uploadDeliveryProof(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedFileDocument> {
    this.validateFile(file);
    return this.processUpload(
      file,
      userId,
      UploadCategory.DELIVERY_PROOF,
    );
  }

  // ===== UPLOAD ANH DANH GIA (CUSTOMER) - [NEW] =====
  async uploadReviewImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedFileDocument> {
    this.validateFile(file);
    return this.processUpload(
      file,
      userId,
      UploadCategory.REVIEW,
    );
  }

  // ===== UPLOAD BANNER (ADMIN) =====
  async uploadBanner(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadedFileDocument> {
    this.validateFile(file);
    return this.processUpload(file, userId, 'banner' as any);
  }

  // ===== UPLOAD NHIEU FILE SAN PHAM (ADMIN, TOI DA 10) =====
  async uploadProductImages(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<UploadedFileDocument[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Khong co file nao duoc gui');
    }

    if (files.length > 10) {
      throw new BadRequestException(
        'Toi da 10 file moi lan upload',
      );
    }

    // Validate tat ca file truoc khi upload
    files.forEach((file) => this.validateFile(file));

    // Upload song song
    const results = await Promise.all(
      files.map((file) =>
        this.processUpload(file, userId, UploadCategory.PRODUCT),
      ),
    );

    return results;
  }

  // ===== LAY FILE THEO CATEGORY =====
  async getFilesByCategory(query: QueryUploadDto) {
    const { category, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const conditions: any = { isDeleted: false };
    if (category) {
      conditions.category = category;
    }

    const [data, total] = await Promise.all([
      this.uploadedFileModel
        .find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'fullName email')
        .lean(),
      this.uploadedFileModel.countDocuments(conditions),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== XOA FILE (KIEM TRA OWNERSHIP) =====
  async deleteUpload(
    fileId: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const file = await this.uploadedFileModel.findById(fileId);

    if (!file) {
      throw new NotFoundException('File khong ton tai');
    }

    if (file.isDeleted) {
      throw new BadRequestException('File da bi xoa truoc do');
    }

    // Kiem tra quyen xoa: chi nguoi upload hoac admin
    if (
      !isAdmin &&
      file.uploadedBy.toString() !== userId
    ) {
      throw new ForbiddenException(
        'Ban khong co quyen xoa file nay',
      );
    }

    // Xoa tren Google Drive
    await this.googleDriveService.deleteFile(
      file.googleDriveFileId,
    );

    // Soft delete trong DB
    file.isDeleted = true;
    await file.save();

    this.logger.log(
      `File deleted: ${file.fileName} by user ${userId}`,
    );
  }

  // ===== LOGIC UPLOAD CHUNG =====
  private async processUpload(
    file: Express.Multer.File,
    userId: string,
    category: UploadCategory,
  ): Promise<UploadedFileDocument> {
    // Upload len Google Drive
    const driveResult = await this.googleDriveService.uploadFile(
      file,
      category,
    );

    // Luu metadata vao MongoDB
    const uploadedFile = new this.uploadedFileModel({
      fileName: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      googleDriveFileId: driveResult.fileId,
      googleDriveWebViewUrl: driveResult.webViewUrl,
      googleDriveWebContentUrl: driveResult.webContentUrl,
      uploadedBy: new Types.ObjectId(userId),
      category,
      isDeleted: false,
    });

    await uploadedFile.save();

    this.logger.log(
      `Upload success: ${file.originalname} -> ${driveResult.fileId} (${category})`,
    );

    return uploadedFile;
  }

  // ===== VALIDATE FILE =====
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File la bat buoc');
    }

    // Kiem tra MIME type (phong ngua truong hop Multer filter bi bypass)
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Dinh dang "${file.mimetype}" khong duoc ho tro. Chi chap nhan: jpg, png, webp, gif`,
      );
    }

    // Kiem tra kich thuoc (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File qua lon (${(file.size / 1024 / 1024).toFixed(1)}MB). Toi da 5MB.`,
      );
    }
  }
}
```

---

## 7. UploadController

```typescript
// ============================================================
// modules/upload/upload.controller.ts
// ============================================================
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { QueryUploadDto } from './dto/query-upload.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ===== UPLOAD ANH SAN PHAM - DON (ADMIN) =====
  @Post('product')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProduct(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const data = await this.uploadService.uploadProductImage(
      file,
      req.user._id.toString(),
    );
    return {
      success: true,
      message: 'Upload anh san pham thanh cong',
      data: {
        _id: data._id,
        fileName: data.fileName,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        url: `https://drive.google.com/uc?id=${data.googleDriveFileId}&export=view`,
        googleDriveFileId: data.googleDriveFileId,
        category: data.category,
      },
    };
  }

  // ===== UPLOAD NHIEU ANH SAN PHAM (ADMIN, TOI DA 10) =====
  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadProducts(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const results = await this.uploadService.uploadProductImages(
      files,
      req.user._id.toString(),
    );

    const data = results.map((file) => ({
      _id: file._id,
      fileName: file.fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: `https://drive.google.com/uc?id=${file.googleDriveFileId}&export=view`,
      googleDriveFileId: file.googleDriveFileId,
      category: file.category,
    }));

    return {
      success: true,
      message: `Upload ${results.length} anh thanh cong`,
      data,
    };
  }

  // ===== UPLOAD AVATAR (JWT, BAT KY USER NAO) =====
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const data = await this.uploadService.uploadAvatar(
      file,
      req.user._id.toString(),
    );
    return {
      success: true,
      message: 'Upload avatar thanh cong',
      data: {
        _id: data._id,
        url: `https://drive.google.com/uc?id=${data.googleDriveFileId}&export=view`,
        googleDriveFileId: data.googleDriveFileId,
      },
    };
  }

  // ===== UPLOAD ANH CHUNG MINH GIAO HANG (SHIPPER) =====
  @Post('delivery-proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SHIPPER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDeliveryProof(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const data = await this.uploadService.uploadDeliveryProof(
      file,
      req.user._id.toString(),
    );
    return {
      success: true,
      message: 'Upload anh chung minh giao hang thanh cong',
      data: {
        _id: data._id,
        url: `https://drive.google.com/uc?id=${data.googleDriveFileId}&export=view`,
        googleDriveFileId: data.googleDriveFileId,
      },
    };
  }

  // ===== UPLOAD ANH DANH GIA (CUSTOMER) - [NEW] =====
  @Post('review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadReviewImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const data = await this.uploadService.uploadReviewImage(
      file,
      req.user._id.toString(),
    );
    return {
      success: true,
      message: 'Upload anh danh gia thanh cong',
      data: {
        _id: data._id,
        url: `https://drive.google.com/uc?id=${data.googleDriveFileId}&export=view`,
        googleDriveFileId: data.googleDriveFileId,
      },
    };
  }

  // ===== UPLOAD BANNER (ADMIN) =====
  @Post('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const data = await this.uploadService.uploadBanner(
      file,
      req.user._id.toString(),
    );
    return {
      success: true,
      message: 'Upload banner thanh cong',
      data: {
        _id: data._id,
        url: `https://drive.google.com/uc?id=${data.googleDriveFileId}&export=view`,
        googleDriveFileId: data.googleDriveFileId,
        category: data.category,
      },
    };
  }

  // ===== LAY FILE THEO CATEGORY (ADMIN) =====
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getFiles(@Query() query: QueryUploadDto) {
    const result = await this.uploadService.getFilesByCategory(
      query,
    );
    return {
      success: true,
      ...result,
    };
  }

  // ===== XOA FILE (JWT, KIEM TRA OWNERSHIP) =====
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('id') id: string,
    @Request() req,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    await this.uploadService.deleteUpload(
      id,
      req.user._id.toString(),
      isAdmin,
    );
    return {
      success: true,
      message: 'Xoa file thanh cong',
    };
  }
}
```

---

## 8. Bang API Endpoints

| # | Method | Endpoint | Auth | Role | Mo ta |
|---|--------|----------|------|------|-------|
| 1 | `POST` | `/upload/product` | JWT | Admin | Upload 1 anh san pham |
| 2 | `POST` | `/upload/products` | JWT | Admin | Upload nhieu anh san pham (toi da 10) |
| 3 | `POST` | `/upload/avatar` | JWT | Any | Upload avatar user |
| 4 | `POST` | `/upload/delivery-proof` | JWT | Shipper | Upload anh chung minh giao hang |
| 5 | `POST` | `/upload/review` | JWT | Customer | Upload anh danh gia san pham [NEW] |
| 6 | `POST` | `/upload/banner` | JWT | Admin | Upload banner quang cao |
| 7 | `GET` | `/upload` | JWT | Admin | Lay danh sach file theo category |
| 8 | `DELETE` | `/upload/:id` | JWT | Owner/Admin | Xoa file (kiem tra ownership) |

**Luu y ve form-data:**
- Tat ca endpoint upload dung `multipart/form-data`
- Field ten la `file` (don file) hoac `files` (nhieu file)
- KHONG dung `application/json` cho upload

---

## 9. Vi du Request/Response

### 9.1. Upload anh san pham (Admin, 1 file)

**Request:**

```http
POST /upload/product
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="sofa-go-oc-cho.jpg"
Content-Type: image/jpeg

<binary data>
--boundary--
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Upload anh san pham thanh cong",
  "data": {
    "_id": "6615i1j2k3l4m5n6o7p8q9r0",
    "fileName": "1712052000000-sofa-go-oc-cho.jpg",
    "originalName": "sofa-go-oc-cho.jpg",
    "mimeType": "image/jpeg",
    "size": 245760,
    "url": "https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUv&export=view",
    "googleDriveFileId": "1AbCdEfGhIjKlMnOpQrStUv",
    "category": "product"
  }
}
```

### 9.2. Upload nhieu anh san pham (Admin, toi da 10)

**Request:**

```http
POST /upload/products
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="files"; filename="sofa-1.jpg"
Content-Type: image/jpeg
<binary data>
--boundary
Content-Disposition: form-data; name="files"; filename="sofa-2.jpg"
Content-Type: image/jpeg
<binary data>
--boundary
Content-Disposition: form-data; name="files"; filename="sofa-3.png"
Content-Type: image/png
<binary data>
--boundary--
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Upload 3 anh thanh cong",
  "data": [
    {
      "_id": "6615i2j3k4l5m6n7o8p9q0r1",
      "fileName": "1712052001000-sofa-1.jpg",
      "originalName": "sofa-1.jpg",
      "mimeType": "image/jpeg",
      "size": 189440,
      "url": "https://drive.google.com/uc?id=1BcDeFgHiJkLmNoPqRsTuVw&export=view",
      "googleDriveFileId": "1BcDeFgHiJkLmNoPqRsTuVw",
      "category": "product"
    },
    {
      "_id": "6615i3k4l5m6n7o8p9q0r1s2",
      "fileName": "1712052001001-sofa-2.jpg",
      "originalName": "sofa-2.jpg",
      "mimeType": "image/jpeg",
      "size": 203776,
      "url": "https://drive.google.com/uc?id=1CdEfGhIjKlMnOpQrStUvWx&export=view",
      "googleDriveFileId": "1CdEfGhIjKlMnOpQrStUvWx",
      "category": "product"
    },
    {
      "_id": "6615i4l5m6n7o8p9q0r1s2t3",
      "fileName": "1712052001002-sofa-3.png",
      "originalName": "sofa-3.png",
      "mimeType": "image/png",
      "size": 512000,
      "url": "https://drive.google.com/uc?id=1DeFgHiJkLmNoPqRsTuVwXy&export=view",
      "googleDriveFileId": "1DeFgHiJkLmNoPqRsTuVwXy",
      "category": "product"
    }
  ]
}
```

### 9.3. Upload avatar (Customer/Staff/Shipper)

**Request:**

```http
POST /upload/avatar
Authorization: Bearer <user_jwt_token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="my-avatar.png"
Content-Type: image/png

<binary data>
--boundary--
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Upload avatar thanh cong",
  "data": {
    "_id": "6615i5m6n7o8p9q0r1s2t3u4",
    "url": "https://drive.google.com/uc?id=1EfGhIjKlMnOpQrStUvWxYz&export=view",
    "googleDriveFileId": "1EfGhIjKlMnOpQrStUvWxYz"
  }
}
```

### 9.4. Upload anh chung minh giao hang (Shipper)

**Request:**

```http
POST /upload/delivery-proof
Authorization: Bearer <shipper_jwt_token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="proof-delivery-001.jpg"
Content-Type: image/jpeg

<binary data>
--boundary--
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Upload anh chung minh giao hang thanh cong",
  "data": {
    "_id": "6615i6n7o8p9q0r1s2t3u4v5",
    "url": "https://drive.google.com/uc?id=1FgHiJkLmNoPqRsTuVwXyZa&export=view",
    "googleDriveFileId": "1FgHiJkLmNoPqRsTuVwXyZa"
  }
}
```

### 9.5. Upload anh danh gia (Customer) [NEW]

**Request:**

```http
POST /upload/review
Authorization: Bearer <customer_jwt_token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="review-sofa.jpg"
Content-Type: image/jpeg

<binary data>
--boundary--
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Upload anh danh gia thanh cong",
  "data": {
    "_id": "6615i7o8p9q0r1s2t3u4v5w6",
    "url": "https://drive.google.com/uc?id=1GhIjKlMnOpQrStUvWxYzAb&export=view",
    "googleDriveFileId": "1GhIjKlMnOpQrStUvWxYzAb"
  }
}
```

### 9.6. Upload banner (Admin)

**Request:**

```http
POST /upload/banner
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="summer-sale-banner.webp"
Content-Type: image/webp

<binary data>
--boundary--
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Upload banner thanh cong",
  "data": {
    "_id": "6615i8p9q0r1s2t3u4v5w6x7",
    "url": "https://drive.google.com/uc?id=1HiJkLmNoPqRsTuVwXyZaBc&export=view",
    "googleDriveFileId": "1HiJkLmNoPqRsTuVwXyZaBc",
    "category": "banner"
  }
}
```

### 9.7. Danh sach file (Admin, loc theo category)

**Request:**

```http
GET /upload?category=product&page=1&limit=5
Authorization: Bearer <admin_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6615i1j2k3l4m5n6o7p8q9r0",
      "fileName": "1712052000000-sofa-go-oc-cho.jpg",
      "originalName": "sofa-go-oc-cho.jpg",
      "mimeType": "image/jpeg",
      "size": 245760,
      "googleDriveFileId": "1AbCdEfGhIjKlMnOpQrStUv",
      "googleDriveWebViewUrl": "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view",
      "googleDriveWebContentUrl": "https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUv&export=download",
      "uploadedBy": {
        "_id": "6615b0c1d2e3f4a5b6c7d8e9",
        "fullName": "Admin User",
        "email": "admin@noithatvn.com"
      },
      "category": "product",
      "isDeleted": false,
      "createdAt": "2026-04-02T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 23,
    "totalPages": 5
  }
}
```

### 9.8. Xoa file

**Request:**

```http
DELETE /upload/6615i1j2k3l4m5n6o7p8q9r0
Authorization: Bearer <user_jwt_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Xoa file thanh cong"
}
```

**Response (403 Forbidden) - Khong phai owner:**

```json
{
  "statusCode": 403,
  "message": "Ban khong co quyen xoa file nay",
  "error": "Forbidden"
}
```

### 9.9. Upload file khong hop le

**Response (400 Bad Request) - Sai dinh dang:**

```json
{
  "statusCode": 400,
  "message": "Dinh dang file khong hop le. Chi chap nhan: image/jpeg, image/png, image/webp, image/gif",
  "error": "Bad Request"
}
```

**Response (400 Bad Request) - File qua lon:**

```json
{
  "statusCode": 400,
  "message": "File qua lon (7.2MB). Toi da 5MB.",
  "error": "Bad Request"
}
```

---

> **Ghi chu quan trong:**
>
> 1. **Image URL format:** Tat ca anh duoc tra ve duoi dang `https://drive.google.com/uc?id={fileId}&export=view`. URL nay co the dung truc tiep trong `<img src="...">` tag.
>
> 2. **Memory storage:** Multer dung `memoryStorage()` de luu file trong RAM (buffer), khong ghi len disk. Buffer duoc gui thang len Google Drive roi giai phong. Phu hop voi file nho (< 5MB).
>
> 3. **Folder tu dong:** GoogleDriveService tu dong tao subfolder theo category (products/, avatars/, reviews/, ...) trong root folder. Folder ID duoc cache trong memory de toi uu.
>
> 4. **Service Account permission:** File upload can duoc set `anyone can view` de hien thi tren web. Dieu nay duoc thuc hien tu dong trong `uploadFile()`.
>
> 5. **Soft delete:** Khi xoa, file bi danh dau `isDeleted: true` trong MongoDB va xoa khoi Google Drive. Khong xoa hoan toan record trong DB de giu audit trail.
>
> 6. **Luu y bao mat:**
> - KHONG bao gio commit file `.env` chua `GOOGLE_DRIVE_PRIVATE_KEY`
> - KHONG log private key ra console
> - Service Account chi nen co quyen ghi vao 1 folder cu the, khong phai toan bo Drive
>
> 7. **Su dung trong cac module khac:**
> ```
> ShipperModule: Upload anh chung minh giao hang -> POST /upload/delivery-proof
> ReviewsModule: Upload anh danh gia -> POST /upload/review
> ProductsModule: Upload anh san pham -> POST /upload/product
> UsersModule: Upload avatar -> POST /upload/avatar
> ```
