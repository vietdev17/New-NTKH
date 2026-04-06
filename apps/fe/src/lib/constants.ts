import {
  Home, Package, ShoppingCart, Users, BarChart3, Tags, Star,
  Truck, Settings, CreditCard, RotateCcw, Grid3X3, ClipboardList,
  DollarSign, Clock, User, MapPin,
} from 'lucide-react';

// Admin sidebar navigation
export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Sản phẩm', href: '/admin/products', icon: Package },
  { label: 'Danh mục', href: '/admin/categories', icon: Grid3X3 },
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Trả hàng', href: '/admin/returns', icon: RotateCcw },
  { label: 'Khách hàng', href: '/admin/customers', icon: Users },
  { label: 'Shipper', href: '/admin/shippers', icon: Truck },
  { label: 'Bản đồ', href: '/admin/shippers/map', icon: MapPin },
  { label: 'Nhân viên', href: '/admin/staff', icon: User },
  { label: 'Mã giảm giá', href: '/admin/coupons', icon: Tags },
  { label: 'Đánh giá', href: '/admin/reviews', icon: Star },
  { label: 'Báo cáo', href: '/admin/reports', icon: BarChart3 },
  { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

// Customer main navigation
export const CUSTOMER_NAV_ITEMS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: '/products' },
  { label: 'Danh mục', href: '/categories' },
  { label: 'Khuyến mại', href: '/products?sale=true' },
  { label: 'Liên hệ', href: '/contact' },
];

// Shipper bottom navigation
export const SHIPPER_NAV_ITEMS = [
  { label: 'Trang chủ', href: '/shipper', icon: Home },
  { label: 'Đơn chờ', href: '/shipper/available', icon: MapPin },
  { label: 'Đơn hàng', href: '/shipper/orders', icon: ClipboardList },
  { label: 'Thu nhập', href: '/shipper/earnings', icon: DollarSign },
  { label: 'Tài khoản', href: '/shipper/profile', icon: User },
];

// POS navigation
export const POS_NAV_ITEMS = [
  { label: 'Bán hàng', href: '/pos', icon: ShoppingCart },
  { label: 'Đơn hàng', href: '/pos/orders', icon: ClipboardList },
  { label: 'Ca làm', href: '/pos/shifts', icon: Clock },
  { label: 'Trả hàng', href: '/pos/returns', icon: RotateCcw },
  { label: 'Báo cáo', href: '/pos/reports', icon: BarChart3 },
];

// Order status labels (Vietnamese)
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  processing: 'Đang xử lý',
  waiting_pickup: 'Chờ lấy hàng',
  in_transit: 'Đang giao',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng',
  refunded: 'Đã hoàn tiền',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-600',
  confirmed: 'bg-info-100 text-info-600',
  preparing: 'bg-purple-100 text-purple-600',
  processing: 'bg-accent-100 text-accent-600',
  waiting_pickup: 'bg-orange-100 text-orange-600',
  in_transit: 'bg-secondary-100 text-secondary-600',
  shipping: 'bg-secondary-100 text-secondary-600',
  delivered: 'bg-success-100 text-success-600',
  cancelled: 'bg-danger-100 text-danger-600',
  returned: 'bg-gray-100 text-gray-600',
  refunded: 'bg-gray-100 text-gray-600',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  partial: 'Thanh toán 1 phần',
  refunded: 'Đã hoàn tiền',
  failed: 'Thất bại',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  cod: 'Thanh toán khi nhận hàng',
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  refunded: 'Đã hoàn tiền',
};

export const SHIPPER_STATUS_LABELS: Record<string, string> = {
  available: 'Sẵn sàng',
  busy: 'Đang giao',
  offline: 'Nghỉ',
};

// Sort options for product listing
export const PRODUCT_SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'createdAt:desc' },
  { label: 'Giá tăng dần', value: 'price:asc' },
  { label: 'Giá giảm dần', value: 'price:desc' },
  { label: 'Bán chạy nhất', value: 'soldCount:desc' },
  { label: 'Đánh giá cao', value: 'avgRating:desc' },
  { label: 'Tên A-Z', value: 'name:asc' },
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  ADMIN_LIMIT: 20,
};
