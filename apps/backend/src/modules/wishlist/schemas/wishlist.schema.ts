import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wishlist extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;
}

export type WishlistDocument = HydratedDocument<Wishlist>;

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Unique compound index to prevent duplicate wishlist entries
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ addedAt: -1 });
