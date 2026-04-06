# CUSTOMER - DON HANG & THEO DOI

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/orders/`, `apps/fe/src/components/orders/`
> Danh sach don hang, chi tiet don hang, theo doi giao hang real-time, huy don hang
> Tech stack: Next.js 14 + TailwindCSS + Framer Motion + Socket.IO + Leaflet
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [MyOrdersPage - Danh sach don hang](#1-myorderspage---danh-sach-don-hang)
2. [OrderDetailPage - Chi tiet don hang](#2-orderdetailpage---chi-tiet-don-hang)
3. [OrderTimeline - Lich su trang thai](#3-ordertimeline---lich-su-trang-thai)
4. [OrderTrackingPage - Theo doi giao hang real-time](#4-ordertrackingpage---theo-doi-giao-hang-real-time)
5. [ShipperMap - Ban do theo doi](#5-shippermap---ban-do-theo-doi)
6. [CancelOrderDialog - Huy don hang](#6-cancelorderdialog---huy-don-hang)

---

## 1. MyOrdersPage - Danh sach don hang

> File: `apps/fe/src/app/(customer)/orders/page.tsx`
> Hien thi danh sach don hang cua khach, loc theo trang thai, tim kiem theo ma don,
> phan trang. Moi don hang la 1 card co thong tin + actions tuong ung.

### 1.1 Order Status Config

```typescript
// apps/fe/src/lib/orderStatus.ts
import {
  Clock, PackageCheck, Truck, CheckCircle2, XCircle,
  RotateCcw, AlertCircle, CreditCard,
} from 'lucide-react';
import { OrderStatus } from '@/types';

export interface OrderStatusConfig {
  label: string;
  color: string;        // TailwindCSS color class (text-xxx)
  bgColor: string;      // TailwindCSS background class
  borderColor: string;
  icon: any;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = {
  PENDING: {
    label: 'Cho xac nhan',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Da xac nhan',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: PackageCheck,
  },
  PROCESSING: {
    label: 'Dang xu ly',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: PackageCheck,
  },
  SHIPPING: {
    label: 'Dang giao hang',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Da giao',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Da huy',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
  RETURNED: {
    label: 'Da tra hang',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: RotateCcw,
  },
  AWAITING_PAYMENT: {
    label: 'Cho thanh toan',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: CreditCard,
  },
};

export const ORDER_TABS = [
  { key: 'ALL', label: 'Tat ca' },
  { key: 'PENDING', label: 'Cho xac nhan' },
  { key: 'PROCESSING', label: 'Dang xu ly' },
  { key: 'SHIPPING', label: 'Dang giao' },
  { key: 'DELIVERED', label: 'Da giao' },
  { key: 'CANCELLED', label: 'Da huy' },
] as const;
```

### 1.2 StatusBadge Component

```tsx
// apps/fe/src/components/orders/StatusBadge.tsx
import React from 'react';
import { OrderStatus } from '@/types';
import { ORDER_STATUS_MAP } from '@/lib/orderStatus';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = ORDER_STATUS_MAP[status];
  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border
        ${config.color} ${config.bgColor} ${config.borderColor}
        ${sizeClasses[size]}`}
    >
      <Icon className={iconSize[size]} />
      {config.label}
    </span>
  );
}
```

### 1.3 MyOrdersPage Component

```tsx
// apps/fe/src/app/(customer)/orders/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, ChevronRight, Eye, MapPin,
  XCircle, Star, RotateCcw, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_TABS } from '@/lib/orderStatus';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import type { OrderStatus, Order } from '@/types';

const PAGE_SIZE = 10;

export default function MyOrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('status') || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Fetch orders
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['myOrders', activeTab, debouncedSearch, page],
    queryFn: () =>
      orderService.getMyOrders({
        status: activeTab === 'ALL' ? undefined : (activeTab as OrderStatus),
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    keepPreviousData: true,
  });

  const orders = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.total || 0;

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setPage(1);
    router.push(`/orders?status=${tab}`, { scroll: false });
  }, [router]);

  // Kiem tra don hang co the yeu cau doi tra (trong 7 ngay)
  const canReturn = (order: Order) => {
    if (order.status !== 'DELIVERED') return false;
    const deliveredDate = new Date(order.deliveredAt!);
    const now = new Date();
    const diffDays =
      (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between
                      gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Don hang cua toi
        </h1>

        {/* Tim kiem */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                             text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tim theo ma don hang..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300
                       rounded-lg focus:outline-none focus:ring-2
                       focus:ring-primary-500 focus:border-primary-500"
            aria-label="Tim kiem don hang"
          />
        </div>
      </div>

      {/* === TAB NAVIGATION === */}
      <div className="border-b border-gray-200 mb-6 -mx-4 px-4 overflow-x-auto">
        <nav className="flex gap-1 min-w-max" role="tablist" aria-label="Loc theo trang thai">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap
                transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeOrderTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5
                             bg-primary-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* === DANH SACH DON HANG === */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 rounded-xl h-40"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100
                          flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">
            {searchQuery
              ? 'Khong tim thay don hang'
              : `Khong co don hang nao`}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchQuery
              ? `Khong co ket qua cho "${searchQuery}"`
              : activeTab !== 'ALL'
              ? `Ban chua co don hang nao o trang thai "${
                  ORDER_TABS.find((t) => t.key === activeTab)?.label
                }"`
              : 'Ban chua co don hang nao. Hay bat dau mua sam!'}
          </p>
          {!searchQuery && (
            <Link href="/products">
              <Button>Mua sam ngay</Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <>
          {/* Loading overlay khi fetch */}
          <div className={`relative ${isFetching ? 'opacity-60' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {orders.map((order: Order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    canReturn={canReturn(order)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =========================
// ORDER CARD COMPONENT
// =========================

interface OrderCardProps {
  order: Order;
  canReturn: boolean;
}

function OrderCard({ order, canReturn }: OrderCardProps) {
  const previewItems = order.items.slice(0, 2);
  const remainingCount = order.items.length - 2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm
                 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header: Ma don + Ngay + Status */}
      <div className="flex flex-wrap items-center justify-between gap-2
                      px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-sm text-gray-800">
            #{order.orderNumber}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(order.createdAt)}
          </span>
        </div>
        <StatusBadge status={order.status} size="sm" />
      </div>

      {/* Body: Items preview */}
      <div className="px-4 sm:px-6 py-4">
        <div className="space-y-3">
          {previewItems.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden
                              bg-gray-100 flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-xs text-gray-500">{item.variantName}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">x{item.quantity}</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {remainingCount > 0 && (
            <p className="text-sm text-gray-500 pl-[76px]">
              + {remainingCount} san pham khac
            </p>
          )}
        </div>
      </div>

      {/* Footer: Tong tien + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3
                      px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        {/* Tong tien */}
        <div className="text-sm">
          <span className="text-gray-500">Tong: </span>
          <span className="font-bold text-primary-600 text-base">
            {formatCurrency(order.total)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Xem chi tiet - luon hien */}
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" />
              Xem chi tiet
            </Button>
          </Link>

          {/* Theo doi - chi khi dang giao */}
          {order.status === 'SHIPPING' && (
            <Link href={`/orders/${order.id}/tracking`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs
                       text-purple-600 border-purple-200 hover:bg-purple-50">
                <MapPin className="w-3.5 h-3.5" />
                Theo doi
              </Button>
            </Link>
          )}

          {/* Huy don - chi khi cho xac nhan */}
          {order.status === 'PENDING' && (
            <Link href={`/orders/${order.id}?action=cancel`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs
                       text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="w-3.5 h-3.5" />
                Huy don
              </Button>
            </Link>
          )}

          {/* Danh gia - chi khi da giao */}
          {order.status === 'DELIVERED' && (
            <Link href={`/orders/${order.id}?action=review`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs
                       text-amber-600 border-amber-200 hover:bg-amber-50">
                <Star className="w-3.5 h-3.5" />
                Danh gia
              </Button>
            </Link>
          )}

          {/* Yeu cau doi tra - da giao trong 7 ngay */}
          {canReturn && (
            <Link href={`/orders/${order.id}?action=return`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs
                       text-gray-600 border-gray-200 hover:bg-gray-50">
                <RotateCcw className="w-3.5 h-3.5" />
                Doi tra
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 2. OrderDetailPage - Chi tiet don hang

> File: `apps/fe/src/app/(customer)/orders/[id]/page.tsx`
> Hien thi chi tiet day du 1 don hang: thong tin, timeline, san pham, thanh tien,
> dia chi, phuong thuc thanh toan, va cac actions (huy, danh gia, theo doi).

```tsx
// apps/fe/src/app/(customer)/orders/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, CreditCard, Truck, Star,
  XCircle, Phone, Package, ExternalLink, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { CancelOrderDialog } from '@/components/orders/CancelOrderDialog';
import { BankTransferInfo } from '@/components/checkout/BankTransferInfo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const action = searchParams.get('action');

  const [showCancelDialog, setShowCancelDialog] = useState(action === 'cancel');

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getById(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Khong tim thay don hang</p>
          <Link href="/orders">
            <Button variant="outline">Quay lai danh sach</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPending = order.status === 'PENDING';
  const isShipping = order.status === 'SHIPPING';
  const isDelivered = order.status === 'DELIVERED';
  const isBankTransferUnpaid =
    order.paymentMethod === 'BANK_TRANSFER' &&
    order.paymentStatus === 'UNPAID';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-primary-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lai danh sach don hang
      </Link>

      {/* === HEADER === */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            Don hang #{order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dat ngay {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="space-y-6">
        {/* === ORDER TIMELINE === */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tien trinh don hang
          </h2>
          <OrderTimeline statusHistory={order.statusHistory} />
        </section>

        {/* === DANH SACH SAN PHAM === */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm
                            overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              San pham ({order.items.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="px-6 py-4 flex gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden
                                bg-gray-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="font-medium text-gray-800 hover:text-primary-500
                               line-clamp-1 transition-colors"
                  >
                    {item.productName}
                  </Link>
                  {item.variantName && (
                    <p className="text-sm text-gray-500">{item.variantName}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {formatCurrency(item.price)} x {item.quantity}
                    </span>
                    <span className="font-semibold text-primary-600">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Nut danh gia (chi khi da giao) */}
                  {isDelivered && !item.hasReview && (
                    <Link
                      href={`/products/${item.productSlug}?review=true`}
                      className="inline-flex items-center gap-1 mt-2 text-xs
                                 text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Viet danh gia
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chi tiet tien */}
          <div className="px-6 py-4 bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tam tinh</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giam gia</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Phi van chuyen</span>
              <span>
                {order.shippingFee > 0
                  ? formatCurrency(order.shippingFee)
                  : 'Mien phi'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2
                            border-t border-gray-200">
              <span>Tong cong</span>
              <span className="text-primary-600">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </section>

        {/* === DIA CHI GIAO HANG + THANH TOAN === */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Dia chi */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-500" />
              Dia chi giao hang
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-800">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-gray-500">{order.shippingAddress.phone}</p>
              <p className="text-gray-600">
                {order.shippingAddress.street},{' '}
                {order.shippingAddress.wardName},{' '}
                {order.shippingAddress.districtName},{' '}
                {order.shippingAddress.provinceName}
              </p>
              {order.shippingAddress.note && (
                <p className="text-gray-500 italic mt-2">
                  Ghi chu: {order.shippingAddress.note}
                </p>
              )}
            </div>
          </section>

          {/* Thanh toan */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-500" />
              Thong tin thanh toan
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Phuong thuc</span>
                <span className="font-medium">
                  {order.paymentMethod === 'COD'
                    ? 'Thanh toan khi nhan hang'
                    : 'Chuyen khoan ngan hang'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trang thai</span>
                <span
                  className={`font-medium ${
                    order.paymentStatus === 'PAID'
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }`}
                >
                  {order.paymentStatus === 'PAID' ? 'Da thanh toan' : 'Chua thanh toan'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* === BANK TRANSFER INFO (neu chua thanh toan) === */}
        {isBankTransferUnpaid && (
          <BankTransferInfo
            amount={order.total}
            orderNumber={order.orderNumber}
          />
        )}

        {/* === ACTION BUTTONS === */}
        <div className="flex flex-wrap gap-3">
          {/* Theo doi giao hang */}
          {isShipping && (
            <Link href={`/orders/${order.id}/tracking`}>
              <Button className="gap-2">
                <Truck className="w-5 h-5" />
                Theo doi giao hang
              </Button>
            </Link>
          )}

          {/* Huy don hang */}
          {isPending && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="w-5 h-5" />
              Huy don hang
            </Button>
          )}
        </div>
      </div>

      {/* === CANCEL DIALOG === */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onSuccess={() => {
          setShowCancelDialog(false);
          refetch();
        }}
      />
    </div>
  );
}
```

---

## 3. OrderTimeline - Lich su trang thai

> File: `apps/fe/src/components/orders/OrderTimeline.tsx`
> Hien thi timeline doc (vertical) cho lich su thay doi trang thai don hang.
> Moi muc co icon, ten trang thai, ngay gio, ghi chu (neu co).

```tsx
// apps/fe/src/components/orders/OrderTimeline.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';
import { ORDER_STATUS_MAP } from '@/lib/orderStatus';
import type { OrderStatusHistory } from '@/types';

interface OrderTimelineProps {
  statusHistory: OrderStatusHistory[];
  compact?: boolean;
}

export function OrderTimeline({ statusHistory, compact = false }: OrderTimelineProps) {
  // Sap xep theo thoi gian moi nhat truoc
  const sorted = [...statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div
      className={`relative ${compact ? 'space-y-3' : 'space-y-4'}`}
      role="list"
      aria-label="Lich su don hang"
    >
      {sorted.map((entry, index) => {
        const config = ORDER_STATUS_MAP[entry.status];
        if (!config) return null;

        const isFirst = index === 0;
        const isLast = index === sorted.length - 1;
        const Icon = config.icon;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4"
            role="listitem"
          >
            {/* Duong noi doc */}
            {!isLast && (
              <div
                className={`absolute left-[17px] top-10 w-0.5 ${
                  isFirst ? 'bg-primary-300' : 'bg-gray-200'
                }`}
                style={{ bottom: compact ? '-12px' : '-16px' }}
              />
            )}

            {/* Icon */}
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center
                justify-center flex-shrink-0 border-2 ${
                  isFirst
                    ? `${config.bgColor} ${config.borderColor}`
                    : 'bg-gray-50 border-gray-200'
                }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isFirst ? config.color : 'text-gray-400'
                }`}
              />
            </div>

            {/* Noi dung */}
            <div className={`flex-1 min-w-0 ${compact ? 'pb-0' : 'pb-1'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-medium ${
                    isFirst ? 'text-gray-800' : 'text-gray-500'
                  }`}
                >
                  {config.label}
                </p>
                <span className="text-xs text-gray-400">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>

              {entry.note && !compact && (
                <p className="text-sm text-gray-500 mt-0.5">{entry.note}</p>
              )}

              {entry.updatedBy && !compact && (
                <p className="text-xs text-gray-400 mt-0.5">
                  boi {entry.updatedBy}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
```

---

## 4. OrderTrackingPage - Theo doi giao hang real-time

> File: `apps/fe/src/app/(customer)/orders/[id]/tracking/page.tsx`
> Theo doi vi tri shipper real-time qua Socket.IO.
> Hien thi ban do Leaflet voi vi tri shipper + diem giao hang.
> Thong tin shipper, nut goi, trang thai.

### 4.1 useOrderTracking Hook (Socket.IO)

```typescript
// apps/fe/src/hooks/useOrderTracking.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/Toast';

interface ShipperLocation {
  lat: number;
  lng: number;
  heading: number;     // Huong di (do)
  speed: number;       // Toc do (km/h)
  updatedAt: string;
}

interface ShipperInfo {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  vehicleType: 'MOTORBIKE' | 'TRUCK';
  vehiclePlate: string;
}

interface TrackingData {
  shipperInfo: ShipperInfo | null;
  shipperLocation: ShipperLocation | null;
  currentStatus: string;
  estimatedTime: string | null; // "15 phut"
  isConnected: boolean;
}

export function useOrderTracking(orderId: string): TrackingData {
  const [shipperInfo, setShipperInfo] = useState<ShipperInfo | null>(null);
  const [shipperLocation, setShipperLocation] = useState<ShipperLocation | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('SHIPPING');
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
      auth: {
        token: typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Tham gia room theo don hang
      socket.emit('tracking:join', { orderId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Nhan thong tin shipper
    socket.on('tracking:shipper-info', (data: ShipperInfo) => {
      setShipperInfo(data);
    });

    // Nhan vi tri shipper (cap nhat moi 10 giay)
    socket.on('tracking:location-update', (data: ShipperLocation) => {
      setShipperLocation(data);
    });

    // Nhan thay doi trang thai
    socket.on('tracking:status-change', (data: { status: string; message: string }) => {
      setCurrentStatus(data.status);
      toast.info(data.message);
    });

    // Nhan du kien thoi gian
    socket.on('tracking:estimated-time', (data: { minutes: number }) => {
      setEstimatedTime(
        data.minutes > 60
          ? `${Math.floor(data.minutes / 60)} gio ${data.minutes % 60} phut`
          : `${data.minutes} phut`
      );
    });

    return () => {
      socket.emit('tracking:leave', { orderId });
      socket.disconnect();
    };
  }, [orderId]);

  return {
    shipperInfo,
    shipperLocation,
    currentStatus,
    estimatedTime,
    isConnected,
  };
}
```

### 4.2 OrderTrackingPage Component

```tsx
// apps/fe/src/app/(customer)/orders/[id]/tracking/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, Clock, Navigation, Wifi, WifiOff,
  Truck, MapPin, User,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { ShipperMap } from '@/components/orders/ShipperMap';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;

  // Lay thong tin don hang
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getById(orderId),
    enabled: !!orderId,
  });

  // Real-time tracking
  const {
    shipperInfo,
    shipperLocation,
    currentStatus,
    estimatedTime,
    isConnected,
  } = useOrderTracking(orderId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-xl mb-6" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Khong tim thay don hang</p>
      </div>
    );
  }

  const deliveryAddress = order.shippingAddress;
  const destination = {
    lat: deliveryAddress.lat || 10.7769, // Default Ho Chi Minh
    lng: deliveryAddress.lng || 106.7009,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href={`/orders/${orderId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-primary-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lai chi tiet don hang
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Theo doi don hang #{order.orderNumber}
          </h1>
          {estimatedTime && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Du kien: {estimatedTime}
            </p>
          )}
        </div>

        {/* Trang thai ket noi */}
        <div
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
            isConnected
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {isConnected ? 'Dang theo doi' : 'Mat ket noi'}
        </div>
      </div>

      {/* === BAN DO === */}
      <section className="mb-6">
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <ShipperMap
            shipperLocation={shipperLocation}
            destination={destination}
            deliveryAddress={`${deliveryAddress.street}, ${deliveryAddress.wardName}`}
          />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* === THONG TIN SHIPPER === */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            Nhan vien giao hang
          </h3>

          {shipperInfo ? (
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden
                              bg-gray-100 flex-shrink-0">
                <Image
                  src={shipperInfo.avatar || '/images/default-avatar.png'}
                  alt={shipperInfo.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{shipperInfo.name}</p>
                <p className="text-sm text-gray-500">{shipperInfo.phone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {shipperInfo.vehicleType === 'MOTORBIKE'
                      ? 'Xe may'
                      : 'Xe tai'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {shipperInfo.vehiclePlate}
                  </span>
                </div>
              </div>

              {/* Nut goi */}
              <a
                href={`tel:${shipperInfo.phone}`}
                className="w-12 h-12 rounded-full bg-green-500 text-white
                           flex items-center justify-center hover:bg-green-600
                           transition-colors shadow-lg shadow-green-500/30
                           flex-shrink-0"
                aria-label={`Goi cho ${shipperInfo.name}`}
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          )}

          {/* Trang thai hien tai */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Trang thai</span>
              <StatusBadge status={currentStatus as any} size="sm" />
            </div>
          </div>
        </section>

        {/* === TIMELINE (compact) === */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary-500" />
            Lich su van chuyen
          </h3>
          <OrderTimeline
            statusHistory={order.statusHistory}
            compact
          />
        </section>
      </div>

      {/* Nut goi shipper (mobile sticky) */}
      {shipperInfo && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <motion.a
            href={`tel:${shipperInfo.phone}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-2 w-full py-3.5
                       bg-green-500 text-white rounded-xl font-medium shadow-lg
                       shadow-green-500/30 active:bg-green-600"
          >
            <Phone className="w-5 h-5" />
            Goi shipper - {shipperInfo.name}
          </motion.a>
        </div>
      )}
    </div>
  );
}
```

---

## 5. ShipperMap - Ban do theo doi

> File: `apps/fe/src/components/orders/ShipperMap.tsx`
> Component ban do Leaflet hien thi vi tri shipper (real-time) va diem giao hang.
> Animate marker shipper khi vi tri thay doi.
> Route line giua shipper va destination.

```tsx
// apps/fe/src/components/orders/ShipperMap.tsx
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Truck, Loader2 } from 'lucide-react';

// Dynamic import Leaflet (SSR incompatible)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface ShipperMapProps {
  shipperLocation: {
    lat: number;
    lng: number;
    heading?: number;
  } | null;
  destination: {
    lat: number;
    lng: number;
  };
  deliveryAddress: string;
  className?: string;
}

export function ShipperMap({
  shipperLocation,
  destination,
  deliveryAddress,
  className,
}: ShipperMapProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tinh trung tam ban do
  const center = useMemo(() => {
    if (shipperLocation) {
      return {
        lat: (shipperLocation.lat + destination.lat) / 2,
        lng: (shipperLocation.lng + destination.lng) / 2,
      };
    }
    return destination;
  }, [shipperLocation, destination]);

  // Duong di giua shipper va destination
  const routeLine = useMemo(() => {
    if (!shipperLocation) return [];
    return [
      [shipperLocation.lat, shipperLocation.lng] as [number, number],
      [destination.lat, destination.lng] as [number, number],
    ];
  }, [shipperLocation, destination]);

  if (!isMounted) {
    return (
      <div
        className={`h-[400px] bg-gray-100 flex items-center justify-center ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`h-[400px] relative ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        className="h-full w-full z-0"
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker diem giao hang */}
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Dia chi giao hang</p>
              <p className="text-gray-600">{deliveryAddress}</p>
            </div>
          </Popup>
        </Marker>

        {/* Marker shipper (real-time) */}
        {shipperLocation && (
          <Marker position={[shipperLocation.lat, shipperLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Shipper dang o day</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Duong di */}
        {routeLine.length === 2 && (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: '#8B4513',
              weight: 3,
              dashArray: '10, 6',
              opacity: 0.7,
            }}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm
                      rounded-lg shadow-md px-3 py-2 text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Shipper</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Dia chi giao</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. CancelOrderDialog - Huy don hang

> File: `apps/fe/src/components/orders/CancelOrderDialog.tsx`
> Dialog xac nhan huy don hang voi chon ly do va nhap ly do tu do.
> Loading state, success/error feedback.

```tsx
// apps/fe/src/components/orders/CancelOrderDialog.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const CANCEL_REASONS = [
  { value: 'CHANGED_MIND', label: 'Doi y, khong muon mua nua' },
  { value: 'DUPLICATE_ORDER', label: 'Dat nhom / dat trung' },
  { value: 'FOUND_CHEAPER', label: 'Tim duoc gia re hon o cho khac' },
  { value: 'WRONG_ITEM', label: 'Chon sai san pham / mau sac / kich thuoc' },
  { value: 'SHIPPING_TOO_LONG', label: 'Thoi gian giao hang qua lau' },
  { value: 'OTHER', label: 'Khac' },
] as const;

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
}

export function CancelOrderDialog({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: () =>
      orderService.cancel(orderId, {
        reason: selectedReason,
        customReason:
          selectedReason === 'OTHER' ? customReason.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success('Da huy don hang thanh cong');
      onSuccess();
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        'Khong the huy don hang. Vui long thu lai.';
      toast.error(message);
    },
  });

  const handleCancel = () => {
    if (!selectedReason) {
      toast.error('Vui long chon ly do huy don');
      return;
    }
    if (selectedReason === 'OTHER' && !customReason.trim()) {
      toast.error('Vui long nhap ly do huy don');
      return;
    }
    cancelMutation.mutate();
  };

  const handleClose = () => {
    if (!cancelMutation.isLoading) {
      setSelectedReason('');
      setCustomReason('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md
                         max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-dialog-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b
                              border-gray-100">
                <h2
                  id="cancel-dialog-title"
                  className="text-lg font-bold text-gray-800 flex items-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Huy don hang
                </h2>
                <button
                  onClick={handleClose}
                  disabled={cancelMutation.isLoading}
                  className="p-1.5 text-gray-400 hover:text-gray-600
                             hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Dong"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">
                  Ban co chac chan muon huy don hang{' '}
                  <strong>#{orderNumber}</strong>? Hanh dong nay khong the hoan tac.
                </p>

                {/* Chon ly do */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ly do huy don <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {CANCEL_REASONS.map((reason) => (
                      <label
                        key={reason.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border
                          cursor-pointer transition-all ${
                            selectedReason === reason.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{reason.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ly do tu do (khi chon "Khac") */}
                <AnimatePresence>
                  {selectedReason === 'OTHER' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Ly do cu the <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        rows={3}
                        placeholder="Vui long nhap ly do huy don hang..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-300
                                   rounded-lg focus:outline-none focus:ring-2
                                   focus:ring-primary-500 resize-none"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {customReason.length}/500
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={cancelMutation.isLoading}
                >
                  Giu don hang
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleCancel}
                  disabled={cancelMutation.isLoading || !selectedReason}
                >
                  {cancelMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Dang huy...
                    </>
                  ) : (
                    'Xac nhan huy'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Tong ket cac file va component

| Component | File | Chuc nang |
|-----------|------|-----------|
| `MyOrdersPage` | `app/(customer)/orders/page.tsx` | Danh sach don hang, tab status, search, pagination |
| `StatusBadge` | `components/orders/StatusBadge.tsx` | Badge trang thai don hang co mau va icon |
| `OrderCard` | (inline trong MyOrdersPage) | Card don hang voi preview items, actions |
| `OrderDetailPage` | `app/(customer)/orders/[id]/page.tsx` | Chi tiet don hang day du |
| `OrderTimeline` | `components/orders/OrderTimeline.tsx` | Timeline doc lich su trang thai |
| `OrderTrackingPage` | `app/(customer)/orders/[id]/tracking/page.tsx` | Theo doi giao hang real-time |
| `ShipperMap` | `components/orders/ShipperMap.tsx` | Ban do Leaflet, vi tri shipper real-time |
| `CancelOrderDialog` | `components/orders/CancelOrderDialog.tsx` | Dialog huy don + chon ly do |
| `useOrderTracking` | `hooks/useOrderTracking.ts` | Socket.IO hook cho tracking |
| `ORDER_STATUS_MAP` | `lib/orderStatus.ts` | Config mau sac, icon, label cho moi status |

> **Luu y ky thuat:**
> - `ShipperMap` dung `dynamic import` vi Leaflet khong ho tro SSR.
> - `useOrderTracking` tu dong reconnect khi mat ket noi.
> - Tat ca dialog deu ho tro Esc key va click outside de dong.
> - Mobile: nut goi shipper sticky o bottom, tab navigation scrollable.
