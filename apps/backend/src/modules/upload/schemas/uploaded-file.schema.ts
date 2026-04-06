import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

// Inline enum to avoid monorepo path resolution issues
export enum UploadCategory {
  PRODUCT = 'product',
  AVATAR = 'avatar',
  BANNER = 'banner',
  PROOF = 'proof',
  REVIEW = 'review',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class UploadedFile extends Document {
  @Prop({ required: true, trim: true })
  fileName: string;

  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ required: true, min: 0 })
  size: number; // bytes

  @Prop({ required: true, trim: true })
  googleDriveFileId: string;

  @Prop({ trim: true })
  googleDriveWebViewUrl?: string;

  @Prop({ trim: true })
  googleDriveWebContentUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(UploadCategory),
    default: UploadCategory.OTHER,
  })
  category: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type UploadedFileDocument = HydratedDocument<UploadedFile>;

export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);

// Indexes
UploadedFileSchema.index({ googleDriveFileId: 1 });
UploadedFileSchema.index({ uploadedBy: 1 });
UploadedFileSchema.index({ category: 1 });
UploadedFileSchema.index({ isDeleted: 1 });
UploadedFileSchema.index({ createdAt: -1 });
