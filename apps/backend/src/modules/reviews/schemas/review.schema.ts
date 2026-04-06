import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

// Inline enum to avoid monorepo path resolution issues
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export interface HelpfulVote {
  userId: Types.ObjectId;
  isHelpful: boolean;
}

const HelpfulVoteSchema = {
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  isHelpful: { type: Boolean, required: true },
};

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ trim: true })
  orderItemSku?: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true })
  title?: string;

  @Prop({ required: true, trim: true })
  comment: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.PENDING,
  })
  status: string;

  @Prop({ default: 0, min: 0 })
  helpfulCount: number;

  @Prop({ default: 0, min: 0 })
  unhelpfulCount: number;

  @Prop({ type: [HelpfulVoteSchema], default: [] })
  helpfulVotes: HelpfulVote[];

  @Prop()
  adminNote?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: Types.ObjectId;

  @Prop({ type: Date })
  moderatedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type ReviewDocument = HydratedDocument<Review>;

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ orderId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isDeleted: 1 });
ReviewSchema.index({ createdAt: -1 });
