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
  UploadCategory,
} from './schemas/uploaded-file.schema';
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
      UploadCategory.PROOF,
    );
  }

  // ===== UPLOAD ANH DANH GIA (CUSTOMER) =====
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
    return this.processUpload(file, userId, UploadCategory.BANNER);
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
    if (!isAdmin && file.uploadedBy?.toString() !== userId) {
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
