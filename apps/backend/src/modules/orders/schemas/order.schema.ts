import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

// Inline enums to avoid monorepo path resolution issues
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  WAITING_PICKUP = 'waiting_pickup',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  COD = 'cod',
}

// ---------- Sub-document interfaces ----------

export interface OrderItem {
  productId: Types.ObjectId;
  productName: string;
  productImage?: string;
  variantSku?: string;
  variantInfo?: Record<string, string>; // e.g. { color: 'Nâu', size: 'L' }
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  status: string;
  changedBy?: Types.ObjectId;
  changedAt: Date;
  note?: string;
}

// ---------- Sub-schemas ----------
const OrderItemSchema = {
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  variantSku: { type: String },
  variantInfo: { type: Object },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
};

const OrderStatusHistorySchema = {
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
  },
  changedBy: { type: Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
  note: { type: String },
};

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  customerId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, trim: true })
  customerPhone: string;

  @Prop({ lowercase: true, trim: true })
  customerEmail?: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop()
  discountReason?: string;

  @Prop({ default: 0, min: 0 })
  shippingFee: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.CASH,
  })
  paymentMethod: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: string;

  @Prop({ default: false })
  bankTransferConfirmed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  bankTransferConfirmedBy?: Types.ObjectId;

  // Shipping address
  @Prop({ required: true, trim: true })
  shippingFullName: string;

  @Prop({ required: true, trim: true })
  shippingPhone: string;

  @Prop({ required: true, trim: true })
  shippingStreet: string;

  @Prop({ required: true, trim: true })
  shippingWard: string;

  @Prop({ required: true, trim: true })
  shippingDistrict: string;

  @Prop({ required: true, trim: true })
  shippingProvince: string;

  @Prop()
  shippingNote?: string;

  // Shipper info
  @Prop({ type: Types.ObjectId, ref: 'User' })
  shipperId?: Types.ObjectId;

  @Prop()
  shipperName?: string;

  @Prop()
  shipperPhone?: string;

  @Prop({ type: [OrderStatusHistorySchema], default: [] })
  statusHistory: OrderStatusHistory[];

  @Prop()
  couponCode?: string;

  // POS order flag
  @Prop({ default: false })
  isPosOrder: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // POS cash handling
  @Prop({ min: 0 })
  cashReceived?: number;

  @Prop({ min: 0 })
  changeAmount?: number;

  @Prop()
  deliveryProofImage?: string;

  @Prop()
  cancelReason?: string;

  @Prop()
  returnReason?: string;

  @Prop({ type: Date })
  estimatedDelivery?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type OrderDocument = HydratedDocument<Order>;

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ shipperId: 1 });
OrderSchema.index({ isPosOrder: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ isDeleted: 1 });
