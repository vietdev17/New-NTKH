import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

// Inline enums to avoid monorepo path resolution issues
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CUSTOMER = 'customer',
  SHIPPER = 'shipper',
}

export enum ShipperStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export interface Address {
  _id?: string;
  label?: string; // e.g. "Home", "Office"
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true, unique: true, trim: true })
  phone: string;

  @Prop()
  avatar?: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
  })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ default: false })
  isGoogleAuth: boolean;

  @Prop()
  googleId?: string;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop({ type: Date })
  resetPasswordExpires?: Date;

  @Prop({
    type: [
      {
        label: { type: String },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        ward: { type: String, required: true },
        district: { type: String, required: true },
        province: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
        lat: { type: Number },
        lng: { type: Number },
      },
    ],
    default: [],
  })
  addresses: Address[];

  @Prop({ default: 0, min: 0 })
  loyaltyPoints: number;

  // Staff/Manager specific
  @Prop()
  staffCode?: string;

  // Shipper specific
  @Prop({ type: String, enum: ['motorcycle', 'car', 'van'] })
  vehicleType?: string;

  @Prop()
  licensePlate?: string;

  @Prop({ type: String, enum: Object.values(ShipperStatus) })
  status?: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ staffCode: 1 }, { sparse: true });
