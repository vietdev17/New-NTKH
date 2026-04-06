import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Inline enum to avoid monorepo path resolution issues
export enum ShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Shift extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cashierId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  cashierName: string;

  @Prop({ type: Date, required: true, default: Date.now })
  openedAt: Date;

  @Prop({ type: Date })
  closedAt?: Date;

  @Prop({ required: true, min: 0, default: 0 })
  openingCash: number;

  @Prop({ min: 0 })
  closingCash?: number;

  @Prop({ default: 0, min: 0 })
  totalSales: number;

  @Prop({ default: 0, min: 0 })
  totalOrders: number;

  @Prop({ default: 0, min: 0 })
  totalCashSales: number;

  @Prop({ default: 0, min: 0 })
  totalBankSales: number;

  @Prop({ default: 0, min: 0 })
  totalDiscounts: number;

  @Prop({ type: [Types.ObjectId], ref: 'Order', default: [] })
  orderIds: Types.ObjectId[];

  @Prop()
  note?: string;

  @Prop({ default: false })
  isClosed: boolean;
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);

// Indexes
ShiftSchema.index({ cashierId: 1 });
ShiftSchema.index({ openedAt: -1 });
ShiftSchema.index({ isClosed: 1 });
