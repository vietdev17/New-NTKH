import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export enum ShipperStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

@Schema({ timestamps: true })
export class ShipperLocation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  shipperId: Types.ObjectId;

  @Prop(
    raw({
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    }),
  )
  location: GeoPoint;

  @Prop({ min: 0 })
  accuracy?: number;

  @Prop({
    type: String,
    enum: Object.values(ShipperStatus),
    default: ShipperStatus.OFFLINE,
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  currentOrderId?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export type ShipperLocationDocument = HydratedDocument<ShipperLocation>;

export const ShipperLocationSchema =
  SchemaFactory.createForClass(ShipperLocation);

// 2dsphere index for geospatial queries
ShipperLocationSchema.index({ location: '2dsphere' });

// TTL index: 24 hours
ShipperLocationSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 86400 },
);

ShipperLocationSchema.index({ shipperId: 1 });
ShipperLocationSchema.index({ status: 1 });
