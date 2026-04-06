export interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantSku?: string | null;
  variantInfo?: { colorName?: string | null; dimensionLabel?: string | null };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  _id?: string;
  status: string;
  changedBy?: string;
  changedAt: string;
  note?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId?: { _id: string; fullName: string; email: string; phone?: string };
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  // Flat shipping fields
  shippingFullName: string;
  shippingPhone: string;
  shippingStreet: string;
  shippingWard: string;
  shippingDistrict: string;
  shippingProvince: string;
  shippingNote?: string | null;
  paymentMethod: 'cash' | 'bank_transfer' | 'cod';
  paymentStatus: 'unpaid' | 'paid' | 'partial' | 'refunded' | 'failed';
  bankTransferConfirmed: boolean;
  status: 'pending' | 'confirmed' | 'preparing' | 'waiting_pickup' | 'in_transit' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  statusHistory: OrderStatusHistory[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  discountReason?: string | null;
  couponCode?: string | null;
  total: number;
  shipperId?: string | null;
  shipperName?: string | null;
  shipperPhone?: string | null;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  deliveryProofImage?: string | null;
  isPosOrder: boolean;
  staffId?: string;
  shiftId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddressDto {
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

export interface CreateOrderDto {
  items: { productId: string; variantSku?: string; quantity: number }[];
  shippingAddress: ShippingAddressDto;
  paymentMethod: 'cash' | 'bank_transfer' | 'cod';
  couponCode?: string;
  note?: string;
}
