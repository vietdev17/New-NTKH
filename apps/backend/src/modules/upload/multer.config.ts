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
