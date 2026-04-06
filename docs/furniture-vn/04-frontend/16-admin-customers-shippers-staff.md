# ADMIN - KHACH HANG, SHIPPER & NHAN VIEN

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/admin/customers/`, `apps/fe/src/app/admin/shippers/`, `apps/fe/src/app/admin/staff/`
> Quan ly khach hang, shipper (ban do real-time), nhan vien noi bo
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + React Query + Leaflet + Socket.IO
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [CustomersListPage - Danh sach khach hang](#1-customerslistpage---danh-sach-khach-hang)
2. [CustomerDetailPage - Chi tiet khach hang](#2-customerdetailpage---chi-tiet-khach-hang)
3. [ShippersListPage - Danh sach shipper](#3-shipperslistpage---danh-sach-shipper)
4. [ShipperMapPage - Ban do shipper real-time](#4-shippermappage---ban-do-shipper-real-time)
5. [StaffManagementPage - Quan ly nhan vien](#5-staffmanagementpage---quan-ly-nhan-vien)

---

## 1. CustomersListPage - Danh sach khach hang

> File: `apps/fe/src/app/admin/customers/page.tsx`
> Danh sach tat ca khach hang, tim kiem, sap xep, them khach hang (POS), xuat Excel.
> Su dung DataTable shared component voi server-side pagination.

### 1.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  KHACH HANG                                                   |
|  [Tim kiem: ten/SDT/email...]   [Sap xep ▼]   [Xuat Excel]  |
|  [+ Them khach hang]                                          |
+--------------------------------------------------------------+
|  #  | Ho ten    | SDT        | Email         | Don hang |     |
|     |           |            |               | (tong)   |     |
+-----+-----------+------------+---------------+----------+     |
|  1  | Nguyen A  | 0901234567 | a@gmail.com   | 12       |     |
|     |           |            |               |          |     |
|     | Tong chi: 45.600.000d  | Diem: 456     | 02/04/26 | ... |
+-----+-----------+------------+---------------+----------+-----+
|  [< 1 2 3 ... 10 >]          Hien thi 1-20 / 198             |
+--------------------------------------------------------------+

Mobile:
+------------------------------+
|  KHACH HANG                  |
|  [Tim kiem...]  [+ Them]     |
|  [Sap xep ▼]   [Xuat Excel] |
+------------------------------+
|  Card: Nguyen Van A          |
|  0901234567 | a@gmail.com    |
|  12 don | 45.600.000d        |
|  Diem: 456 | 02/04/26        |
|  [Xem chi tiet]              |
+------------------------------+
|  Card: Tran Thi B            |
|  ...                         |
+------------------------------+
```

### 1.2 Sort Options Config

```typescript
// apps/fe/src/app/admin/customers/constants.ts
export const CUSTOMER_SORT_OPTIONS = [
  { label: 'Ten A-Z', value: 'fullName:asc' },
  { label: 'Ten Z-A', value: 'fullName:desc' },
  { label: 'Tong chi: Cao → Thap', value: 'totalSpent:desc' },
  { label: 'Tong chi: Thap → Cao', value: 'totalSpent:asc' },
  { label: 'So don hang: Nhieu → It', value: 'totalOrders:desc' },
  { label: 'So don hang: It → Nhieu', value: 'totalOrders:asc' },
  { label: 'Don hang gan nhat', value: 'lastOrderDate:desc' },
  { label: 'Don hang cu nhat', value: 'lastOrderDate:asc' },
] as const;
```

### 1.3 React Query Hook

```typescript
// apps/fe/src/hooks/use-customers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerListParams } from '@/services/customer.service';
import { toast } from 'sonner';

// ----- Danh sach khach hang (phan trang) -----
export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getAll(params),
    select: (res) => ({
      customers: res.data.data,
      meta: res.data.meta,
    }),
    keepPreviousData: true,
  });
}

// ----- Them khach hang moi (tu POS hoac admin) -----
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      toast.success('Them khach hang thanh cong');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Loi khi them khach hang');
    },
  });
}

// ----- Xuat Excel -----
export function useExportCustomers() {
  return useMutation({
    mutationFn: (params: { fromDate: string; toDate: string }) =>
      reportService.exportExcel('customers', params),
    onSuccess: (res) => {
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `khach-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Xuat file Excel thanh cong');
    },
    onError: () => {
      toast.error('Loi khi xuat file Excel');
    },
  });
}
```

### 1.4 Column Definitions

```typescript
// apps/fe/src/app/admin/customers/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { MoreHorizontal, Eye, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

// Interface mo rong cho customer list (backend populate them stats)
interface CustomerRow extends User {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export const customerColumns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: 'fullName',
    header: 'Ho ten',
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="hidden sm:block h-9 w-9 rounded-full bg-primary-100
                          flex items-center justify-center text-primary-700
                          font-semibold text-sm shrink-0">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.fullName}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              customer.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/customers/${customer.id}`}
              className="font-medium text-gray-900 hover:text-primary-600
                         transition-colors truncate block"
            >
              {customer.fullName}
            </Link>
            {/* SDT + Email tren mobile */}
            <div className="sm:hidden text-xs text-gray-500 mt-0.5">
              {customer.phone}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'phone',
    header: 'So dien thoai',
    cell: ({ row }) => (
      <a
        href={`tel:${row.original.phone}`}
        className="text-sm text-gray-600 hover:text-primary-600
                   flex items-center gap-1"
      >
        <Phone className="h-3.5 w-3.5" />
        {row.original.phone}
      </a>
    ),
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <a
        href={`mailto:${row.original.email}`}
        className="text-sm text-gray-600 hover:text-primary-600
                   flex items-center gap-1 truncate max-w-[180px]"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{row.original.email}</span>
      </a>
    ),
    meta: { className: 'hidden md:table-cell' },
  },
  {
    accessorKey: 'totalOrders',
    header: 'Don hang',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-medium">
        {row.original.totalOrders}
      </Badge>
    ),
  },
  {
    accessorKey: 'totalSpent',
    header: 'Tong chi tieu',
    cell: ({ row }) => (
      <span className="font-semibold text-primary-700">
        {formatCurrency(row.original.totalSpent)}
      </span>
    ),
    meta: { className: 'hidden lg:table-cell' },
  },
  {
    accessorKey: 'loyaltyPoints',
    header: 'Diem',
    cell: ({ row }) => (
      <span className="text-sm text-amber-600 font-medium">
        {row.original.loyaltyPoints.toLocaleString('vi-VN')}
      </span>
    ),
    meta: { className: 'hidden lg:table-cell' },
  },
  {
    accessorKey: 'lastOrderDate',
    header: 'Don gan nhat',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {row.original.lastOrderDate
          ? formatDate(row.original.lastOrderDate)
          : '—'}
      </span>
    ),
    meta: { className: 'hidden xl:table-cell' },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/customers/${customer.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiet
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

### 1.5 CreateCustomerDialog

```typescript
// apps/fe/src/app/admin/customers/CreateCustomerDialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, UserPlus } from 'lucide-react';
import { useCreateCustomer } from '@/hooks/use-customers';

// ----- Validation schema -----
// Phone bat buoc (POS chi can SDT), name optional
const createCustomerSchema = z.object({
  phone: z
    .string()
    .min(1, 'So dien thoai bat buoc')
    .regex(/^(0|\+84)\d{9}$/, 'So dien thoai khong hop le (VD: 0901234567)'),
  fullName: z.string().optional(),
  email: z
    .string()
    .email('Email khong hop le')
    .optional()
    .or(z.literal('')),
});

type CreateCustomerForm = z.infer<typeof createCustomerSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCustomerDialog({ open, onOpenChange }: Props) {
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerForm>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      phone: '',
      fullName: '',
      email: '',
    },
  });

  const onSubmit = (data: CreateCustomerForm) => {
    createCustomer.mutate(
      {
        name: data.fullName || `KH-${data.phone.slice(-4)}`,
        phone: data.phone,
        email: data.email || '',
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary-600" />
            Them khach hang moi
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* So dien thoai (bat buoc) */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              So dien thoai <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="0901234567"
              {...register('phone')}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Ho ten (tuy chon) */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Ho ten (tuy chon)</Label>
            <Input
              id="fullName"
              placeholder="Nguyen Van A"
              {...register('fullName')}
            />
          </div>

          {/* Email (tuy chon) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (tuy chon)</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Them khach hang
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 1.6 CustomersListPage

```typescript
// apps/fe/src/app/admin/customers/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { UserPlus, Download } from 'lucide-react';
import { useCustomers, useExportCustomers } from '@/hooks/use-customers';
import { customerColumns } from './columns';
import { CUSTOMER_SORT_OPTIONS } from './constants';
import { CreateCustomerDialog } from './CreateCustomerDialog';
import { useDebounce } from '@/hooks/use-debounce';

export default function CustomersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ----- State -----
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'fullName:asc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // ----- Query -----
  const { data, isLoading } = useCustomers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    sort,
  });

  const exportCustomers = useExportCustomers();

  // ----- Handlers -----
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    exportCustomers.mutate({ fromDate: '2020-01-01', toDate: today });
  };

  // ----- Toolbar -----
  const toolbar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center
                    gap-3 w-full">
      {/* Sort */}
      <Select value={sort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="Sap xep theo..." />
        </SelectTrigger>
        <SelectContent>
          {CUSTOMER_SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportCustomers.isPending}
          className="flex-1 sm:flex-none"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Xuat Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex-1 sm:flex-none"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Them khach hang</span>
          <span className="sm:hidden">Them</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Khach hang</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quan ly danh sach khach hang, xem chi tiet, them moi tu POS.
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={customerColumns}
        data={data?.customers || []}
        isLoading={isLoading}
        loadingRows={8}
        enableSearch
        searchPlaceholder="Tim theo ten, SDT, email..."
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        totalCount={data?.meta?.total}
        currentPage={page}
        pageSize={20}
        onPageChange={handlePageChange}
        toolbar={toolbar}
        emptyTitle="Chua co khach hang"
        emptyDescription="He thong chua ghi nhan khach hang nao."
      />

      {/* Dialog them khach hang */}
      <CreateCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
```

---

## 2. CustomerDetailPage - Chi tiet khach hang

> File: `apps/fe/src/app/admin/customers/[id]/page.tsx`
> Xem thong tin chi tiet khach hang: info card, stats, tabs (don hang, dia chi, danh gia, diem tich luy).
> Server-side fetch initial data, client-side tabs.

### 2.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  < Quay lai danh sach                                         |
+--------------------------------------------------------------+
|  [Avatar]  Nguyen Van A                                       |
|            0901234567 | a@gmail.com                            |
|            Thanh vien tu: 15/01/2025                           |
+--------------------------------------------------------------+
|  +------------+ +------------+ +------------+ +------------+  |
|  | Tong don   | | Tong chi   | | TB don hang| | Diem       |  |
|  | 24         | | 89.400.000d| | 3.725.000d | | 894        |  |
|  +------------+ +------------+ +------------+ +------------+  |
+--------------------------------------------------------------+
|  [Don hang]  [Dia chi]  [Danh gia]  [Diem tich luy]          |
+--------------------------------------------------------------+
|  Tab content...                                               |
+--------------------------------------------------------------+

Mobile:
+------------------------------+
|  < Quay lai                  |
+------------------------------+
|  [Avatar]                    |
|  Nguyen Van A                |
|  0901234567                  |
|  a@gmail.com                 |
|  Tu: 15/01/2025              |
+------------------------------+
|  +----------+ +----------+  |
|  | Tong don  | | Tong chi |  |
|  | 24        | | 89.4tr   |  |
|  +----------+ +----------+  |
|  +----------+ +----------+  |
|  | TB don    | | Diem     |  |
|  | 3.7tr     | | 894      |  |
|  +----------+ +----------+  |
+------------------------------+
|  [Don hang] [Dia chi] [...]  |
+------------------------------+
```

### 2.2 Hooks

```typescript
// apps/fe/src/hooks/use-customer-detail.ts
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { orderService } from '@/services/order.service';
import { reviewService } from '@/services/review.service';

// ----- Chi tiet khach hang -----
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getById(id),
    select: (res) => res.data.data,
    enabled: !!id,
  });
}

// ----- Thong ke khach hang -----
export function useCustomerStats(id: string) {
  return useQuery({
    queryKey: ['customer', id, 'stats'],
    queryFn: () => customerService.getStats(id),
    select: (res) => res.data.data,
    enabled: !!id,
  });
}

// ----- Don hang cua khach hang -----
export function useCustomerOrders(
  customerId: string,
  params: { page?: number; limit?: number; status?: string },
) {
  return useQuery({
    queryKey: ['customer', customerId, 'orders', params],
    queryFn: () =>
      orderService.getAll({ ...params, customerId }),
    select: (res) => ({
      orders: res.data.data,
      meta: res.data.meta,
    }),
    enabled: !!customerId,
    keepPreviousData: true,
  });
}

// ----- Danh gia cua khach hang -----
export function useCustomerReviews(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'reviews'],
    queryFn: () =>
      reviewService.getByCustomer(customerId),
    select: (res) => res.data.data,
    enabled: !!customerId,
  });
}

// ----- Lich su diem tich luy -----
export function useCustomerLoyalty(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'loyalty'],
    queryFn: () =>
      customerService.getLoyaltyHistory(customerId),
    select: (res) => res.data.data,
    enabled: !!customerId,
  });
}
```

### 2.3 CustomerInfoCard

```typescript
// apps/fe/src/app/admin/customers/[id]/CustomerInfoCard.tsx
'use client';

import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import { Phone, Mail, Calendar } from 'lucide-react';

interface Props {
  customer: User;
}

export function CustomerInfoCard({ customer }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Avatar */}
        <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center
                        justify-center text-primary-700 text-2xl font-bold
                        shrink-0 overflow-hidden">
          {customer.avatar ? (
            <img
              src={customer.avatar}
              alt={customer.fullName}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            customer.fullName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="text-center sm:text-left space-y-2">
          <h2 className="text-xl font-bold text-gray-900">
            {customer.fullName}
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2
                          sm:gap-4 text-sm text-gray-600">
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex items-center gap-1.5 hover:text-primary-600
                         transition-colors"
            >
              <Phone className="h-4 w-4" />
              {customer.phone}
            </a>

            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1.5 hover:text-primary-600
                           transition-colors"
              >
                <Mail className="h-4 w-4" />
                {customer.email}
              </a>
            )}

            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <Calendar className="h-4 w-4" />
              Thanh vien tu: {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2.4 CustomerStatsCards

```typescript
// apps/fe/src/app/admin/customers/[id]/CustomerStatsCards.tsx
'use client';

import { CustomerStats } from '@/services/customer.service';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Wallet, TrendingUp, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  stats: CustomerStats | undefined;
  loyaltyPoints: number;
  isLoading: boolean;
}

const STAT_CARDS = [
  {
    key: 'totalOrders' as const,
    label: 'Tong don hang',
    icon: ShoppingBag,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    format: (v: number) => v.toLocaleString('vi-VN'),
  },
  {
    key: 'totalSpent' as const,
    label: 'Tong chi tieu',
    icon: Wallet,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'averageOrderValue' as const,
    label: 'Gia tri TB / don',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    format: (v: number) => formatCurrency(v),
  },
];

export function CustomerStatsCards({ stats, loyaltyPoints, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats?.[card.key] ?? 0;
        return (
          <div
            key={card.key}
            className="bg-white rounded-xl border border-gray-200 p-4
                       hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{card.label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {card.format(value)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Diem tich luy */}
      <div className="bg-white rounded-xl border border-gray-200 p-4
                      hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">Diem tich luy</p>
            <p className="text-lg font-bold text-amber-600 truncate">
              {loyaltyPoints.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2.5 Customer Tabs

```typescript
// apps/fe/src/app/admin/customers/[id]/CustomerTabs.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { CustomerOrdersTab } from './tabs/CustomerOrdersTab';
import { CustomerAddressesTab } from './tabs/CustomerAddressesTab';
import { CustomerReviewsTab } from './tabs/CustomerReviewsTab';
import { CustomerLoyaltyTab } from './tabs/CustomerLoyaltyTab';
import { ShoppingBag, MapPin, Star, Gift } from 'lucide-react';

interface Props {
  customerId: string;
}

const TABS = [
  { value: 'orders', label: 'Don hang', icon: ShoppingBag },
  { value: 'addresses', label: 'Dia chi', icon: MapPin },
  { value: 'reviews', label: 'Danh gia', icon: Star },
  { value: 'loyalty', label: 'Diem tich luy', icon: Gift },
] as const;

export function CustomerTabs({ customerId }: Props) {
  const [activeTab, setActiveTab] = useState<string>('orders');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full justify-start border-b bg-transparent
                           rounded-none p-0 h-auto overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 px-4 py-3
                         rounded-none border-b-2 border-transparent
                         data-[state=active]:border-primary-500
                         data-[state=active]:text-primary-700
                         text-gray-500 hover:text-gray-700
                         transition-colors whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="orders" className="mt-4">
        <CustomerOrdersTab customerId={customerId} />
      </TabsContent>

      <TabsContent value="addresses" className="mt-4">
        <CustomerAddressesTab customerId={customerId} />
      </TabsContent>

      <TabsContent value="reviews" className="mt-4">
        <CustomerReviewsTab customerId={customerId} />
      </TabsContent>

      <TabsContent value="loyalty" className="mt-4">
        <CustomerLoyaltyTab customerId={customerId} />
      </TabsContent>
    </Tabs>
  );
}
```

### 2.6 CustomerOrdersTab

```typescript
// apps/fe/src/app/admin/customers/[id]/tabs/CustomerOrdersTab.tsx
'use client';

import { useState } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { useCustomerOrders } from '@/hooks/use-customer-detail';
import { Badge } from '@/components/ui/Badge';
import { ORDER_STATUS_MAP } from '@/lib/orderStatus';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OrderRow {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  itemsCount: number;
}

const orderColumns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Ma don',
    cell: ({ row }) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="font-medium text-primary-600 hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'itemsCount',
    header: 'SP',
    cell: ({ row }) => (
      <span className="text-sm">{row.original.itemsCount} san pham</span>
    ),
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Tong tien',
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.original.totalAmount)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Trang thai',
    cell: ({ row }) => {
      const config = ORDER_STATUS_MAP[row.original.status as keyof typeof ORDER_STATUS_MAP];
      return config ? (
        <Badge className={`${config.bgColor} ${config.color} border-0`}>
          {config.label}
        </Badge>
      ) : (
        <Badge variant="outline">{row.original.status}</Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngay dat',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {formatDate(row.original.createdAt)}
      </span>
    ),
    meta: { className: 'hidden md:table-cell' },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/admin/orders/${row.original.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
    ),
  },
];

interface Props {
  customerId: string;
}

export function CustomerOrdersTab({ customerId }: Props) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCustomerOrders(customerId, {
    page,
    limit: 10,
  });

  return (
    <DataTable
      columns={orderColumns}
      data={data?.orders || []}
      isLoading={isLoading}
      loadingRows={5}
      totalCount={data?.meta?.total}
      currentPage={page}
      pageSize={10}
      onPageChange={setPage}
      emptyTitle="Chua co don hang"
      emptyDescription="Khach hang chua dat don hang nao."
    />
  );
}
```

### 2.7 CustomerAddressesTab

```typescript
// apps/fe/src/app/admin/customers/[id]/tabs/CustomerAddressesTab.tsx
'use client';

import { Address, User } from '@/types';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface Props {
  customerId: string;
}

export function CustomerAddressesTab({ customerId }: Props) {
  const { data: customer, isLoading } = useCustomerDetail(customerId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const addresses = customer?.addresses || [];

  if (addresses.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="h-12 w-12 text-gray-300" />}
        title="Chua co dia chi"
        description="Khach hang chua luu dia chi giao hang nao."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {addresses.map((addr: Address, index: number) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 p-4
                     hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <MapPin className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    {addr.fullName}
                  </span>
                  <span className="text-sm text-gray-500">{addr.phone}</span>
                  {addr.isDefault && (
                    <Badge className="bg-primary-100 text-primary-700 border-0
                                      text-xs">
                      Mac dinh
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>
            </div>

            {/* Actions (chi xem, khong sua/xoa tu admin) */}
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2.8 CustomerReviewsTab

```typescript
// apps/fe/src/app/admin/customers/[id]/tabs/CustomerReviewsTab.tsx
'use client';

import { useCustomerReviews } from '@/hooks/use-customer-detail';
import { Review } from '@/types';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Cho duyet', className: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Da duyet', className: 'bg-green-50 text-green-700' },
  REJECTED: { label: 'Tu choi', className: 'bg-red-50 text-red-700' },
};

interface Props {
  customerId: string;
}

export function CustomerReviewsTab({ customerId }: Props) {
  const { data: reviews, isLoading } = useCustomerReviews(customerId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star className="h-12 w-12 text-gray-300" />}
        title="Chua co danh gia"
        description="Khach hang chua viet danh gia san pham nao."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review: Review) => {
        const statusConfig = STATUS_MAP[review.status] || STATUS_MAP.PENDING;
        return (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-gray-200 p-4
                       hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Rating stars */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className={`${statusConfig.className} border-0 text-xs`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Title + comment */}
                {review.title && (
                  <p className="font-medium text-gray-900 mt-1.5">
                    {review.title}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {review.comment}
                </p>

                {/* Images */}
                {review.images.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {review.images.slice(0, 3).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Review image ${i + 1}`}
                        className="h-12 w-12 rounded-lg object-cover border
                                   border-gray-200"
                      />
                    ))}
                    {review.images.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{review.images.length - 3} anh
                      </span>
                    )}
                  </div>
                )}

                {/* Date */}
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(review.createdAt)}
                </p>
              </div>

              {/* Link to product */}
              <Link
                href={`/admin/products/${review.productId}`}
                className="text-xs text-primary-600 hover:underline shrink-0"
              >
                Xem SP
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 2.9 CustomerLoyaltyTab

```typescript
// apps/fe/src/app/admin/customers/[id]/tabs/CustomerLoyaltyTab.tsx
'use client';

import { useCustomerLoyalty } from '@/hooks/use-customer-detail';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Gift, ArrowUp, ArrowDown, ShoppingBag, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface LoyaltyEntry {
  id: string;
  type: 'earn' | 'spend' | 'refund';
  points: number;
  description: string;
  orderId?: string;
  orderNumber?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  earn: {
    label: 'Tich diem',
    icon: ArrowUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  spend: {
    label: 'Su dung',
    icon: ArrowDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  refund: {
    label: 'Hoan diem',
    icon: RotateCcw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
};

interface Props {
  customerId: string;
}

export function CustomerLoyaltyTab({ customerId }: Props) {
  const { data: entries, isLoading } = useCustomerLoyalty(customerId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={<Gift className="h-12 w-12 text-gray-300" />}
        title="Chua co lich su diem"
        description="Khach hang chua co giao dich diem tich luy nao."
      />
    );
  }

  return (
    <div className="space-y-2">
      {(entries as LoyaltyEntry[]).map((entry) => {
        const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.earn;
        const Icon = config.icon;
        return (
          <div
            key={entry.id}
            className="flex items-center gap-3 bg-white rounded-xl border
                       border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className={`p-2 rounded-lg ${config.bgColor} shrink-0`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {entry.description}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  {formatDate(entry.createdAt)}
                </span>
                {entry.orderNumber && (
                  <span className="text-xs text-gray-400">
                    | Don #{entry.orderNumber}
                  </span>
                )}
              </div>
            </div>

            <div className={`font-bold text-sm ${config.color} shrink-0`}>
              {entry.type === 'spend' ? '-' : '+'}
              {entry.points.toLocaleString('vi-VN')} diem
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 2.10 CustomerDetailPage (main)

```typescript
// apps/fe/src/app/admin/customers/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCustomerDetail, useCustomerStats } from '@/hooks/use-customer-detail';
import { CustomerInfoCard } from './CustomerInfoCard';
import { CustomerStatsCards } from './CustomerStatsCards';
import { CustomerTabs } from './CustomerTabs';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: customer, isLoading: loadingCustomer } = useCustomerDetail(id);
  const { data: stats, isLoading: loadingStats } = useCustomerStats(id);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/customers')}
        className="text-gray-600 hover:text-gray-900 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Quay lai danh sach
      </Button>

      {/* Customer info card */}
      {loadingCustomer ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : customer ? (
        <CustomerInfoCard customer={customer} />
      ) : (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          Khong tim thay khach hang voi ID: {id}
        </div>
      )}

      {/* Stats cards */}
      <CustomerStatsCards
        stats={stats}
        loyaltyPoints={customer?.loyaltyPoints ?? 0}
        isLoading={loadingStats || loadingCustomer}
      />

      {/* Tabs */}
      {customer && <CustomerTabs customerId={id} />}
    </div>
  );
}
```

---

## 3. ShippersListPage - Danh sach shipper

> File: `apps/fe/src/app/admin/shippers/page.tsx`
> Danh sach shipper voi loc theo trang thai, xem ban do, activate/deactivate.
> Su dung DataTable voi status filter tabs.

### 3.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  SHIPPER                                       [Xem ban do]  |
+--------------------------------------------------------------+
|  [Tat ca (15)] [San sang (8)] [Ban (5)] [Offline (2)]        |
+--------------------------------------------------------------+
|  #  | Ho ten    | SDT        | Xe    | Trang thai | Don      |
|     |           |            |       |            | dang giao|
+-----+-----------+------------+-------+------------+----------+
|  1  | Tran B    | 0912345678 | Xe may| [San sang] | 0        |
|  2  | Le C      | 0923456789 | Xe may| [Dang giao]| 2        |
+-----+-----------+------------+-------+------------+----------+

Mobile:
+------------------------------+
|  SHIPPER         [Ban do]    |
+------------------------------+
|  [Tat ca] [San sang] [Ban]   |
+------------------------------+
|  Card: Tran Van B            |
|  0912345678 | Xe may         |
|  [San sang]  2 don da giao   |
|  [Xem] [Tat hoat dong]      |
+------------------------------+
```

### 3.2 Shipper Status Config

```typescript
// apps/fe/src/app/admin/shippers/constants.ts
import { ShipperStatus } from '@/types';

export const SHIPPER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  available: {
    label: 'San sang',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
  },
  busy: {
    label: 'Dang giao',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    dotColor: 'bg-amber-500',
  },
  offline: {
    label: 'Offline',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
  },
};

export const SHIPPER_FILTER_TABS = [
  { value: 'all', label: 'Tat ca' },
  { value: 'available', label: 'San sang' },
  { value: 'busy', label: 'Dang giao' },
  { value: 'offline', label: 'Offline' },
] as const;
```

### 3.3 Hooks

```typescript
// apps/fe/src/hooks/use-shippers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipperService, ShipperLocation } from '@/services/shipper.service';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';

// ----- Danh sach shipper (admin) -----
export function useShippers() {
  return useQuery({
    queryKey: ['admin', 'shippers'],
    queryFn: () => shipperService.getAll(),
    select: (res) => res.data.data,
    refetchInterval: 30000, // Cap nhat moi 30s
  });
}

// ----- Vi tri shipper (cho ban do) -----
export function useShipperLocations() {
  return useQuery({
    queryKey: ['admin', 'shippers', 'locations'],
    queryFn: () => shipperService.getLocations(),
    select: (res) => res.data.data as ShipperLocation[],
    refetchInterval: 10000, // Cap nhat moi 10s
  });
}

// ----- Activate / Deactivate shipper -----
export function useToggleShipperActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => userService.update(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(
        isActive ? 'Da kich hoat shipper' : 'Da vo hieu hoa shipper',
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'shippers'] });
    },
    onError: () => {
      toast.error('Loi khi cap nhat trang thai shipper');
    },
  });
}
```

### 3.4 Column Definitions

```typescript
// apps/fe/src/app/admin/shippers/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  MoreHorizontal,
  Eye,
  Power,
  PowerOff,
  Phone,
  Bike,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { SHIPPER_STATUS_CONFIG } from './constants';

interface ShipperRow {
  _id: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  status: string;
  isActive: boolean;
  activeOrders: number;
  completedOrders: number;
}

const VEHICLE_ICONS: Record<string, any> = {
  'Xe may': Bike,
  'Xe tai': Truck,
};

export function getShipperColumns(
  onToggleActive: (id: string, isActive: boolean) => void,
): ColumnDef<ShipperRow>[] {
  return [
    {
      accessorKey: 'fullName',
      header: 'Ho ten',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center
                          justify-center text-secondary-700 font-semibold
                          text-sm shrink-0">
            {row.original.fullName.charAt(0).toUpperCase()}
          </div>
          <Link
            href={`/admin/shippers/${row.original._id}`}
            className="font-medium text-gray-900 hover:text-primary-600
                       transition-colors"
          >
            {row.original.fullName}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'SDT',
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.phone}`}
          className="text-sm text-gray-600 hover:text-primary-600
                     flex items-center gap-1"
        >
          <Phone className="h-3.5 w-3.5" />
          {row.original.phone}
        </a>
      ),
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      accessorKey: 'vehicleType',
      header: 'Phuong tien',
      cell: ({ row }) => {
        const VehicleIcon = VEHICLE_ICONS[row.original.vehicleType] || Bike;
        return (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <VehicleIcon className="h-4 w-4" />
            {row.original.vehicleType}
          </div>
        );
      },
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'status',
      header: 'Trang thai',
      cell: ({ row }) => {
        const config = SHIPPER_STATUS_CONFIG[row.original.status];
        if (!config) return <Badge variant="outline">{row.original.status}</Badge>;
        return (
          <Badge className={`${config.bgColor} ${config.color} border-0`}>
            <span className={`h-2 w-2 rounded-full ${config.dotColor} mr-1.5`} />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'activeOrders',
      header: 'Don dang giao',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.activeOrders}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      accessorKey: 'completedOrders',
      header: 'Da hoan thanh',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.completedOrders}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const shipper = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/shippers/${shipper._id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  onToggleActive(shipper._id, !shipper.isActive)
                }
                className={
                  shipper.isActive ? 'text-red-600' : 'text-green-600'
                }
              >
                {shipper.isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Vo hieu hoa
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Kich hoat
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
```

### 3.5 ShippersListPage

```typescript
// apps/fe/src/app/admin/shippers/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Map } from 'lucide-react';
import { useShippers, useToggleShipperActive } from '@/hooks/use-shippers';
import { getShipperColumns } from './columns';
import { SHIPPER_FILTER_TABS } from './constants';

export default function ShippersListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: shippers, isLoading } = useShippers();
  const toggleActive = useToggleShipperActive();

  // ----- Loc theo trang thai -----
  const filteredShippers = useMemo(() => {
    if (!shippers) return [];
    if (statusFilter === 'all') return shippers;
    return shippers.filter((s: any) => s.status === statusFilter);
  }, [shippers, statusFilter]);

  // ----- Dem so luong moi trang thai -----
  const counts = useMemo(() => {
    if (!shippers) return { all: 0, available: 0, busy: 0, offline: 0 };
    return {
      all: shippers.length,
      available: shippers.filter((s: any) => s.status === 'available').length,
      busy: shippers.filter((s: any) => s.status === 'busy').length,
      offline: shippers.filter((s: any) => s.status === 'offline').length,
    };
  }, [shippers]);

  const columns = getShipperColumns((id, isActive) => {
    toggleActive.mutate({ id, isActive });
  });

  // ----- Toolbar: Status tabs -----
  const toolbar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center
                    gap-3 w-full">
      {/* Status filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1
                      overflow-x-auto w-full sm:w-auto">
        {SHIPPER_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md
                       transition-colors whitespace-nowrap
                       ${
                         statusFilter === tab.value
                           ? 'bg-white text-gray-900 shadow-sm'
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-gray-400">
              ({counts[tab.value as keyof typeof counts]})
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Xem ban do */}
      <Button
        variant="outline"
        onClick={() => router.push('/admin/shippers/map')}
        className="w-full sm:w-auto"
      >
        <Map className="h-4 w-4 mr-2" />
        Xem ban do
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipper</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quan ly doi ngu shipper, theo doi trang thai, xem ban do real-time.
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredShippers}
        isLoading={isLoading}
        loadingRows={6}
        toolbar={toolbar}
        emptyTitle="Khong co shipper"
        emptyDescription="Chua co shipper nao trong he thong."
      />
    </div>
  );
}
```

---

## 4. ShipperMapPage - Ban do shipper real-time

> File: `apps/fe/src/app/admin/shippers/map/page.tsx`
> Ban do Leaflet full-page hien thi vi tri shipper real-time.
> Marker mau theo trang thai. Click popup xem chi tiet. Sidebar danh sach.
> Cap nhat vi tri qua Socket.IO (useAdminNotifications).

### 4.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  < Quay lai danh sach shipper              [Auto-fit bounds]  |
+-------------+------------------------------------------------+
|  SIDEBAR    |                                                 |
|  (280px)    |                 LEAFLET MAP                     |
|  ---------  |                                                 |
|  Tim kiem.. |          [Marker: Tran B]                       |
|  ---------  |              [green dot]                        |
|  o Tran B   |                                                 |
|    San sang |         [Marker: Le C]                          |
|  o Le C     |            [yellow dot]                         |
|    Dang giao|                                                 |
|  o Pham D   |                                    [Marker: D]  |
|    Offline  |                                     [gray dot]  |
|             |                                                 |
+-------------+------------------------------------------------+

Mobile:
+------------------------------+
|  < Quay lai    [Ds shipper]  |
+------------------------------+
|                              |
|         LEAFLET MAP          |
|         (full height)        |
|                              |
|    [Markers...]              |
|                              |
+------------------------------+
|  Bottom sheet (keo len):     |
|  o Tran B - San sang         |
|  o Le C - Dang giao          |
+------------------------------+
```

### 4.2 Marker Config

```typescript
// apps/fe/src/app/admin/shippers/map/markerConfig.ts
import L from 'leaflet';

// ----- Mau marker theo trang thai -----
export const MARKER_COLORS: Record<string, string> = {
  available: '#22c55e', // green-500
  busy: '#eab308',      // yellow-500
  offline: '#9ca3af',   // gray-400
};

// ----- Tao custom icon cho Leaflet -----
export function createShipperIcon(status: string): L.DivIcon {
  const color = MARKER_COLORS[status] || MARKER_COLORS.offline;
  return L.divIcon({
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"
             stroke="white" stroke-width="2">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H7v11h2"/>
          <circle cx="7" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `,
    className: 'shipper-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}
```

### 4.3 ShipperMapSidebar

```typescript
// apps/fe/src/app/admin/shippers/map/ShipperMapSidebar.tsx
'use client';

import { useState } from 'react';
import { ShipperLocation } from '@/services/shipper.service';
import { SHIPPER_STATUS_CONFIG } from '../constants';
import { SearchInput } from '@/components/shared/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Phone } from 'lucide-react';

interface Props {
  shippers: ShipperLocation[];
  selectedId: string | null;
  onSelect: (shipper: ShipperLocation) => void;
}

export function ShipperMapSidebar({ shippers, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const filtered = shippers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full lg:w-[280px] bg-white border-r border-gray-200
                    flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">
          Shipper ({shippers.length})
        </h3>
        <SearchInput
          placeholder="Tim shipper..."
          value={search}
          onChange={setSearch}
          className="w-full"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Khong tim thay shipper
          </p>
        ) : (
          filtered.map((shipper) => {
            const config = SHIPPER_STATUS_CONFIG[shipper.status];
            const isSelected = selectedId === shipper.shipperId;
            return (
              <button
                key={shipper.shipperId}
                onClick={() => onSelect(shipper)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100
                           hover:bg-gray-50 transition-colors
                           ${isSelected ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">
                    {shipper.name}
                  </span>
                  {config && (
                    <Badge
                      className={`${config.bgColor} ${config.color} border-0
                                  text-xs`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${config.dotColor}
                                    mr-1`}
                      />
                      {config.label}
                    </Badge>
                  )}
                </div>
                {shipper.currentOrderId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Dang giao don #{shipper.currentOrderId.slice(-6)}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
```

### 4.4 ShipperMapPage

```typescript
// apps/fe/src/app/admin/shippers/map/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useShipperLocations } from '@/hooks/use-shippers';
import { useSocket } from '@/hooks/use-socket';
import { ShipperLocation } from '@/services/shipper.service';
import { ShipperMapSidebar } from './ShipperMapSidebar';
import { createShipperIcon, MARKER_COLORS } from './markerConfig';
import { SHIPPER_STATUS_CONFIG } from '../constants';

// ----- Dynamic import Leaflet (SSR-safe) -----
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false },
);

// ----- Default center: Ho Chi Minh City -----
const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];
const DEFAULT_ZOOM = 12;

export default function ShipperMapPage() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [selectedShipperId, setSelectedShipperId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // ----- Fetch vi tri -----
  const { data: locations, isLoading } = useShipperLocations();

  // ----- Real-time updates qua Socket.IO -----
  const { on, isConnected } = useSocket({ rooms: ['room:admin'] });

  useEffect(() => {
    if (!isConnected) return;

    const offLocation = on(
      'shipper:location_updated',
      (data: {
        shipperId: string;
        latitude: number;
        longitude: number;
        status: string;
      }) => {
        // React Query se tu refetch, day chi la bonus real-time
        // Co the them local state update o day neu can smoother UX
      },
    );

    return () => {
      offLocation();
    };
  }, [isConnected, on]);

  // ----- Click shipper trong sidebar → center ban do -----
  const handleSelectShipper = useCallback(
    (shipper: ShipperLocation) => {
      setSelectedShipperId(shipper.shipperId);
      if (mapRef.current) {
        mapRef.current.flyTo(
          [shipper.latitude, shipper.longitude],
          15,
          { duration: 1 },
        );
      }
    },
    [],
  );

  // ----- Auto-fit bounds -----
  const handleFitBounds = useCallback(() => {
    if (!mapRef.current || !locations || locations.length === 0) return;

    const L = require('leaflet');
    const bounds = L.latLngBounds(
      locations.map((s: ShipperLocation) => [s.latitude, s.longitude]),
    );
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [locations]);

  // Auto-fit khi load xong
  useEffect(() => {
    if (isMapReady && locations && locations.length > 0) {
      handleFitBounds();
    }
  }, [isMapReady, locations, handleFitBounds]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      bg-white border-b border-gray-200 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/shippers')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Quay lai danh sach shipper</span>
          <span className="sm:hidden">Quay lai</span>
        </Button>

        <Button variant="outline" size="sm" onClick={handleFitBounds}>
          <Maximize2 className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Hien thi tat ca</span>
        </Button>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar - desktop: left side, mobile: bottom sheet */}
        <div className="hidden lg:flex">
          <ShipperMapSidebar
            shippers={locations || []}
            selectedId={selectedShipperId}
            onSelect={handleSelectShipper}
          />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              className="w-full h-full z-0"
              ref={mapRef}
              whenReady={() => setIsMapReady(true)}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Markers */}
              {(locations || []).map((shipper: ShipperLocation) => (
                <Marker
                  key={shipper.shipperId}
                  position={[shipper.latitude, shipper.longitude]}
                  icon={createShipperIcon(shipper.status)}
                  eventHandlers={{
                    click: () => setSelectedShipperId(shipper.shipperId),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px] p-1">
                      <p className="font-semibold text-gray-900">
                        {shipper.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              MARKER_COLORS[shipper.status] || '#9ca3af',
                          }}
                        />
                        <span className="text-sm text-gray-600">
                          {SHIPPER_STATUS_CONFIG[shipper.status]?.label ||
                            shipper.status}
                        </span>
                      </div>
                      {shipper.currentOrderId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Don hang: #{shipper.currentOrderId.slice(-6)}
                        </p>
                      )}
                      <a
                        href={`tel:+84${shipper.shipperId}`}
                        className="text-xs text-primary-600 hover:underline
                                   mt-1 block"
                      >
                        Goi dien
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Mobile: Bottom shipper list */}
        <div className="lg:hidden max-h-[200px] overflow-y-auto
                        border-t border-gray-200 bg-white">
          <ShipperMapSidebar
            shippers={locations || []}
            selectedId={selectedShipperId}
            onSelect={handleSelectShipper}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 5. StaffManagementPage - Quan ly nhan vien

> File: `apps/fe/src/app/admin/staff/page.tsx`
> Trang quan ly nhan vien noi bo (manager, staff). Chi admin moi truy cap duoc.
> DataTable voi CRUD, change role, activate/deactivate.

### 5.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  NHAN VIEN                            [+ Them nhan vien]      |
+--------------------------------------------------------------+
|  [Tim kiem: ten, email, SDT...]                               |
+--------------------------------------------------------------+
|  #  | Ho ten    | Email          | SDT        | Vai tro |     |
|     |           |                |            |         |     |
+-----+-----------+----------------+------------+---------+     |
|  1  | Admin     | admin@...      | 0901234567 | Admin   |     |
|     |           | Hoat dong      | 02/04/26   |         | ... |
+-----+-----------+----------------+------------+---------+-----+
|  2  | Nhan vien | nv@...         | 0912345678 | Staff   |     |
|     |           | Hoat dong      | 01/04/26   |         | ... |
+-----+-----------+----------------+------------+---------+-----+

Mobile:
+------------------------------+
|  NHAN VIEN       [+ Them]    |
|  [Tim kiem...]               |
+------------------------------+
|  Card: Admin                 |
|  admin@... | 0901234567      |
|  [Admin] [Hoat dong]        |
|  Dang nhap: 02/04/26         |
|  [Sua] [Doi vai tro]        |
+------------------------------+
```

### 5.2 Staff Role Config

```typescript
// apps/fe/src/app/admin/staff/constants.ts

export const STAFF_ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  admin: {
    label: 'Admin',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  manager: {
    label: 'Quan ly',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
  },
  staff: {
    label: 'Nhan vien',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
};

export const STAFF_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: {
    label: 'Hoat dong',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  inactive: {
    label: 'Ngung hoat dong',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
};

export const ROLE_OPTIONS = [
  { value: 'manager', label: 'Quan ly' },
  { value: 'staff', label: 'Nhan vien' },
] as const;
```

### 5.3 Hooks

```typescript
// apps/fe/src/hooks/use-staff.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserListParams, CreateUserDto } from '@/services/user.service';
import { toast } from 'sonner';

// ----- Danh sach nhan vien -----
export function useStaffList(params?: UserListParams) {
  return useQuery({
    queryKey: ['admin', 'staff', params],
    queryFn: () =>
      userService.getAll({
        ...params,
        role: 'staff,manager',
      }),
    select: (res) => ({
      staff: res.data.data,
      meta: res.data.meta,
    }),
    keepPreviousData: true,
  });
}

// ----- Them nhan vien -----
export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => userService.create(dto),
    onSuccess: () => {
      toast.success('Them nhan vien thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Loi khi them nhan vien');
    },
  });
}

// ----- Cap nhat nhan vien -----
export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<any> }) =>
      userService.update(id, dto),
    onSuccess: () => {
      toast.success('Cap nhat thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: () => {
      toast.error('Loi khi cap nhat nhan vien');
    },
  });
}

// ----- Doi vai tro -----
export function useChangeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userService.changeRole(id, role),
    onSuccess: () => {
      toast.success('Doi vai tro thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: () => {
      toast.error('Loi khi doi vai tro');
    },
  });
}

// ----- Xoa nhan vien -----
export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      toast.success('Xoa nhan vien thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: () => {
      toast.error('Loi khi xoa nhan vien');
    },
  });
}
```

### 5.4 CreateStaffDialog

```typescript
// apps/fe/src/app/admin/staff/CreateStaffDialog.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Loader2, UserPlus } from 'lucide-react';
import { useCreateStaff } from '@/hooks/use-staff';
import { ROLE_OPTIONS } from './constants';

// ----- Validation schema -----
const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Ho ten toi thieu 2 ky tu'),
  email: z.string().email('Email khong hop le'),
  phone: z
    .string()
    .regex(/^(0|\+84)\d{9}$/, 'So dien thoai khong hop le')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
  role: z.enum(['manager', 'staff'], {
    required_error: 'Vui long chon vai tro',
  }),
  staffCode: z.string().optional(),
});

type CreateStaffForm = z.infer<typeof createStaffSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStaffDialog({ open, onOpenChange }: Props) {
  const createStaff = useCreateStaff();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'staff',
      staffCode: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = (data: CreateStaffForm) => {
    createStaff.mutate(
      {
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        role: data.role,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary-600" />
            Them nhan vien moi
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 2-col layout tren desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ho ten */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Ho ten <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Nguyen Van A"
                {...register('fullName')}
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Ma nhan vien */}
            <div className="space-y-2">
              <Label htmlFor="staffCode">Ma nhan vien</Label>
              <Input
                id="staffCode"
                placeholder="NV-001"
                {...register('staffCode')}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SDT */}
            <div className="space-y-2">
              <Label htmlFor="phone">So dien thoai</Label>
              <Input
                id="phone"
                placeholder="0901234567"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Mat khau */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Mat khau <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Toi thieu 6 ky tu"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Vai tro */}
          <div className="space-y-2">
            <Label>
              Vai tro <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(v) =>
                setValue('role', v as 'manager' | 'staff')
              }
            >
              <SelectTrigger
                className={errors.role ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Chon vai tro..." />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={createStaff.isPending}>
              {createStaff.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Them nhan vien
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.5 Column Definitions

```typescript
// apps/fe/src/app/admin/staff/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  MoreHorizontal,
  Pencil,
  UserCog,
  Power,
  PowerOff,
  Trash2,
  Mail,
  Phone,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { STAFF_ROLE_CONFIG, STAFF_STATUS_CONFIG } from './constants';

interface StaffRow extends User {
  lastLoginAt?: string;
}

export function getStaffColumns(handlers: {
  onEdit: (staff: StaffRow) => void;
  onChangeRole: (staff: StaffRow) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (staff: StaffRow) => void;
}): ColumnDef<StaffRow>[] {
  return [
    {
      accessorKey: 'fullName',
      header: 'Ho ten',
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center
                            justify-center text-primary-700 font-semibold
                            text-sm shrink-0">
              {staff.avatar ? (
                <img
                  src={staff.avatar}
                  alt={staff.fullName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                staff.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {staff.fullName}
              </p>
              {staff.staffCode && (
                <p className="text-xs text-gray-400">{staff.staffCode}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="text-sm text-gray-600 hover:text-primary-600
                     flex items-center gap-1 truncate max-w-[200px]"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{row.original.email}</span>
        </a>
      ),
      meta: { className: 'hidden sm:table-cell' },
    },
    {
      accessorKey: 'phone',
      header: 'SDT',
      cell: ({ row }) =>
        row.original.phone ? (
          <a
            href={`tel:${row.original.phone}`}
            className="text-sm text-gray-600 hover:text-primary-600
                       flex items-center gap-1"
          >
            <Phone className="h-3.5 w-3.5" />
            {row.original.phone}
          </a>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
      meta: { className: 'hidden md:table-cell' },
    },
    {
      accessorKey: 'role',
      header: 'Vai tro',
      cell: ({ row }) => {
        const config = STAFF_ROLE_CONFIG[row.original.role];
        return config ? (
          <Badge className={`${config.bgColor} ${config.color} border-0`}>
            {config.label}
          </Badge>
        ) : (
          <Badge variant="outline">{row.original.role}</Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Trang thai',
      cell: ({ row }) => {
        const key = row.original.isActive ? 'active' : 'inactive';
        const config = STAFF_STATUS_CONFIG[key];
        return (
          <Badge className={`${config.bgColor} ${config.color} border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'lastLogin',
      header: 'Dang nhap cuoi',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {(row.original as StaffRow).lastLoginAt
            ? formatDate((row.original as StaffRow).lastLoginAt!)
            : '—'}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const staff = row.original as StaffRow;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlers.onEdit(staff)}>
                <Pencil className="h-4 w-4 mr-2" />
                Chinh sua
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlers.onChangeRole(staff)}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Doi vai tro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  handlers.onToggleActive(staff.id, !staff.isActive)
                }
                className={
                  staff.isActive ? 'text-amber-600' : 'text-green-600'
                }
              >
                {staff.isActive ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Ngung hoat dong
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Kich hoat
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handlers.onDelete(staff)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xoa nhan vien
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
```

### 5.6 DeleteConfirmDialog

```typescript
// apps/fe/src/app/admin/staff/DeleteConfirmDialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  staffName,
  onConfirm,
  isPending,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoa nhan vien?</AlertDialogTitle>
          <AlertDialogDescription>
            Ban co chac chan muon xoa nhan vien{' '}
            <strong>{staffName}</strong>? Hanh dong nay khong the hoan tac.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Huy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xoa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 5.7 ChangeRoleDialog

```typescript
// apps/fe/src/app/admin/staff/ChangeRoleDialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Loader2, UserCog } from 'lucide-react';
import { useChangeRole } from '@/hooks/use-staff';
import { ROLE_OPTIONS } from './constants';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  currentRole: string;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  currentRole,
}: Props) {
  const [role, setRole] = useState(currentRole);
  const changeRole = useChangeRole();

  const handleSubmit = () => {
    if (role === currentRole) {
      onOpenChange(false);
      return;
    }
    changeRole.mutate(
      { id: staffId, role },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary-600" />
            Doi vai tro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Doi vai tro cho <strong>{staffName}</strong>
          </p>

          <div className="space-y-2">
            <Label>Vai tro moi</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={changeRole.isPending || role === currentRole}
          >
            {changeRole.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Xac nhan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.8 StaffManagementPage

```typescript
// apps/fe/src/app/admin/staff/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { UserPlus, Shield } from 'lucide-react';
import {
  useStaffList,
  useUpdateStaff,
  useDeleteStaff,
} from '@/hooks/use-staff';
import { getStaffColumns } from './columns';
import { CreateStaffDialog } from './CreateStaffDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ChangeRoleDialog } from './ChangeRoleDialog';
import { useDebounce } from '@/hooks/use-debounce';
import { User } from '@/types';

export default function StaffManagementPage() {
  // ----- State -----
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  // ----- Queries -----
  const { data, isLoading } = useStaffList({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  // ----- Column handlers -----
  const columns = getStaffColumns({
    onEdit: (staff) => {
      // TODO: open edit dialog
    },
    onChangeRole: (staff) => setRoleTarget(staff),
    onToggleActive: (id, isActive) => {
      updateStaff.mutate({ id, dto: { isActive } });
    },
    onDelete: (staff) => setDeleteTarget(staff),
  });

  // ----- Delete confirm -----
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteStaff.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteStaff]);

  // ----- Toolbar -----
  const toolbar = (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1" />
      <Button
        onClick={() => setShowCreateDialog(true)}
        className="shrink-0"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Them nhan vien</span>
        <span className="sm:hidden">Them</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Shield className="h-6 w-6 text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhan vien</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quan ly tai khoan nhan vien va phan quyen. Chi admin moi truy cap
            duoc trang nay.
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.staff || []}
        isLoading={isLoading}
        loadingRows={6}
        enableSearch
        searchPlaceholder="Tim theo ten, email, SDT..."
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        totalCount={data?.meta?.total}
        currentPage={page}
        pageSize={20}
        onPageChange={setPage}
        toolbar={toolbar}
        emptyTitle="Chua co nhan vien"
        emptyDescription="Them nhan vien moi de bat dau."
      />

      {/* Dialogs */}
      <CreateStaffDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        staffName={deleteTarget?.fullName || ''}
        onConfirm={handleConfirmDelete}
        isPending={deleteStaff.isPending}
      />

      {roleTarget && (
        <ChangeRoleDialog
          open={!!roleTarget}
          onOpenChange={(open) => {
            if (!open) setRoleTarget(null);
          }}
          staffId={roleTarget.id}
          staffName={roleTarget.fullName}
          currentRole={roleTarget.role}
        />
      )}
    </div>
  );
}
```

---

## Responsive & Loading Summary

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| CustomersListPage | DataTable day du cot | An cot diem, don gan nhat | Card list, an cot SDT/email |
| CustomerDetailPage | Info + 4 stats + tabs ngang | Giong desktop | Info doc, stats 2x2, tabs icon only |
| ShippersListPage | DataTable + status tabs | An cot active/completed | Card list |
| ShipperMapPage | Sidebar trai + Map | Giong desktop | Map full + bottom sheet |
| StaffManagementPage | DataTable day du | An cot SDT, last login | Card list |

**Loading states:** Tat ca trang deu su dung `Skeleton` component khi `isLoading = true`. DataTable tu dong hien thi `loadingRows` skeleton rows. Empty state hien thi khi data rong voi icon + message phu hop.

**Route protection:** StaffManagementPage nen duoc bao ve boi middleware kiem tra `role === 'admin'` truoc khi cho phep truy cap.
