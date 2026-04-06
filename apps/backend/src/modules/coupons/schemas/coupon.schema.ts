import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

// Inline enums to avoid monorepo path resolution issues
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CouponScope {
  ALL = 'all',
  CATEGORY = 'category',
  PRODUCT = 'product',
}

// ==================== COUPON ====================

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(DiscountType),
    required: true,
  })
  discountType: string;

  @Prop({ required: true, min: 0 })
  discountValue: number;

  @Prop({ default: 0, min: 0 })
  minOrderValue: number;

  @Prop({ min: 0 })
  maxDiscountAmount?: number; // Cap for percentage discounts

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ min: 0 })
  maxUsage?: number; // null = unlimited

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: 1, min: 1 })
  maxUsagePerUser: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: Object.values(CouponScope),
    default: CouponScope.ALL,
  })
  scope: string;

  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [] })
  applicableCategories: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  applicableProducts: Types.ObjectId[];
}

export type CouponDocument = HydratedDocument<Coupon>;

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// Indexes
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });
CouponSchema.index({ scope: 1 });

// ==================== COUPON USAGE ====================

@Schema({ timestamps: true })
export class CouponUsage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: true })
  couponId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  discountAmount: number;

  @Prop({ type: Date, default: Date.now })
  usedAt: Date;
}

export type CouponUsageDocument = HydratedDocument<CouponUsage>;

export const CouponUsageSchema = SchemaFactory.createForClass(CouponUsage);

// Indexes
CouponUsageSchema.index({ couponId: 1, userId: 1 });
CouponUsageSchema.index({ orderId: 1 });
CouponUsageSchema.index({ userId: 1 });
CouponUsageSchema.index({ usedAt: -1 });
