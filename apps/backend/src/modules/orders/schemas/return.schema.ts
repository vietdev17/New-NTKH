import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

// Inline enums to avoid monorepo path resolution issues
export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ReturnReason {
  WRONG_ITEM = 'wrong_item',
  DAMAGED = 'damaged',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DEFECTIVE = 'defective',
  OTHER = 'other',
}

export interface ReturnItem {
  productId: Types.ObjectId;
  variantSku: string;
  quantity: number;
  reason: string;
  note?: string;
}

const ReturnItemSchema = {
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  variantSku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: {
    type: String,
    enum: Object.values(ReturnReason),
    required: true,
  },
  note: { type: String },
};

@Schema({ timestamps: true })
export class Return extends Document {
  // Format: RT-YYYYMMDD-XXXX (e.g. RT-20240101-0001)
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  returnNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: [ReturnItemSchema], default: [] })
  items: ReturnItem[];

  @Prop({
    type: String,
    enum: Object.values(ReturnStatus),
    default: ReturnStatus.REQUESTED,
  })
  status: string;

  @Prop({ default: 0, min: 0 })
  refundAmount: number;

  @Prop({ trim: true })
  refundMethod?: string; // e.g. 'bank_transfer', 'cash', 'store_credit'

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop()
  customerNote?: string;

  @Prop()
  adminNote?: string;

  @Prop({ type: [String], default: [] })
  images: string[];
}

export type ReturnDocument = HydratedDocument<Return>;

export const ReturnSchema = SchemaFactory.createForClass(Return);

// Indexes
ReturnSchema.index({ returnNumber: 1 }, { unique: true });
ReturnSchema.index({ orderId: 1 });
ReturnSchema.index({ customerId: 1 });
ReturnSchema.index({ status: 1 });
ReturnSchema.index({ createdAt: -1 });
