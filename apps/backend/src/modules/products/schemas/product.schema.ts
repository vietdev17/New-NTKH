import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Inline enum to avoid monorepo path resolution issues
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

// ---------- Sub-document interfaces ----------

export interface ProductColor {
  id: string;
  name: string;
  hexCode?: string;
  colorFamily?: string;
  priceModifier: number;
  images: string[];
  available: boolean;
}

export interface ProductDimension {
  id: string;
  label: string; // e.g. "Small", "Large", "120x60x75cm"
  width?: number;   // cm
  depth?: number;   // cm
  height?: number;  // cm
  weight?: number;  // kg
  priceModifier: number;
  available: boolean;
}

export interface ProductVariant {
  sku: string;
  colorId?: string;
  dimensionId?: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  image?: string;
  available: boolean;
}

export interface ComboItem {
  productId: Types.ObjectId;
  quantity: number;
  note?: string;
}

export interface ProductSeo {
  title?: string;
  description?: string;
}

// ---------- Product Color sub-schema ----------
const ProductColorSchema = {
  id: { type: String, required: true },
  name: { type: String, required: true },
  hexCode: { type: String },
  colorFamily: { type: String },
  priceModifier: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  available: { type: Boolean, default: true },
};

// ---------- Product Dimension sub-schema ----------
const ProductDimensionSchema = {
  id: { type: String, required: true },
  label: { type: String, required: true },
  width: { type: Number },
  depth: { type: Number },
  height: { type: Number },
  weight: { type: Number },
  priceModifier: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
};

// ---------- Product Variant sub-schema ----------
const ProductVariantSchema = {
  sku: { type: String, required: true },
  colorId: { type: String },
  dimensionId: { type: String },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  minStock: { type: Number, default: 5, min: 0 },
  image: { type: String },
  available: { type: Boolean, default: true },
};

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  shortDescription?: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  // For combo products - the combo category they belong to
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  comboCategoryId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ min: 0 })
  costPrice?: number;

  @Prop({ trim: true })
  brand?: string;

  @Prop({ trim: true })
  material?: string;

  @Prop({ trim: true })
  origin?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [ProductColorSchema], default: [] })
  colors: ProductColor[];

  @Prop({ type: [ProductDimensionSchema], default: [] })
  dimensions: ProductDimension[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({ type: Object, default: {} })
  specifications: Record<string, string | number>;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
  })
  status: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // Combo product items
  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        note: { type: String },
      },
    ],
    default: [],
  })
  comboItems: ComboItem[];

  @Prop({
    type: {
      title: { type: String },
      description: { type: String },
    },
    default: {},
  })
  seo: ProductSeo;

  @Prop({ default: 0, min: 0 })
  viewCount: number;

  @Prop({ default: 0, min: 0 })
  totalSold: number;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type ProductDocument = Product & Document;

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index(
  { name: 'text', shortDescription: 'text', description: 'text' },
  { weights: { name: 10, shortDescription: 5, description: 1 } },
);
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ comboCategoryId: 1 }, { sparse: true });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isDeleted: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });
ProductSchema.index({ totalSold: -1 });
ProductSchema.index({ viewCount: -1 });
ProductSchema.index({ basePrice: 1 });
