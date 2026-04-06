export interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
  colorFamily: string;
  priceModifier: number;
  images: string[];
  available: boolean;
}

export interface ProductDimension {
  id: string;
  label: string;
  width: number;
  depth: number;
  height: number;
  weight: number;
  priceModifier: number;
  available: boolean;
}

export interface ProductVariant {
  sku: string;
  colorId: string;
  dimensionId: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  available: boolean;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: { _id: string; name: string; slug: string };
  basePrice: number;
  costPrice?: number;
  salePrice?: number;
  brand?: string;
  material?: string;
  origin?: string;
  images: string[];
  colors: ProductColor[];
  dimensions: ProductDimension[];
  variants: ProductVariant[];
  specifications?: Record<string, string>;
  status: 'active' | 'inactive' | 'draft';
  rating: { average: number; count: number };
  totalSold: number;
  viewCount: number;
  isFeatured?: boolean;
  isDeleted?: boolean;
  tags: string[];
  comboItems?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  material?: string;
  sort?: string;
  status?: string;
  isFeatured?: boolean;
  sale?: boolean;
}

export type CreateProductDto = Omit<Product, '_id' | 'rating' | 'totalSold' | 'viewCount' | 'createdAt' | 'updatedAt' | 'categoryId'> & { categoryId: string };
export type UpdateProductDto = Partial<CreateProductDto>;
