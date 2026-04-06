export interface CartProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  basePrice: number;
  salePrice?: number;
}

export interface CartVariant {
  _id: string;
  sku: string;
  colorName: string;
  colorHex: string;
  dimensionLabel: string;
  price: number;
  stock: number;
  image?: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  product: CartProduct;
  variant?: CartVariant;
  price: number;
  quantity: number;
}

export interface CartSummary {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode?: string;
}
