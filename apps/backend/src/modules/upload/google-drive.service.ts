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
  private oauth2Client: any;
  private drive: drive_v3.Drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly rootFolderId: string;

  // Mapping category -> subfolder name tren Google Drive
  private readonly CATEGORY_FOLDERS: Record<string, string> = {
    product: 'products',
    avatar: 'avatars',
    review: 'reviews',
    return: 'returns',
    proof: 'delivery-proofs',
    banner: 'banners',
    other: 'others',
  };

  // Cache subfolder IDs de khong phai query lai
  private folderIdCache: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('googleDrive.clientId');
    const clientSecret = this.configService.get<string>('googleDrive.clientSecret');
    const redirectUri = this.configService.get<string>('googleDrive.redirectUri');
    const refreshToken = this.configService.get<string>('googleDrive.refreshToken');

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.access_token) {
        this.logger.log('Access token auto-refreshed');
      }
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.rootFolderId = this.configService.get<string>('googleDrive.folderId');

    this.logger.log('Google Drive OAuth2 service initialized');
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
      const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

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
      directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
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
