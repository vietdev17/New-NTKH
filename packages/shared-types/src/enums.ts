export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  CUSTOMER = 'customer',
  SHIPPER = 'shipper',
}

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

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export enum ShipperStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  PAYMENT_RECEIVED = 'payment_received',
  SHIPPER_ASSIGNED = 'shipper_assigned',
  LOW_STOCK = 'low_stock',
  NEW_REVIEW = 'new_review',
  RETURN_REQUESTED = 'return_requested',
  SYSTEM = 'system',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

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

export enum CouponScope {
  ALL = 'all',
  CATEGORY = 'category',
  PRODUCT = 'product',
}

export enum ShiftStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum UploadCategory {
  PRODUCT = 'product',
  AVATAR = 'avatar',
  BANNER = 'banner',
  PROOF = 'proof',
  REVIEW = 'review',
  OTHER = 'other',
}
