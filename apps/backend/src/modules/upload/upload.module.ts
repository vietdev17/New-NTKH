import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import {
  UploadedFile,
  UploadedFileSchema,
} from './schemas/uploaded-file.schema';
import { CloudinaryService } from './cloudinary.service';
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
  providers: [CloudinaryService, UploadService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}
