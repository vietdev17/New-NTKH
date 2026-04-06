# ADMIN - DON HANG & DOI TRA

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(admin)/orders/`, `apps/fe/src/app/(admin)/returns/`, `apps/fe/src/components/admin/orders/`
> Bao gom: OrdersList, OrderDetail, AssignShipperModal, ReturnManagement, ReturnDetail, PaymentReconciliation
> Tech stack: Next.js 14 + TailwindCSS + React Hook Form + date-fns + Socket.IO
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [OrdersListPage - Danh sach don hang](#1-orderslistpage---danh-sach-don-hang)
2. [OrderDetailPage - Chi tiet don hang](#2-orderdetailpage---chi-tiet-don-hang)
3. [OrderStatusTimeline - Lich su trang thai](#3-orderstatustimeline---lich-su-trang-thai)
4. [AssignShipperModal - Gan shipper](#4-assignshippermodal---gan-shipper)
5. [ReturnManagementPage - Quan ly doi tra](#5-returnmanagementpage---quan-ly-doi-tra)
6. [ReturnDetailPage - Chi tiet doi tra](#6-returndetailpage---chi-tiet-doi-tra)
7. [PaymentReconciliation - Doi soat thanh toan](#7-paymentreconciliation---doi-soat-thanh-toan)
8. [Responsive Behavior Summary](#8-responsive-behavior-summary)

---

## 1. OrdersListPage - Danh sach don hang

> File: `apps/fe/src/app/(admin)/orders/page.tsx`
> DataTable: orderNumber, customer, items, total, paymentMethod, paymentStatus, status, date, actions.
> Filter: status tabs, date range, payment method, search.
> Quick actions: doi status, gan shipper.

### 1.1 Orders List Hook

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-orders-list.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaginatedResponse,
} from '@/types';

export interface OrderListItem {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  shipperName?: string;
  createdAt: string;
}

interface OrderFilters {
  search: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
}

export function useOrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState<OrderFilters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
  });

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  /** So luong don theo tung trang thai (cho tabs) */
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // ----- Fetch orders -----
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
        sort: '-createdAt',
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const [ordersRes, countsRes] = await Promise.all([
        apiClient.get<PaginatedResponse<OrderListItem>>('/api/admin/orders', { params }),
        apiClient.get<Record<string, number>>('/api/admin/orders/status-counts'),
      ]);

      setOrders(ordersRes.data.items);
      setTotalCount(ordersRes.data.totalCount);
      setTotalPages(ordersRes.data.totalPages);
      setStatusCounts(countsRes.data);
    } catch {
      toast({
        title: 'Loi',
        description: 'Khong the tai danh sach don hang',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ----- Sync filters -> URL -----
  const updateFilters = useCallback(
    (updates: Partial<OrderFilters>) => {
      const newFilters = { ...filters, ...updates };

      // Reset page khi doi filter (tru page change)
      if (!('page' in updates)) {
        newFilters.page = 1;
      }

      setFilters(newFilters);

      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, val]) => {
        if (val && key !== 'limit' && !(key === 'page' && val === 1)) {
          params.set(key, String(val));
        }
      });

      router.replace(`/admin/orders?${params.toString()}`, { scroll: false });
    },
    [filters, router]
  );

  // ----- Quick change status -----
  const changeStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      try {
        await apiClient.patch(`/api/admin/orders/${orderId}/status`, {
          status: newStatus,
        });
        toast({ title: 'Thanh cong', description: 'Da cap nhat trang thai don hang' });
        fetchOrders();
      } catch (error: any) {
        toast({
          title: 'Loi',
          description: error.response?.data?.message || 'Cap nhat that bai',
          variant: 'destructive',
        });
      }
    },
    [fetchOrders, toast]
  );

  // ----- Export -----
  const exportExcel = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await apiClient.get('/api/admin/orders/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `don-hang-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Loi', description: 'Xuat file that bai', variant: 'destructive' });
    }
  }, [filters, toast]);

  return {
    orders,
    totalCount,
    totalPages,
    statusCounts,
    isLoading,
    filters,
    updateFilters,
    changeStatus,
    exportExcel,
    refetch: fetchOrders,
  };
}
```

### 1.2 OrdersListPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/orders/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Search,
  Download,
  Eye,
  ChevronDown,
  Truck,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrdersList, type OrderListItem } from '@/hooks/admin/use-orders-list';
import {
  OrderStatus,
  OrderStatusLabel,
  OrderStatusColor,
  PaymentStatusLabel,
  PaymentStatusColor,
  PaymentMethodLabel,
} from '@/types';
import { Pagination } from '@/components/admin/shared/pagination';
import { AssignShipperModal } from '@/components/admin/orders/assign-shipper-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

/** Trang thai tabs: tat ca + tung status */
const STATUS_TABS = [
  { value: '', label: 'Tat ca' },
  { value: 'PENDING', label: 'Cho xac nhan' },
  { value: 'CONFIRMED', label: 'Da xac nhan' },
  { value: 'PROCESSING', label: 'Dang xu ly' },
  { value: 'SHIPPING', label: 'Dang giao' },
  { value: 'DELIVERED', label: 'Da giao' },
  { value: 'CANCELLED', label: 'Da huy' },
  { value: 'RETURNED', label: 'Doi tra' },
];

/** Next valid statuses cho quick change */
const NEXT_STATUSES: Record<string, { value: OrderStatus; label: string }[]> = {
  PENDING: [
    { value: OrderStatus.CONFIRMED, label: 'Xac nhan' },
    { value: OrderStatus.CANCELLED, label: 'Huy don' },
  ],
  CONFIRMED: [
    { value: OrderStatus.PROCESSING, label: 'Bat dau xu ly' },
    { value: OrderStatus.CANCELLED, label: 'Huy don' },
  ],
  PROCESSING: [
    { value: OrderStatus.SHIPPING, label: 'Giao hang' },
  ],
  SHIPPING: [
    { value: OrderStatus.DELIVERED, label: 'Da giao' },
  ],
};

export default function OrdersListPage() {
  const {
    orders,
    totalCount,
    totalPages,
    statusCounts,
    isLoading,
    filters,
    updateFilters,
    changeStatus,
    exportExcel,
  } = useOrdersList();

  const [shipperModal, setShipperModal] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: string;
  }>({ open: false, orderId: '', orderNumber: '' });

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Don hang</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quan ly {totalCount} don hang
          </p>
        </div>
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Xuat Excel
        </button>
      </div>

      {/* ===== Status Tabs ===== */}
      <div className="flex overflow-x-auto border-b border-gray-200 -mx-4 px-4 lg:mx-0 lg:px-0">
        {STATUS_TABS.map((tab) => {
          const count = tab.value ? statusCounts[tab.value] || 0 : totalCount;
          const isActive = filters.status === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => updateFilters({ status: tab.value })}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== Filters Row ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tim theo ma don / ten khach..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm placeholder-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none"
          />
        </div>

        {/* Payment method */}
        <Select
          value={filters.paymentMethod || 'all'}
          onValueChange={(val) =>
            updateFilters({ paymentMethod: val === 'all' ? '' : val })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="PTTT" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca PTTT</SelectItem>
            {Object.entries(PaymentMethodLabel).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment status */}
        <Select
          value={filters.paymentStatus || 'all'}
          onValueChange={(val) =>
            updateFilters({ paymentStatus: val === 'all' ? '' : val })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="TT thanh toan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca TT</SelectItem>
            {Object.entries(PaymentStatusLabel).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ===== DataTable ===== */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ma don</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Khach hang</th>
                <th className="hidden md:table-cell px-4 py-3 text-center font-medium text-gray-500">SP</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Tong tien</th>
                <th className="hidden lg:table-cell px-4 py-3 text-center font-medium text-gray-500">PTTT</th>
                <th className="hidden sm:table-cell px-4 py-3 text-center font-medium text-gray-500">Thanh toan</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Trang thai</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-500">Ngay</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  onChangeStatus={changeStatus}
                  onAssignShipper={() =>
                    setShipperModal({
                      open: true,
                      orderId: order._id,
                      orderNumber: order.orderNumber,
                    })
                  }
                />
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Khong tim thay don hang nao
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Pagination ===== */}
      {totalPages > 1 && (
        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={(page) => updateFilters({ page })}
        />
      )}

      {/* ===== Assign Shipper Modal ===== */}
      <AssignShipperModal
        open={shipperModal.open}
        orderId={shipperModal.orderId}
        orderNumber={shipperModal.orderNumber}
        onClose={() =>
          setShipperModal({ open: false, orderId: '', orderNumber: '' })
        }
        onAssigned={() => {
          setShipperModal({ open: false, orderId: '', orderNumber: '' });
          // Refetch handled via hook
        }}
      />
    </div>
  );
}

// ============================================================
// OrderRow - Dong don hang trong bang
// ============================================================
interface OrderRowProps {
  order: OrderListItem;
  onChangeStatus: (orderId: string, status: OrderStatus) => void;
  onAssignShipper: () => void;
}

function OrderRow({ order, onChangeStatus, onAssignShipper }: OrderRowProps) {
  const statusLabel = OrderStatusLabel[order.status] || order.status;
  const statusColor = OrderStatusColor[order.status] || 'gray';
  const paymentLabel = PaymentStatusLabel[order.paymentStatus] || order.paymentStatus;
  const paymentColor = PaymentStatusColor[order.paymentStatus] || 'gray';
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      {/* Ma don */}
      <td className="px-4 py-3">
        <Link
          href={`/admin/orders/${order._id}`}
          className="font-medium text-primary-600 hover:underline"
        >
          #{order.orderNumber}
        </Link>
      </td>

      {/* Khach hang */}
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-900 truncate max-w-[140px]">
            {order.customerName}
          </p>
          <p className="text-xs text-gray-400">{order.customerPhone}</p>
        </div>
      </td>

      {/* Items count */}
      <td className="hidden md:table-cell px-4 py-3 text-center text-gray-600">
        {order.itemsCount}
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right font-medium text-gray-900">
        {order.total.toLocaleString('vi-VN')}d
      </td>

      {/* Payment method */}
      <td className="hidden lg:table-cell px-4 py-3 text-center">
        <span className="text-xs text-gray-600">
          {PaymentMethodLabel[order.paymentMethod]}
        </span>
      </td>

      {/* Payment status */}
      <td className="hidden sm:table-cell px-4 py-3 text-center">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
            `bg-${paymentColor}-50 text-${paymentColor}-700`
          )}
        >
          {paymentLabel}
        </span>
      </td>

      {/* Order status */}
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            `bg-${statusColor}-50 text-${statusColor}-700`
          )}
        >
          {statusLabel}
        </span>
      </td>

      {/* Date */}
      <td className="hidden md:table-cell px-4 py-3 text-gray-500 text-xs">
        {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* View detail */}
          <Link
            href={`/admin/orders/${order._id}`}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Xem chi tiet"
          >
            <Eye className="h-4 w-4" />
          </Link>

          {/* Quick status change */}
          {nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Doi trang thai"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses.map((ns) => (
                  <DropdownMenuItem
                    key={ns.value}
                    onClick={() => onChangeStatus(order._id, ns.value)}
                  >
                    {ns.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Assign shipper (chi khi PROCESSING hoac CONFIRMED) */}
          {(order.status === 'PROCESSING' || order.status === 'CONFIRMED') && (
            <button
              onClick={onAssignShipper}
              className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
              title="Gan shipper"
            >
              <Truck className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
```

---

## 2. OrderDetailPage - Chi tiet don hang

> File: `apps/fe/src/app/(admin)/orders/[id]/page.tsx`
> Hien thi toan bo thong tin don hang: header, customer, items, price breakdown,
> shipping address, payment, shipper, timeline, notes.

### 2.1 Order Detail Hook

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-order-detail.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { OrderStatus, PaymentStatus, PaymentMethod } from '@/types';

export interface OrderDetail {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;

  // Customer
  customer: {
    _id: string;
    fullName: string;
    phone: string;
    email: string;
    avatar?: string;
  };

  // Items
  items: Array<{
    _id: string;
    productId: string;
    productName: string;
    productImage: string;
    variantLabel: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  // Pricing
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode?: string;
  total: number;

  // Shipping
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    lat?: number;
    lng?: number;
  };

  // Shipper
  shipper?: {
    _id: string;
    fullName: string;
    phone: string;
    avatar?: string;
    currentOrdersCount: number;
  };

  // Timeline
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
    changedBy?: string;
  }>;

  // Notes
  customerNote?: string;
  adminNotes: Array<{
    _id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
}

export function useOrderDetail(orderId: string) {
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<OrderDetail>(
        `/api/admin/orders/${orderId}`
      );
      setOrder(res.data);
    } catch {
      toast({
        title: 'Loi',
        description: 'Khong the tai thong tin don hang',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const changeStatus = useCallback(
    async (newStatus: OrderStatus, note?: string) => {
      try {
        await apiClient.patch(`/api/admin/orders/${orderId}/status`, {
          status: newStatus,
          note,
        });
        toast({ title: 'Thanh cong', description: 'Da cap nhat trang thai' });
        fetchOrder();
      } catch (error: any) {
        toast({
          title: 'Loi',
          description: error.response?.data?.message || 'Cap nhat that bai',
          variant: 'destructive',
        });
      }
    },
    [orderId, fetchOrder, toast]
  );

  const confirmPayment = useCallback(async () => {
    try {
      await apiClient.patch(`/api/admin/orders/${orderId}/confirm-payment`);
      toast({ title: 'Thanh cong', description: 'Da xac nhan thanh toan' });
      fetchOrder();
    } catch {
      toast({
        title: 'Loi',
        description: 'Xac nhan thanh toan that bai',
        variant: 'destructive',
      });
    }
  }, [orderId, fetchOrder, toast]);

  const addNote = useCallback(
    async (content: string) => {
      try {
        await apiClient.post(`/api/admin/orders/${orderId}/notes`, { content });
        toast({ title: 'Thanh cong', description: 'Da them ghi chu' });
        fetchOrder();
      } catch {
        toast({ title: 'Loi', description: 'Them ghi chu that bai', variant: 'destructive' });
      }
    },
    [orderId, fetchOrder, toast]
  );

  return {
    order,
    isLoading,
    changeStatus,
    confirmPayment,
    addNote,
    refetch: fetchOrder,
  };
}
```

### 2.2 OrderDetailPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/orders/[id]/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Truck,
  MessageSquare,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrderDetail } from '@/hooks/admin/use-order-detail';
import {
  OrderStatus,
  OrderStatusLabel,
  OrderStatusColor,
  PaymentStatusLabel,
  PaymentStatusColor,
  PaymentMethodLabel,
} from '@/types';
import { OrderStatusTimeline } from '@/components/admin/orders/order-status-timeline';
import { AssignShipperModal } from '@/components/admin/orders/assign-shipper-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

/** Status luon chuyen tiep hop le */
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPING],
  SHIPPING: [OrderStatus.DELIVERED],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, changeStatus, confirmPayment, addNote, refetch } =
    useOrderDetail(id);

  const [shipperModal, setShipperModal] = useState(false);
  const [paymentConfirm, setPaymentConfirm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // ----- Add note -----
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    await addNote(newNote.trim());
    setNewNote('');
    setIsAddingNote(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const validNextStatuses = VALID_TRANSITIONS[order.status] || [];
  const statusColor = OrderStatusColor[order.status] || 'gray';

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Don #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>

        {/* Status badge + change dropdown */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
              `bg-${statusColor}-50 text-${statusColor}-700`
            )}
          >
            {OrderStatusLabel[order.status]}
          </span>

          {validNextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Chuyen trang thai
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {validNextStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => changeStatus(status)}
                  >
                    {OrderStatusLabel[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ===== Main Content Grid ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== LEFT COLUMN (2/3) ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* --- Items Table --- */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">
                San pham ({order.items.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">San pham</th>
                    <th className="px-5 py-3 text-center font-medium text-gray-500">SL</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Don gia</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Thanh tien</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item._id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                            <Image
                              src={item.productImage || '/images/placeholder.webp'}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${item.productId}/edit`}
                              className="text-sm font-medium text-gray-900 hover:text-primary-600 block truncate"
                            >
                              {item.productName}
                            </Link>
                            <p className="text-xs text-gray-500">
                              {item.variantLabel} | SKU: {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-700">
                        x{item.quantity}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {item.unitPrice.toLocaleString('vi-VN')}d
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">
                        {item.total.toLocaleString('vi-VN')}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price breakdown */}
            <div className="border-t border-gray-200 px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tam tinh</span>
                <span className="text-gray-700">
                  {order.subtotal.toLocaleString('vi-VN')}d
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Giam gia
                    {order.couponCode && (
                      <span className="ml-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span className="text-green-600">
                    -{order.discount.toLocaleString('vi-VN')}d
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phi van chuyen</span>
                <span className="text-gray-700">
                  {order.shippingFee > 0
                    ? order.shippingFee.toLocaleString('vi-VN') + 'd'
                    : 'Mien phi'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-base font-semibold text-gray-900">
                  Tong cong
                </span>
                <span className="text-base font-bold text-primary-600">
                  {order.total.toLocaleString('vi-VN')}d
                </span>
              </div>
            </div>
          </div>

          {/* --- Status Timeline --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900">Lich su trang thai</h3>
            <OrderStatusTimeline history={order.statusHistory} />
          </div>

          {/* --- Notes --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-gray-400" />
              Ghi chu
            </h3>

            {/* Customer note */}
            {order.customerNote && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-700 mb-1">
                  Ghi chu cua khach hang:
                </p>
                <p className="text-sm text-amber-800">{order.customerNote}</p>
              </div>
            )}

            {/* Admin notes list */}
            {order.adminNotes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {order.adminNotes.map((note) => (
                  <li
                    key={note._id}
                    className="rounded-lg bg-gray-50 p-3"
                  >
                    <p className="text-sm text-gray-800">{note.content}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {note.createdBy} -{' '}
                      {format(new Date(note.createdAt), 'dd/MM HH:mm')}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* Add note input */}
            <div className="flex items-start gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Them ghi chu noi bo..."
                rows={2}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-300 focus:outline-none resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                className="rounded-lg bg-primary-500 p-2.5 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {isAddingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN (1/3) ===== */}
        <div className="space-y-6">
          {/* --- Customer Info --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-gray-400" />
              Khach hang
            </h3>
            <div className="space-y-2">
              <Link
                href={`/admin/customers/${order.customer._id}`}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {order.customer.fullName}
              </Link>
              <p className="text-sm text-gray-600">{order.customer.phone}</p>
              <p className="text-sm text-gray-600">{order.customer.email}</p>
            </div>
          </div>

          {/* --- Shipping Address --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-gray-400" />
              Dia chi giao hang
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-gray-900">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.phone}</p>
              <p>
                {order.shippingAddress.street}, {order.shippingAddress.ward},{' '}
                {order.shippingAddress.district}, {order.shippingAddress.province}
              </p>
            </div>
          </div>

          {/* --- Payment --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-gray-400" />
              Thanh toan
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Phuong thuc</span>
                <span className="text-sm font-medium text-gray-900">
                  {PaymentMethodLabel[order.paymentMethod]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trang thai</span>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    `bg-${PaymentStatusColor[order.paymentStatus]}-50`,
                    `text-${PaymentStatusColor[order.paymentStatus]}-700`
                  )}
                >
                  {PaymentStatusLabel[order.paymentStatus]}
                </span>
              </div>

              {/* Confirm payment button (bank transfer, chua thanh toan) */}
              {order.paymentMethod === 'bank_transfer' &&
                order.paymentStatus === 'PENDING' && (
                  <button
                    onClick={() => setPaymentConfirm(true)}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Xac nhan thanh toan
                  </button>
                )}
            </div>
          </div>

          {/* --- Shipper --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-gray-400" />
              Shipper
            </h3>

            {order.shipper ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {order.shipper.fullName}
                </p>
                <p className="text-sm text-gray-600">{order.shipper.phone}</p>
                <p className="text-xs text-gray-400">
                  Dang giao {order.shipper.currentOrdersCount} don
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Chua gan shipper
                </p>
                {(order.status === 'CONFIRMED' ||
                  order.status === 'PROCESSING') && (
                  <button
                    onClick={() => setShipperModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                  >
                    <Truck className="h-4 w-4" />
                    Gan shipper
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Modals ===== */}
      <AssignShipperModal
        open={shipperModal}
        orderId={order._id}
        orderNumber={order.orderNumber}
        onClose={() => setShipperModal(false)}
        onAssigned={() => {
          setShipperModal(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={paymentConfirm}
        onClose={() => setPaymentConfirm(false)}
        onConfirm={() => {
          confirmPayment();
          setPaymentConfirm(false);
        }}
        title="Xac nhan thanh toan"
        description={`Xac nhan da nhan ${order.total.toLocaleString('vi-VN')}d tu khach hang ${order.customer.fullName} qua chuyen khoan?`}
      />
    </div>
  );
}
```

---

## 3. OrderStatusTimeline - Lich su trang thai

> File: `apps/fe/src/components/admin/orders/order-status-timeline.tsx`
> Hien thi timeline cac buoc trang thai don hang theo thoi gian.

```tsx
// ============================================================
// apps/fe/src/components/admin/orders/order-status-timeline.tsx
// ============================================================
'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderStatusLabel } from '@/types';

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
  changedBy?: string;
}

interface OrderStatusTimelineProps {
  history: StatusHistoryEntry[];
}

/** Map status -> icon va mau */
const STATUS_ICON_MAP: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  PENDING: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  CONFIRMED: { icon: PackageCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
  PROCESSING: { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  SHIPPING: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
  DELIVERED: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  CANCELLED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  RETURNED: { icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50' },
};

export function OrderStatusTimeline({ history }: OrderStatusTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gray-200" />

      <ul className="space-y-6">
        {history.map((entry, index) => {
          const config = STATUS_ICON_MAP[entry.status] || {
            icon: Clock,
            color: 'text-gray-400',
            bg: 'bg-gray-50',
          };
          const Icon = config.icon;
          const isLast = index === history.length - 1;

          return (
            <li key={index} className="relative flex gap-4">
              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2',
                  isLast
                    ? `${config.bg} border-current ${config.color}`
                    : 'bg-white border-gray-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-4.5 w-4.5',
                    isLast ? config.color : 'text-gray-400'
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isLast ? 'text-gray-900' : 'text-gray-600'
                  )}
                >
                  {OrderStatusLabel[entry.status as keyof typeof OrderStatusLabel] ||
                    entry.status}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(entry.timestamp), "dd/MM/yyyy 'luc' HH:mm", {
                    locale: vi,
                  })}
                  {entry.changedBy && ` - boi ${entry.changedBy}`}
                </p>
                {entry.note && (
                  <p className="mt-1 text-xs text-gray-500 italic">
                    "{entry.note}"
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

## 4. AssignShipperModal - Gan shipper

> File: `apps/fe/src/components/admin/orders/assign-shipper-modal.tsx`
> Danh sach shipper kha dung: name, phone, status, so don dang giao.
> Tim kiem theo ten. Chon va gan.

```tsx
// ============================================================
// apps/fe/src/components/admin/orders/assign-shipper-modal.tsx
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Truck, Phone, Package, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AvailableShipper {
  _id: string;
  fullName: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'busy' | 'offline';
  currentOrdersCount: number;
  /** Khoang cach den dia chi giao (km) - co khi order co toa do */
  distance?: number;
}

interface AssignShipperModalProps {
  open: boolean;
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onAssigned: () => void;
}

const STATUS_CONFIG = {
  active: { label: 'San sang', color: 'bg-green-500' },
  busy: { label: 'Dang giao', color: 'bg-amber-500' },
  offline: { label: 'Offline', color: 'bg-gray-400' },
};

export function AssignShipperModal({
  open,
  orderId,
  orderNumber,
  onClose,
  onAssigned,
}: AssignShipperModalProps) {
  const { toast } = useToast();
  const [shippers, setShippers] = useState<AvailableShipper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // ----- Fetch available shippers -----
  useEffect(() => {
    if (!open || !orderId) return;

    const fetchShippers = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<AvailableShipper[]>(
          '/api/admin/shippers/available',
          {
            params: { orderId },
          }
        );
        setShippers(res.data);
      } catch {
        toast({
          title: 'Loi',
          description: 'Khong the tai danh sach shipper',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippers();
    setSearch('');
    setSelectedId(null);
  }, [open, orderId, toast]);

  // ----- Filter by search -----
  const filteredShippers = shippers.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  // ----- Sort: nearby first (if distance available), then by current orders -----
  const sortedShippers = [...filteredShippers].sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return a.currentOrdersCount - b.currentOrdersCount;
  });

  // ----- Assign -----
  const handleAssign = useCallback(async () => {
    if (!selectedId) return;

    setIsAssigning(true);
    try {
      await apiClient.patch(`/api/admin/orders/${orderId}/assign-shipper`, {
        shipperId: selectedId,
      });
      toast({
        title: 'Thanh cong',
        description: `Da gan shipper cho don #${orderNumber}`,
      });
      onAssigned();
    } catch (error: any) {
      toast({
        title: 'Loi',
        description: error.response?.data?.message || 'Gan shipper that bai',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  }, [selectedId, orderId, orderNumber, toast, onAssigned]);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gan shipper - Don #{orderNumber}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tim shipper theo ten hoac SDT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm placeholder-gray-400 focus:border-primary-300 focus:outline-none"
          />
        </div>

        {/* Shipper list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : sortedShippers.length === 0 ? (
            <div className="py-12 text-center">
              <Truck className="mx-auto h-10 w-10 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">
                Khong tim thay shipper phu hop
              </p>
            </div>
          ) : (
            <ul className="space-y-2 py-2">
              {sortedShippers.map((shipper) => {
                const isSelected = selectedId === shipper._id;
                const statusCfg = STATUS_CONFIG[shipper.status];

                return (
                  <li key={shipper._id}>
                    <button
                      onClick={() => setSelectedId(shipper._id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        isSelected
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {/* Avatar / Icon */}
                      <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Truck className="h-5 w-5 text-gray-500" />
                        {/* Status dot */}
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
                            statusCfg.color
                          )}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {shipper.fullName}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            {shipper.phone}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Package className="h-3 w-3" />
                            {shipper.currentOrdersCount} don
                          </span>
                          {shipper.distance !== undefined && (
                            <span className="text-xs text-blue-500 font-medium">
                              ~{shipper.distance.toFixed(1)}km
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Action */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Huy
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedId || isAssigning}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
            Gan shipper
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. ReturnManagementPage - Quan ly doi tra

> File: `apps/fe/src/app/(admin)/returns/page.tsx`
> DataTable: returnNumber, orderNumber, customer, items count, status badge, refund amount, date, actions.
> Status tabs: Tat ca, Cho duyet, Da duyet, Dang xu ly, Hoan thanh, Tu choi.

### 5.1 Returns List Hook

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-returns-list.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { ReturnStatus, PaginatedResponse } from '@/types';

export interface ReturnListItem {
  _id: string;
  returnNumber: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  itemsCount: number;
  status: ReturnStatus;
  refundAmount: number;
  reason: string;
  createdAt: string;
}

interface ReturnFilters {
  status: string;
  search: string;
  page: number;
  limit: number;
}

export function useReturnsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReturnFilters>({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
  });

  const [returns, setReturns] = useState<ReturnListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
        sort: '-createdAt',
      };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const [returnsRes, countsRes] = await Promise.all([
        apiClient.get<PaginatedResponse<ReturnListItem>>('/api/admin/returns', { params }),
        apiClient.get<Record<string, number>>('/api/admin/returns/status-counts'),
      ]);

      setReturns(returnsRes.data.items);
      setTotalCount(returnsRes.data.totalCount);
      setTotalPages(returnsRes.data.totalPages);
      setStatusCounts(countsRes.data);
    } catch {
      toast({ title: 'Loi', description: 'Khong the tai danh sach doi tra', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const updateFilters = useCallback(
    (updates: Partial<ReturnFilters>) => {
      const newFilters = { ...filters, ...updates };
      if (!('page' in updates)) newFilters.page = 1;
      setFilters(newFilters);

      const params = new URLSearchParams();
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.page > 1) params.set('page', String(newFilters.page));
      router.replace(`/admin/returns?${params.toString()}`, { scroll: false });
    },
    [filters, router]
  );

  return {
    returns,
    totalCount,
    totalPages,
    statusCounts,
    isLoading,
    filters,
    updateFilters,
    refetch: fetchReturns,
  };
}
```

### 5.2 ReturnManagementPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/returns/page.tsx
// ============================================================
'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Eye, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReturnsList } from '@/hooks/admin/use-returns-list';
import { ReturnStatusLabel, ReturnStatusColor } from '@/types';
import { Pagination } from '@/components/admin/shared/pagination';
import { Skeleton } from '@/components/ui/skeleton';

const RETURN_STATUS_TABS = [
  { value: '', label: 'Tat ca' },
  { value: 'REQUESTED', label: 'Cho duyet' },
  { value: 'APPROVED', label: 'Da duyet' },
  { value: 'PROCESSING', label: 'Dang xu ly' },
  { value: 'COMPLETED', label: 'Hoan thanh' },
  { value: 'REJECTED', label: 'Tu choi' },
];

export default function ReturnManagementPage() {
  const {
    returns,
    totalCount,
    totalPages,
    statusCounts,
    isLoading,
    filters,
    updateFilters,
  } = useReturnsList();

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doi tra</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quan ly {totalCount} yeu cau doi tra
        </p>
      </div>

      {/* ===== Status Tabs ===== */}
      <div className="flex overflow-x-auto border-b border-gray-200 -mx-4 px-4 lg:mx-0 lg:px-0">
        {RETURN_STATUS_TABS.map((tab) => {
          const count = tab.value ? statusCounts[tab.value] || 0 : totalCount;
          const isActive = filters.status === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => updateFilters({ status: tab.value })}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== Search ===== */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tim theo ma doi tra / ma don / ten khach..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm placeholder-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* ===== DataTable ===== */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ma doi tra</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Don hang</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-gray-500">Khach hang</th>
                <th className="hidden md:table-cell px-4 py-3 text-center font-medium text-gray-500">SP</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Trang thai</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Hoan tien</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-500">Ngay</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map((item) => {
                const statusLabel = ReturnStatusLabel[item.status] || item.status;
                const statusColor = ReturnStatusColor[item.status] || 'gray';

                return (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/returns/${item._id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        #{item.returnNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${item.orderId}`}
                        className="text-sm text-gray-600 hover:text-primary-600"
                      >
                        #{item.orderNumber}
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-700 truncate max-w-[140px]">
                      {item.customerName}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center text-gray-600">
                      {item.itemsCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          `bg-${statusColor}-50 text-${statusColor}-700`
                        )}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {item.refundAmount.toLocaleString('vi-VN')}d
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500">
                      {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/returns/${item._id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Xem chi tiet"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {returns.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <RotateCcw className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">
                      Khong co yeu cau doi tra nao
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Pagination ===== */}
      {totalPages > 1 && (
        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={(page) => updateFilters({ page })}
        />
      )}
    </div>
  );
}
```

---

## 6. ReturnDetailPage - Chi tiet doi tra

> File: `apps/fe/src/app/(admin)/returns/[id]/page.tsx`
> Hien thi chi tiet yeu cau doi tra: thong tin, san pham, ly do, anh khach gui,
> admin actions (duyet / tu choi / hoan tien), ghi chu admin.

### 6.1 Return Detail Hook

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-return-detail.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { ReturnStatus } from '@/types';

export interface ReturnDetail {
  _id: string;
  returnNumber: string;
  status: ReturnStatus;
  createdAt: string;

  // Order reference
  orderId: string;
  orderNumber: string;

  // Customer
  customer: {
    _id: string;
    fullName: string;
    phone: string;
    email: string;
  };

  // Return items
  items: Array<{
    _id: string;
    productName: string;
    productImage: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    reason: string;
    reasonLabel: string;
    note?: string;
  }>;

  // Customer note + images
  customerNote?: string;
  customerImages: string[];

  // Refund
  refundAmount: number;
  refundMethod?: string;
  refundedAt?: string;

  // Admin
  adminNote?: string;
  rejectionReason?: string;
  processedBy?: string;
  processedAt?: string;
}

export function useReturnDetail(returnId: string) {
  const { toast } = useToast();
  const [returnData, setReturnData] = useState<ReturnDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReturn = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ReturnDetail>(
        `/api/admin/returns/${returnId}`
      );
      setReturnData(res.data);
    } catch {
      toast({
        title: 'Loi',
        description: 'Khong the tai thong tin doi tra',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [returnId, toast]);

  useEffect(() => {
    fetchReturn();
  }, [fetchReturn]);

  const approve = useCallback(
    async (note?: string) => {
      try {
        await apiClient.patch(`/api/admin/returns/${returnId}/approve`, { note });
        toast({ title: 'Thanh cong', description: 'Da duyet yeu cau doi tra' });
        fetchReturn();
      } catch (error: any) {
        toast({
          title: 'Loi',
          description: error.response?.data?.message || 'Duyet that bai',
          variant: 'destructive',
        });
      }
    },
    [returnId, fetchReturn, toast]
  );

  const reject = useCallback(
    async (reason: string) => {
      try {
        await apiClient.patch(`/api/admin/returns/${returnId}/reject`, { reason });
        toast({ title: 'Thanh cong', description: 'Da tu choi yeu cau doi tra' });
        fetchReturn();
      } catch (error: any) {
        toast({
          title: 'Loi',
          description: error.response?.data?.message || 'Tu choi that bai',
          variant: 'destructive',
        });
      }
    },
    [returnId, fetchReturn, toast]
  );

  const processRefund = useCallback(
    async (amount: number, method: string) => {
      try {
        await apiClient.patch(`/api/admin/returns/${returnId}/refund`, {
          amount,
          method,
        });
        toast({ title: 'Thanh cong', description: 'Da xu ly hoan tien' });
        fetchReturn();
      } catch (error: any) {
        toast({
          title: 'Loi',
          description: error.response?.data?.message || 'Hoan tien that bai',
          variant: 'destructive',
        });
      }
    },
    [returnId, fetchReturn, toast]
  );

  return {
    returnData,
    isLoading,
    approve,
    reject,
    processRefund,
    refetch: fetchReturn,
  };
}
```

### 6.2 ReturnDetailPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/returns/[id]/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Package,
  MessageSquare,
  ImageIcon,
  CheckCircle2,
  XCircle,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReturnDetail } from '@/hooks/admin/use-return-detail';
import { ReturnStatusLabel, ReturnStatusColor, ReturnReasonLabel } from '@/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { returnData, isLoading, approve, reject, processRefund } =
    useReturnDetail(id);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('bank_transfer');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[250px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!returnData) return null;

  const statusColor = ReturnStatusColor[returnData.status] || 'gray';

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/returns"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Doi tra #{returnData.returnNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {format(new Date(returnData.createdAt), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex self-start rounded-full px-3 py-1 text-sm font-medium',
            `bg-${statusColor}-50 text-${statusColor}-700`
          )}
        >
          {ReturnStatusLabel[returnData.status]}
        </span>
      </div>

      {/* ===== Main Grid ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== LEFT (2/3) ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* --- Return Items --- */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-gray-400" />
                San pham doi tra ({returnData.items.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {returnData.items.map((item) => (
                <div key={item._id} className="flex gap-4 px-5 py-4">
                  {/* Image */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <Image
                      src={item.productImage || '/images/placeholder.webp'}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.variantLabel} | SL: {item.quantity} |{' '}
                      {item.unitPrice.toLocaleString('vi-VN')}d/sp
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                        Ly do: {item.reasonLabel}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-1 text-xs text-gray-500 italic">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- Customer Note + Images --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-gray-400" />
              Ghi chu khach hang
            </h3>

            {returnData.customerNote ? (
              <p className="text-sm text-gray-700 mb-4">
                {returnData.customerNote}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Khong co ghi chu</p>
            )}

            {/* Customer images */}
            {returnData.customerImages.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Hinh anh ({returnData.customerImages.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {returnData.customerImages.map((img, i) => (
                    <a
                      key={i}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={img}
                        alt={`Anh ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- Admin Note (da xu ly) --- */}
          {(returnData.adminNote || returnData.rejectionReason) && (
            <div
              className={cn(
                'rounded-xl border p-5',
                returnData.rejectionReason
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <h3 className="mb-2 font-semibold text-gray-900">Ghi chu admin</h3>
              {returnData.rejectionReason && (
                <div className="flex items-start gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    Ly do tu choi: {returnData.rejectionReason}
                  </p>
                </div>
              )}
              {returnData.adminNote && (
                <p className="text-sm text-gray-700">{returnData.adminNote}</p>
              )}
              {returnData.processedBy && (
                <p className="mt-2 text-xs text-gray-400">
                  Xu ly boi {returnData.processedBy}
                  {returnData.processedAt &&
                    ` - ${format(new Date(returnData.processedAt), 'dd/MM/yyyy HH:mm')}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ===== RIGHT (1/3) ===== */}
        <div className="space-y-6">
          {/* --- Customer Info --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-gray-400" />
              Khach hang
            </h3>
            <div className="space-y-1">
              <Link
                href={`/admin/customers/${returnData.customer._id}`}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {returnData.customer.fullName}
              </Link>
              <p className="text-sm text-gray-600">{returnData.customer.phone}</p>
              <p className="text-sm text-gray-600">{returnData.customer.email}</p>
            </div>
          </div>

          {/* --- Original Order --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Don hang goc</h3>
            <Link
              href={`/admin/orders/${returnData.orderId}`}
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              #{returnData.orderNumber}
            </Link>
          </div>

          {/* --- Refund Info --- */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4.5 w-4.5 text-gray-400" />
              Hoan tien
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">So tien</span>
                <span className="text-sm font-bold text-gray-900">
                  {returnData.refundAmount.toLocaleString('vi-VN')}d
                </span>
              </div>
              {returnData.refundMethod && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phuong thuc</span>
                  <span className="text-sm text-gray-700">
                    {returnData.refundMethod === 'bank_transfer'
                      ? 'Chuyen khoan'
                      : 'Tien mat'}
                  </span>
                </div>
              )}
              {returnData.refundedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Ngay hoan</span>
                  <span className="text-sm text-gray-700">
                    {format(new Date(returnData.refundedAt), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* --- Admin Actions --- */}
          {returnData.status === 'REQUESTED' && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Hanh dong</h3>

              {/* Admin note */}
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ghi chu (tuy chon)..."
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none resize-none"
              />

              {/* Approve */}
              <button
                onClick={async () => {
                  setIsProcessing(true);
                  await approve(adminNote || undefined);
                  setIsProcessing(false);
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Duyet yeu cau
              </button>

              {/* Reject */}
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Tu choi
              </button>
            </div>
          )}

          {/* Process refund (khi da duyet) */}
          {returnData.status === 'APPROVED' && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Xu ly hoan tien</h3>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  So tien hoan (VND)
                </label>
                <input
                  type="number"
                  value={refundAmount || returnData.refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Phuong thuc hoan
                </label>
                <Select
                  value={refundMethod}
                  onValueChange={setRefundMethod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Chuyen khoan</SelectItem>
                    <SelectItem value="cash">Tien mat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={async () => {
                  setIsProcessing(true);
                  await processRefund(
                    refundAmount || returnData.refundAmount,
                    refundMethod
                  );
                  setIsProcessing(false);
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                Xu ly hoan tien
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Reject Dialog ===== */}
      <ConfirmDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={async () => {
          if (!rejectReason.trim()) return;
          setIsProcessing(true);
          await reject(rejectReason.trim());
          setIsProcessing(false);
          setShowRejectDialog(false);
          setRejectReason('');
        }}
        title="Tu choi yeu cau doi tra"
        description=""
        variant="destructive"
        confirmDisabled={!rejectReason.trim()}
      >
        <div className="mt-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ly do tu choi <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Nhap ly do tu choi..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none resize-none"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
```

---

## 7. PaymentReconciliation - Doi soat thanh toan

> File: `apps/fe/src/components/admin/orders/payment-reconciliation.tsx`
> Section hien thi danh sach don hang chuyen khoan cho xac nhan.
> Co the embed trong OrdersListPage hoac trang rieng.

```tsx
// ============================================================
// apps/fe/src/components/admin/orders/payment-reconciliation.tsx
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CreditCard,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PendingPaymentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  createdAt: string;
}

export function PaymentReconciliation() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PendingPaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);

  // ----- Fetch -----
  const fetchPendingPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<PendingPaymentOrder[]>(
        '/api/admin/orders/pending-payments'
      );
      setOrders(res.data);
    } catch {
      toast({
        title: 'Loi',
        description: 'Khong the tai danh sach doi soat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  // ----- Confirm single -----
  const confirmPayment = useCallback(
    async (orderId: string) => {
      try {
        await apiClient.patch(`/api/admin/orders/${orderId}/confirm-payment`);
        toast({ title: 'Thanh cong', description: 'Da xac nhan thanh toan' });
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      } catch {
        toast({
          title: 'Loi',
          description: 'Xac nhan that bai',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // ----- Confirm bulk -----
  const confirmBulk = useCallback(async () => {
    setIsBulkConfirming(true);
    try {
      await apiClient.patch('/api/admin/orders/bulk-confirm-payment', {
        orderIds: Array.from(selectedIds),
      });
      toast({
        title: 'Thanh cong',
        description: `Da xac nhan ${selectedIds.size} don hang`,
      });
      setSelectedIds(new Set());
      fetchPendingPayments();
    } catch {
      toast({
        title: 'Loi',
        description: 'Xac nhan hang loat that bai',
        variant: 'destructive',
      });
    } finally {
      setIsBulkConfirming(false);
    }
  }, [selectedIds, fetchPendingPayments, toast]);

  // ----- Toggle select -----
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o._id)));
    }
  }, [selectedIds.size, orders]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">
            Doi soat thanh toan chuyen khoan
          </h3>
          {orders.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {orders.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={confirmBulk}
              disabled={isBulkConfirming}
              className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {isBulkConfirming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Xac nhan {selectedIds.size} don
            </button>
          )}
          <button
            onClick={fetchPendingPayments}
            disabled={isLoading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <RefreshCw
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-300 mb-2" />
          <p className="text-sm text-gray-400">
            Khong co don hang nao can doi soat
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === orders.length && orders.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Ma don
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Khach hang
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  So tien
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-gray-500">
                  Ngay dat
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">
                  Thao tac
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className={cn(
                    'hover:bg-gray-50/50 transition-colors',
                    selectedIds.has(order._id) && 'bg-primary-50/30'
                  )}
                >
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order._id)}
                      onChange={() => toggleSelect(order._id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {order.total.toLocaleString('vi-VN')}d
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-xs text-gray-500">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setConfirmingId(order._id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Xac nhan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Canh bao */}
      {orders.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 bg-amber-50/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Vui long kiem tra so du tai khoan ngan hang truoc khi xac nhan.
              Hanh dong nay se cap nhat trang thai thanh toan cua don hang.
            </p>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmingId !== null}
        onClose={() => setConfirmingId(null)}
        onConfirm={() => {
          if (confirmingId) {
            confirmPayment(confirmingId);
            setConfirmingId(null);
          }
        }}
        title="Xac nhan da nhan tien"
        description={`Ban co chac da nhan duoc chuyen khoan tu khach hang cho don hang nay?`}
      />
    </div>
  );
}
```

### 7.1 Tich hop PaymentReconciliation vao trang Orders hoac trang rieng

```tsx
// ============================================================
// Cach 1: Embed trong OrdersListPage (them section ben tren DataTable)
// ============================================================
// Trong app/(admin)/orders/page.tsx, them:
//
// import { PaymentReconciliation } from '@/components/admin/orders/payment-reconciliation';
//
// ...
// {/* Hien thi khi tab "Tat ca" hoac khong co filter */}
// {!filters.status && (
//   <PaymentReconciliation />
// )}
// ...

// ============================================================
// Cach 2: Trang rieng app/(admin)/payments/page.tsx
// ============================================================
// 'use client';
//
// import { PaymentReconciliation } from '@/components/admin/orders/payment-reconciliation';
//
// export default function PaymentsPage() {
//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold text-gray-900">Doi soat thanh toan</h1>
//       <PaymentReconciliation />
//     </div>
//   );
// }
```

---

## 8. Responsive Behavior Summary

| Component | Desktop (>= 1024px) | Tablet (768-1023px) | Mobile (< 768px) |
|-----------|---------------------|---------------------|-------------------|
| Orders List | Bang day du 9 cot | An cot PTTT, Ngay | An cot PTTT, Thanh toan, Ngay, SP |
| Status Tabs | 1 hang, scroll khong can | Scroll ngang | Scroll ngang |
| Filters | 1 hang ngang | 2 hang | Stack doc |
| Date Range | 2 input canh nhau | 2 input canh nhau | Stack doc |
| Order Detail | 2/3 + 1/3 grid | 1 cot stack | 1 cot stack |
| Items Table | Day du 4 cot | Day du | Day du (scroll ngang) |
| Shipper Modal | 480px dialog | 480px dialog | Full width |
| Returns List | Bang day du 8 cot | An cot SP, Ngay | An cot KH, SP, Ngay |
| Return Detail | 2/3 + 1/3 grid | 1 cot stack | 1 cot stack |
| Customer Images | 5 anh/hang | 4 anh/hang | 3 anh/hang |
| Payment Reconciliation | Bang day du | An cot Ngay | An cot Ngay |
| Bulk Confirm | Button trong header | Button trong header | Button nho hon |
