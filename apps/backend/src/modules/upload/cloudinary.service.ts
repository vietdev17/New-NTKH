import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  // Mapping category -> Cloudinary folder
  private readonly CATEGORY_FOLDERS: Record<string, string> = {
    product: 'products',
    avatar: 'avatars',
    review: 'reviews',
    return: 'returns',
    proof: 'delivery-proofs',
    banner: 'banners',
    other: 'others',
  };

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
    this.logger.log('Cloudinary service initialized');
  }

  async uploadFile(
    file: Express.Multer.File,
    category: string,
  ): Promise<CloudinaryUploadResult> {
    const folder = this.CATEGORY_FOLDERS[category] || 'others';
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const publicId = `${folder}/${timestamp}-${safeName.split('.')[0]}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(error);
            return;
          }
          this.logger.log(
            `Uploaded to Cloudinary: ${result.public_id} (${result.bytes} bytes)`,
          );
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );

      Readable.from(file.buffer).pipe(stream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.warn(`Cloudinary delete failed: ${error.message}`);
    }
  }

  getFileUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }
}
