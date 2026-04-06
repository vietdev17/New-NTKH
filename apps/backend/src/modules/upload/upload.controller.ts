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
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { QueryUploadDto } from './dto/query-upload.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ===== UPLOAD ANH SAN PHAM - DON (ADMIN) =====
  @Post('product')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
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
  @ApiConsumes('multipart/form-data')
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
  @ApiConsumes('multipart/form-data')
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
  @ApiConsumes('multipart/form-data')
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

  // ===== UPLOAD ANH DANH GIA (CUSTOMER) =====
  @Post('review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiConsumes('multipart/form-data')
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
  @ApiConsumes('multipart/form-data')
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
      message: 'Da xoa file thanh cong',
    };
  }
}
