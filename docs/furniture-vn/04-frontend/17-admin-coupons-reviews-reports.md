# ADMIN - COUPON, DANH GIA & BAO CAO

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/admin/coupons/`, `apps/fe/src/app/admin/reviews/`, `apps/fe/src/app/admin/reports/`
> Quan ly coupon, duyet danh gia, bao cao tong hop voi bieu do Recharts, xuat Excel
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + React Query + Recharts + zod
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [CouponsPage - Quan ly coupon](#1-couponspage---quan-ly-coupon)
2. [CouponFormDialog - Tao/Sua coupon](#2-couponformdialog---taosua-coupon)
3. [CouponUsageDialog - Lich su su dung coupon](#3-couponusagedialog---lich-su-su-dung-coupon)
4. [ReviewModerationPage - Duyet danh gia](#4-reviewmoderationpage---duyet-danh-gia)
5. [ReportsPage - Bao cao tong hop](#5-reportspage---bao-cao-tong-hop)
6. [Excel Export - Xuat bao cao](#6-excel-export---xuat-bao-cao)

---

## 1. CouponsPage - Quan ly coupon

> File: `apps/fe/src/app/admin/coupons/page.tsx`
> Danh sach coupon voi DataTable, loc theo trang thai, them/sua/xoa coupon.
> Su dung couponService tu `services/coupon.service.ts`.

### 1.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  COUPON                                    [+ Them coupon]    |
+--------------------------------------------------------------+
|  [Tat ca] [Dang hoat dong] [Het han] [Ngung]                 |
+--------------------------------------------------------------+
|  Ma     | Mo ta     | Loai | Gia tri | Don TT | Su dung    | |
|         |           |      |         |        | (da/toi da)| |
+--------+-----------+------+---------+--------+------------+--+
| SALE20 | Giam 20%  | %    | 20%     | 500k   | 45/100     |..|
|        |           |      |         |        | 01/04-30/04| |
+--------+-----------+------+---------+--------+------------+--+
| NEWYEAR| Giam 100k | VND  | 100.000 | 1tr    | 120/200    |..|
|        |           |      |         |        | Het han    | |
+--------+-----------+------+---------+--------+------------+--+

Mobile:
+------------------------------+
|  COUPON          [+ Them]    |
|  [Tat ca] [Hoat dong] [...]  |
+------------------------------+
|  Card: SALE20                |
|  Giam 20%, don toi thieu 500k|
|  Su dung: 45/100             |
|  01/04/26 - 30/04/26         |
|  [Hoat dong]                 |
|  [Sua] [Xem su dung] [Xoa]  |
+------------------------------+
```

### 1.2 Coupon Status Config

```typescript
// apps/fe/src/app/admin/coupons/constants.ts
export const COUPON_STATUS_TABS = [
  { value: 'all', label: 'Tat ca' },
  { value: 'active', label: 'Dang hoat dong' },
  { value: 'expired', label: 'Het han' },
  { value: 'inactive', label: 'Ngung' },
] as const;

export function getCouponStatus(coupon: {
  isActive: boolean;
  endDate: string;
}): 'active' | 'expired' | 'inactive' {
  if (!coupon.isActive) return 'inactive';
  if (new Date(coupon.endDate) < new Date()) return 'expired';
  return 'active';
}

export const COUPON_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  active: {
    label: 'Hoat dong',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  expired: {
    label: 'Het han',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  inactive: {
    label: 'Ngung',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
};

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: '%',
  fixed: 'VND',
};

export const SCOPE_LABELS: Record<string, string> = {
  all: 'Tat ca san pham',
  category: 'Theo danh muc',
  product: 'Theo san pham',
};
```

### 1.3 Hooks

```typescript
// apps/fe/src/hooks/use-coupons.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService, Coupon } from '@/services/coupon.service';
import { toast } from 'sonner';

// ----- Danh sach coupons -----
export function useCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => couponService.getAll(),
    select: (res) => res.data.data as Coupon[],
  });
}

// ----- Tao coupon -----
export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<Coupon>) => couponService.create(dto),
    onSuccess: () => {
      toast.success('Tao coupon thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Loi khi tao coupon');
    },
  });
}

// ----- Cap nhat coupon -----
export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Coupon> }) =>
      couponService.update(id, dto),
    onSuccess: () => {
      toast.success('Cap nhat coupon thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: () => {
      toast.error('Loi khi cap nhat coupon');
    },
  });
}

// ----- Xoa coupon -----
export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponService.delete(id),
    onSuccess: () => {
      toast.success('Xoa coupon thanh cong');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: () => {
      toast.error('Loi khi xoa coupon');
    },
  });
}

// ----- Activate / Deactivate -----
export function useToggleCouponActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? couponService.activate(id) : couponService.deactivate(id),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Da kich hoat coupon' : 'Da ngung coupon');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: () => {
      toast.error('Loi khi cap nhat trang thai coupon');
    },
  });
}

// ----- Lich su su dung coupon -----
export function useCouponUsage(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'coupons', id, 'usage'],
    queryFn: () => couponService.getUsage(id!),
    select: (res) => res.data.data,
    enabled: !!id,
  });
}
```

### 1.4 Column Definitions

```typescript
// apps/fe/src/app/admin/coupons/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Coupon } from '@/services/coupon.service';
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
  Eye,
  Power,
  PowerOff,
  Trash2,
  Copy,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getCouponStatus,
  COUPON_STATUS_CONFIG,
  DISCOUNT_TYPE_LABELS,
} from './constants';

export function getCouponColumns(handlers: {
  onEdit: (coupon: Coupon) => void;
  onViewUsage: (coupon: Coupon) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (coupon: Coupon) => void;
}): ColumnDef<Coupon>[] {
  return [
    {
      accessorKey: 'code',
      header: 'Ma coupon',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-primary-700 bg-primary-50
                           px-2 py-0.5 rounded text-sm">
            {row.original.code}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(row.original.code);
              toast.success('Da sao chep ma coupon');
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Sao chep"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Mo ta',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">
          {row.original.description || '—'}
        </span>
      ),
      meta: { className: 'hidden md:table-cell' },
    },
    {
      id: 'discount',
      header: 'Giam gia',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="text-sm">
            <span className="font-semibold text-gray-900">
              {c.discountType === 'percentage'
                ? `${c.discountValue}%`
                : formatCurrency(c.discountValue)}
            </span>
            <span className="text-gray-400 ml-1">
              ({DISCOUNT_TYPE_LABELS[c.discountType]})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'minOrderAmount',
      header: 'Don toi thieu',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.minOrderAmount
            ? formatCurrency(row.original.minOrderAmount)
            : '—'}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell' },
    },
    {
      id: 'usage',
      header: 'Su dung',
      cell: ({ row }) => {
        const c = row.original;
        const max = c.usageLimit ?? Infinity;
        const pct = max === Infinity ? 0 : (c.usageCount / max) * 100;
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium">
              {c.usageCount}
              {c.usageLimit ? `/${c.usageLimit}` : ''}
            </span>
            {c.usageLimit && (
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Trang thai',
      cell: ({ row }) => {
        const status = getCouponStatus(row.original);
        const config = COUPON_STATUS_CONFIG[status];
        return (
          <Badge className={`${config.bgColor} ${config.color} border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'dateRange',
      header: 'Thoi gian',
      cell: ({ row }) => (
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>{formatDate(row.original.startDate)}</div>
          <div>{formatDate(row.original.endDate)}</div>
        </div>
      ),
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const coupon = row.original;
        const status = getCouponStatus(coupon);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlers.onEdit(coupon)}>
                <Pencil className="h-4 w-4 mr-2" />
                Chinh sua
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlers.onViewUsage(coupon)}>
                <Eye className="h-4 w-4 mr-2" />
                Xem su dung
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {status !== 'expired' && (
                <DropdownMenuItem
                  onClick={() =>
                    handlers.onToggleActive(
                      coupon._id,
                      status === 'inactive',
                    )
                  }
                  className={
                    coupon.isActive ? 'text-amber-600' : 'text-green-600'
                  }
                >
                  {coupon.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Ngung coupon
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Kich hoat
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handlers.onDelete(coupon)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xoa coupon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
```

### 1.5 CouponsPage

```typescript
// apps/fe/src/app/admin/coupons/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Ticket, Plus } from 'lucide-react';
import {
  useCoupons,
  useToggleCouponActive,
  useDeleteCoupon,
} from '@/hooks/use-coupons';
import { getCouponColumns } from './columns';
import { CouponFormDialog } from './CouponFormDialog';
import { CouponUsageDialog } from './CouponUsageDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { COUPON_STATUS_TABS, getCouponStatus } from './constants';
import { Coupon } from '@/services/coupon.service';

export default function CouponsPage() {
  // ----- State -----
  const [statusFilter, setStatusFilter] = useState('all');
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    coupon: Coupon | null;
  }>({ open: false, coupon: null });
  const [usageCouponId, setUsageCouponId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  // ----- Queries -----
  const { data: coupons, isLoading } = useCoupons();
  const toggleActive = useToggleCouponActive();
  const deleteCoupon = useDeleteCoupon();

  // ----- Loc theo trang thai -----
  const filteredCoupons = useMemo(() => {
    if (!coupons) return [];
    if (statusFilter === 'all') return coupons;
    return coupons.filter((c) => getCouponStatus(c) === statusFilter);
  }, [coupons, statusFilter]);

  // ----- Dem so luong moi trang thai -----
  const counts = useMemo(() => {
    if (!coupons)
      return { all: 0, active: 0, expired: 0, inactive: 0 };
    return {
      all: coupons.length,
      active: coupons.filter((c) => getCouponStatus(c) === 'active').length,
      expired: coupons.filter((c) => getCouponStatus(c) === 'expired').length,
      inactive: coupons.filter((c) => getCouponStatus(c) === 'inactive').length,
    };
  }, [coupons]);

  // ----- Columns -----
  const columns = getCouponColumns({
    onEdit: (coupon) => setFormDialog({ open: true, coupon }),
    onViewUsage: (coupon) => setUsageCouponId(coupon._id),
    onToggleActive: (id, isActive) => toggleActive.mutate({ id, isActive }),
    onDelete: (coupon) => setDeleteTarget(coupon),
  });

  // ----- Toolbar -----
  const toolbar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center
                    gap-3 w-full">
      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1
                      overflow-x-auto w-full sm:w-auto">
        {COUPON_STATUS_TABS.map((tab) => (
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

      <Button
        onClick={() => setFormDialog({ open: true, coupon: null })}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Them coupon
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent-100 rounded-lg">
          <Ticket className="h-6 w-6 text-accent-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quan ly ma giam gia, theo doi su dung, tao chuong trinh khuyen mai.
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredCoupons}
        isLoading={isLoading}
        loadingRows={6}
        enableSearch
        searchPlaceholder="Tim theo ma coupon..."
        toolbar={toolbar}
        emptyTitle="Chua co coupon"
        emptyDescription="Tao coupon dau tien de bat dau khuyen mai."
        emptyAction={
          <Button
            onClick={() => setFormDialog({ open: true, coupon: null })}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Them coupon
          </Button>
        }
      />

      {/* Dialogs */}
      <CouponFormDialog
        open={formDialog.open}
        onOpenChange={(open) => {
          if (!open) setFormDialog({ open: false, coupon: null });
        }}
        coupon={formDialog.coupon}
      />

      <CouponUsageDialog
        open={!!usageCouponId}
        onOpenChange={(open) => {
          if (!open) setUsageCouponId(null);
        }}
        couponId={usageCouponId}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xoa coupon?"
        description={`Ban co chac chan muon xoa coupon "${deleteTarget?.code}"? Hanh dong nay khong the hoan tac.`}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCoupon.mutate(deleteTarget._id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
        isPending={deleteCoupon.isPending}
      />
    </div>
  );
}
```

---

## 2. CouponFormDialog - Tao/Sua coupon

> File: `apps/fe/src/app/admin/coupons/CouponFormDialog.tsx`
> Dialog tao moi hoac chinh sua coupon.
> Form validation voi zod. Discount type radio, date picker, scope select.

### 2.1 Validation Schema

```typescript
// apps/fe/src/app/admin/coupons/schema.ts
import { z } from 'zod';

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Ma coupon toi thieu 3 ky tu')
      .max(20, 'Ma coupon toi da 20 ky tu')
      .regex(/^[A-Z0-9]+$/, 'Chi chua chu in hoa va so')
      .transform((v) => v.toUpperCase()),

    description: z.string().max(200, 'Mo ta toi da 200 ky tu').optional(),

    discountType: z.enum(['percentage', 'fixed'], {
      required_error: 'Vui long chon loai giam gia',
    }),

    discountValue: z
      .number({ required_error: 'Gia tri giam gia bat buoc' })
      .positive('Gia tri phai lon hon 0'),

    minOrderAmount: z
      .number()
      .min(0, 'Gia tri khong am')
      .optional()
      .default(0),

    maxDiscountAmount: z
      .number()
      .positive('Gia tri phai lon hon 0')
      .optional()
      .nullable(),

    startDate: z.string().min(1, 'Ngay bat dau bat buoc'),

    endDate: z.string().min(1, 'Ngay ket thuc bat buoc'),

    usageLimit: z
      .number()
      .int()
      .positive('Phai lon hon 0')
      .optional()
      .nullable(),

    usagePerUser: z
      .number()
      .int()
      .positive('Phai lon hon 0')
      .optional()
      .default(1),

    scope: z.enum(['all', 'category', 'product'], {
      required_error: 'Vui long chon pham vi',
    }),

    applicableCategories: z.array(z.string()).optional().default([]),

    applicableProducts: z.array(z.string()).optional().default([]),

    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.discountType === 'percentage' && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: 'Phan tram giam gia khong duoc vuot qua 100%',
      path: ['discountValue'],
    },
  )
  .refine(
    (data) => {
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: 'Ngay ket thuc phai sau ngay bat dau',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      if (data.scope === 'category' && data.applicableCategories.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Vui long chon it nhat 1 danh muc',
      path: ['applicableCategories'],
    },
  )
  .refine(
    (data) => {
      if (data.scope === 'product' && data.applicableProducts.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Vui long chon it nhat 1 san pham',
      path: ['applicableProducts'],
    },
  );

export type CouponFormData = z.infer<typeof couponFormSchema>;
```

### 2.2 CouponFormDialog

```typescript
// apps/fe/src/app/admin/coupons/CouponFormDialog.tsx
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Loader2, Ticket, Percent, Banknote } from 'lucide-react';
import { Coupon } from '@/services/coupon.service';
import { useCreateCoupon, useUpdateCoupon } from '@/hooks/use-coupons';
import { couponFormSchema, CouponFormData } from './schema';
import { CategoryMultiSelect } from './CategoryMultiSelect';
import { ProductSearch } from './ProductSearch';
import { SCOPE_LABELS } from './constants';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null; // null = tao moi, co data = chinh sua
}

export function CouponFormDialog({ open, onOpenChange, coupon }: Props) {
  const isEdit = !!coupon;
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      usageLimit: null,
      usagePerUser: 1,
      scope: 'all',
      applicableCategories: [],
      applicableProducts: [],
      isActive: true,
    },
  });

  const discountType = watch('discountType');
  const scope = watch('scope');

  // ----- Reset form khi mo dialog -----
  useEffect(() => {
    if (open && coupon) {
      reset({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount || 0,
        maxDiscountAmount: coupon.maxDiscount || null,
        startDate: coupon.startDate.slice(0, 10),
        endDate: coupon.endDate.slice(0, 10),
        usageLimit: coupon.usageLimit || null,
        usagePerUser: coupon.usagePerUser || 1,
        scope: coupon.scope,
        applicableCategories: coupon.applicableCategories || [],
        applicableProducts: coupon.applicableProducts || [],
        isActive: coupon.isActive,
      });
    } else if (open && !coupon) {
      reset({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: null,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        usageLimit: null,
        usagePerUser: 1,
        scope: 'all',
        applicableCategories: [],
        applicableProducts: [],
        isActive: true,
      });
    }
  }, [open, coupon, reset]);

  // ----- Submit -----
  const onSubmit = (data: CouponFormData) => {
    const payload: Partial<Coupon> = {
      code: data.code,
      description: data.description || null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxDiscount:
        data.discountType === 'percentage'
          ? data.maxDiscountAmount || undefined
          : undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      usageLimit: data.usageLimit || undefined,
      usagePerUser: data.usagePerUser,
      scope: data.scope,
      applicableCategories:
        data.scope === 'category' ? data.applicableCategories : [],
      applicableProducts:
        data.scope === 'product' ? data.applicableProducts : [],
      isActive: data.isActive,
    };

    if (isEdit) {
      updateCoupon.mutate(
        { id: coupon._id, dto: payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createCoupon.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createCoupon.isPending || updateCoupon.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary-600" />
            {isEdit ? `Chinh sua coupon: ${coupon.code}` : 'Tao coupon moi'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* === ROW 1: Ma coupon + Active toggle === */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="code">
                Ma coupon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="VD: SALE20, NEWYEAR"
                {...register('code')}
                className={`uppercase font-mono ${
                  errors.code ? 'border-red-500' : ''
                }`}
                disabled={isEdit}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label className="text-sm">Kich hoat</Label>
            </div>
          </div>

          {/* === ROW 2: Mo ta === */}
          <div className="space-y-2">
            <Label htmlFor="description">Mo ta</Label>
            <Textarea
              id="description"
              placeholder="Mo ta ngan gon ve coupon..."
              {...register('description')}
              rows={2}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* === ROW 3: Loai giam gia === */}
          <div className="space-y-2">
            <Label>
              Loai giam gia <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-2 cursor-pointer
                                    px-4 py-3 rounded-lg border transition-colors
                                    hover:bg-gray-50
                                    data-[state=checked]:border-primary-500
                                    data-[state=checked]:bg-primary-50">
                    <RadioGroupItem value="percentage" />
                    <Percent className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium">Giam theo %</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer
                                    px-4 py-3 rounded-lg border transition-colors
                                    hover:bg-gray-50
                                    data-[state=checked]:border-primary-500
                                    data-[state=checked]:bg-primary-50">
                    <RadioGroupItem value="fixed" />
                    <Banknote className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium">Giam truc tiep (VND)</span>
                  </label>
                </RadioGroup>
              )}
            />
            {errors.discountType && (
              <p className="text-sm text-red-500">
                {errors.discountType.message}
              </p>
            )}
          </div>

          {/* === ROW 4: Gia tri giam + Giam toi da === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                Gia tri giam <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={discountType === 'percentage' ? '10' : '100000'}
                  {...register('discountValue', { valueAsNumber: true })}
                  className={`pr-12 ${
                    errors.discountValue ? 'border-red-500' : ''
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-sm text-gray-400 font-medium">
                  {discountType === 'percentage' ? '%' : 'VND'}
                </span>
              </div>
              {errors.discountValue && (
                <p className="text-sm text-red-500">
                  {errors.discountValue.message}
                </p>
              )}
            </div>

            {/* Giam toi da (chi cho percentage) */}
            {discountType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount">
                  Giam toi da (VND)
                </Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  placeholder="500000"
                  {...register('maxDiscountAmount', { valueAsNumber: true })}
                  className={
                    errors.maxDiscountAmount ? 'border-red-500' : ''
                  }
                />
                {errors.maxDiscountAmount && (
                  <p className="text-sm text-red-500">
                    {errors.maxDiscountAmount.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* === ROW 5: Don toi thieu === */}
          <div className="space-y-2">
            <Label htmlFor="minOrderAmount">
              Gia tri don hang toi thieu (VND)
            </Label>
            <Input
              id="minOrderAmount"
              type="number"
              placeholder="500000"
              {...register('minOrderAmount', { valueAsNumber: true })}
            />
          </div>

          {/* === ROW 6: Thoi gian === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Ngay bat dau <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Ngay ket thuc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* === ROW 7: Gioi han su dung === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usageLimit">
                Tong luot su dung toi da
              </Label>
              <Input
                id="usageLimit"
                type="number"
                placeholder="100 (de trong = khong gioi han)"
                {...register('usageLimit', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usagePerUser">
                Luot su dung / nguoi dung
              </Label>
              <Input
                id="usagePerUser"
                type="number"
                placeholder="1"
                {...register('usagePerUser', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* === ROW 8: Pham vi ap dung === */}
          <div className="space-y-3">
            <Label>
              Pham vi ap dung <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chon pham vi..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {/* Chon danh muc */}
            {scope === 'category' && (
              <div className="space-y-2">
                <Label>Danh muc ap dung</Label>
                <Controller
                  name="applicableCategories"
                  control={control}
                  render={({ field }) => (
                    <CategoryMultiSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.applicableCategories && (
                  <p className="text-sm text-red-500">
                    {errors.applicableCategories.message}
                  </p>
                )}
              </div>
            )}

            {/* Chon san pham */}
            {scope === 'product' && (
              <div className="space-y-2">
                <Label>San pham ap dung</Label>
                <Controller
                  name="applicableProducts"
                  control={control}
                  render={({ field }) => (
                    <ProductSearch
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.applicableProducts && (
                  <p className="text-sm text-red-500">
                    {errors.applicableProducts.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* === Footer === */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEdit ? 'Cap nhat' : 'Tao coupon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 2.3 CategoryMultiSelect (sub-component)

```typescript
// apps/fe/src/app/admin/coupons/CategoryMultiSelect.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { X } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryMultiSelect({ value, onChange }: Props) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
    select: (res) => res.data.data,
  });

  const toggleCategory = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const cat = categories?.find((c: any) => c._id === id);
            return (
              <Badge
                key={id}
                variant="outline"
                className="pl-2 pr-1 py-1 gap-1"
              >
                {cat?.name || id}
                <button
                  type="button"
                  onClick={() => toggleCategory(id)}
                  className="hover:bg-gray-200 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Checkbox list */}
      <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
        {(categories || []).map((cat: any) => (
          <label
            key={cat._id}
            className="flex items-center gap-2 py-1.5 px-2 rounded
                       hover:bg-gray-50 cursor-pointer"
          >
            <Checkbox
              checked={value.includes(cat._id)}
              onCheckedChange={() => toggleCategory(cat._id)}
            />
            <span className="text-sm">{cat.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

### 2.4 ProductSearch (sub-component)

```typescript
// apps/fe/src/app/admin/coupons/ProductSearch.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function ProductSearch({ value, onChange }: Props) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data: results } = useQuery({
    queryKey: ['products', 'search', debouncedSearch],
    queryFn: () =>
      productService.getAll({ search: debouncedSearch, limit: 10 }),
    select: (res) => res.data.data,
    enabled: debouncedSearch.length >= 2,
  });

  const addProduct = (id: string) => {
    if (!value.includes(id)) {
      onChange([...value, id]);
    }
    setSearch('');
  };

  const removeProduct = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className="space-y-2">
      {/* Selected products */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="outline" className="pl-2 pr-1 py-1 gap-1">
              {id.slice(-6)}
              <button
                type="button"
                onClick={() => removeProduct(id)}
                className="hover:bg-gray-200 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2
                           h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tim san pham..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Search results */}
      {results && results.length > 0 && search && (
        <div className="border rounded-lg max-h-40 overflow-y-auto">
          {results.map((product: any) => (
            <button
              key={product._id}
              type="button"
              onClick={() => addProduct(product._id)}
              disabled={value.includes(product._id)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50
                         flex items-center gap-3 border-b last:border-b-0
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  alt=""
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(product.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 3. CouponUsageDialog - Lich su su dung coupon

> File: `apps/fe/src/app/admin/coupons/CouponUsageDialog.tsx`
> Hien thi thong ke va bang su dung coupon.

### 3.1 CouponUsageDialog

```typescript
// apps/fe/src/app/admin/coupons/CouponUsageDialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCouponUsage } from '@/hooks/use-coupons';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart3, Users, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  couponId: string | null;
}

export function CouponUsageDialog({ open, onOpenChange, couponId }: Props) {
  const { data: usage, isLoading } = useCouponUsage(couponId);

  // ----- Thong ke -----
  const totalUsed = usage?.length ?? 0;
  const totalDiscount = usage?.reduce((sum: number, u: any) => sum + u.discount, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            Lich su su dung coupon
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">
                    Tong luot su dung
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {totalUsed}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    Tong giam gia
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(totalDiscount)}
                </p>
              </div>
            </div>

            {/* Usage table */}
            {totalUsed === 0 ? (
              <EmptyState
                icon={<Receipt className="h-10 w-10 text-gray-300" />}
                title="Chua co ai su dung"
                description="Coupon nay chua duoc su dung lan nao."
              />
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-50
                               text-xs font-medium text-gray-500 uppercase">
                  <span>Khach hang</span>
                  <span>Ma don</span>
                  <span className="text-right">Giam gia</span>
                  <span className="text-right">Ngay</span>
                </div>

                {/* Table rows */}
                <div className="divide-y">
                  {(usage || []).map((entry: any, i: number) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 gap-2 px-4 py-3
                                 text-sm items-center hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900 truncate">
                        {entry.customer?.name || 'Khach vang lai'}
                      </span>
                      <span className="text-gray-600 truncate">
                        {entry.order?.orderNumber || '—'}
                      </span>
                      <span className="text-right font-semibold text-red-600">
                        -{formatCurrency(entry.discount)}
                      </span>
                      <span className="text-right text-gray-500 text-xs">
                        {formatDate(entry.usedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. ReviewModerationPage - Duyet danh gia

> File: `apps/fe/src/app/admin/reviews/page.tsx`
> Duyet danh gia khach hang: cho duyet, da duyet, tu choi, danh dau.
> Bulk actions (duyet nhieu), review detail modal, filter theo status.

### 4.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  DUYET DANH GIA                                               |
+--------------------------------------------------------------+
|  [Cho duyet (5)] [Da duyet (120)] [Tu choi (3)] [Danh dau(1)]|
+--------------------------------------------------------------+
|  [x] Chon tat ca            [Duyet tat ca da chon]           |
+--------------------------------------------------------------+
|  [ ] | [Img] Sofa go soi | Nguyen A | **** | "Rat dep..." | |
|      |                    |          |      | 2 anh | 02/04 |..|
+------+--------------------+----------+------+-------+-------+--+
|  [ ] | [Img] Ban an go   | Tran B   | ***  | "Tam on" | 0 anh|..|
+------+--------------------+----------+------+-------+--------+--+

Mobile:
+------------------------------+
|  DUYET DANH GIA              |
|  [Cho duyet] [Da duyet] [..] |
+------------------------------+
|  [Duyet da chon (2)]         |
+------------------------------+
|  [x] Card:                   |
|  [Product img] Sofa go soi   |
|  Nguyen A | ****             |
|  "Rat dep, go tu nhien..."   |
|  [2 anh] | 02/04/26          |
|  [Duyet] [Tu choi]          |
+------------------------------+
```

### 4.2 Review Status Config

```typescript
// apps/fe/src/app/admin/reviews/constants.ts
export const REVIEW_STATUS_TABS = [
  { value: 'PENDING', label: 'Cho duyet' },
  { value: 'APPROVED', label: 'Da duyet' },
  { value: 'REJECTED', label: 'Tu choi' },
  { value: 'FLAGGED', label: 'Danh dau' },
] as const;

export const REVIEW_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  PENDING: {
    label: 'Cho duyet',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  APPROVED: {
    label: 'Da duyet',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  REJECTED: {
    label: 'Tu choi',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  FLAGGED: {
    label: 'Danh dau',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
};
```

### 4.3 Hooks

```typescript
// apps/fe/src/hooks/use-review-moderation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { toast } from 'sonner';
import api from '@/lib/api';

// ----- Danh sach review (admin) -----
export function useAdminReviews(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'reviews', params],
    queryFn: () =>
      api.get('/admin/reviews', { params }),
    select: (res) => ({
      reviews: res.data.data,
      meta: res.data.meta,
    }),
    keepPreviousData: true,
  });
}

// ----- Duyet / Tu choi / Danh dau -----
export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'approve' | 'reject' | 'flag';
      reason?: string;
    }) =>
      reviewService.moderate(id, {
        action,
        ...(reason ? { reason } : {}),
      }),
    onSuccess: (_, { action }) => {
      const messages = {
        approve: 'Da duyet danh gia',
        reject: 'Da tu choi danh gia',
        flag: 'Da danh dau danh gia',
      };
      toast.success(messages[action]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: () => {
      toast.error('Loi khi xu ly danh gia');
    },
  });
}

// ----- Duyet nhieu (bulk approve) -----
export function useBulkApproveReviews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.patch('/admin/reviews/bulk-approve', { ids }),
    onSuccess: (_, ids) => {
      toast.success(`Da duyet ${ids.length} danh gia`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: () => {
      toast.error('Loi khi duyet danh gia hang loat');
    },
  });
}
```

### 4.4 ReviewDetailModal

```typescript
// apps/fe/src/app/admin/reviews/ReviewDetailModal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Star,
  CheckCircle2,
  XCircle,
  Flag,
  ExternalLink,
} from 'lucide-react';
import { REVIEW_STATUS_CONFIG } from './constants';
import Link from 'next/link';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFlag: (id: string) => void;
}

export function ReviewDetailModal({
  open,
  onOpenChange,
  review,
  onApprove,
  onReject,
  onFlag,
}: Props) {
  if (!review) return null;

  const statusConfig = REVIEW_STATUS_CONFIG[review.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiet danh gia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status + Date */}
          <div className="flex items-center justify-between">
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
              {statusConfig.label}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* Customer info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center
                            justify-center text-primary-700 font-semibold shrink-0">
              {review.user?.avatar ? (
                <img
                  src={review.user.avatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                review.user?.fullName?.charAt(0) || '?'
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {review.user?.fullName || 'Khach hang'}
              </p>
              <p className="text-xs text-gray-500">
                Don hang: {review.orderId}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < review.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-gray-700">
              {review.rating}/5
            </span>
          </div>

          {/* Title */}
          {review.title && (
            <h3 className="font-semibold text-gray-900">{review.title}</h3>
          )}

          {/* Comment */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {review.comment}
          </p>

          {/* Images */}
          {review.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {review.images.map((img, i) => (
                <a
                  key={i}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden border
                             border-gray-200 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={img}
                    alt={`Review image ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex gap-3 text-sm">
            <Link
              href={`/admin/products/${review.productId}`}
              className="inline-flex items-center gap-1 text-primary-600
                         hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Xem san pham
            </Link>
            <Link
              href={`/admin/orders/${review.orderId}`}
              className="inline-flex items-center gap-1 text-primary-600
                         hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Xem don hang
            </Link>
          </div>

          {/* Actions */}
          {review.status === 'PENDING' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                onClick={() => onApprove(review.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Duyet
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject(review.id)}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tu choi
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFlag(review.id)}
                className="text-orange-500 hover:bg-orange-50"
                title="Danh dau"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.5 RejectReasonDialog

```typescript
// apps/fe/src/app/admin/reviews/RejectReasonDialog.tsx
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
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Loader2 } from 'lucide-react';

const REJECT_REASONS = [
  'Noi dung khong phu hop',
  'Chua tu ngon',
  'Khong lien quan den san pham',
  'Spam hoac quang cao',
  'Hinh anh khong phu hop',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: Props) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ly do tu choi danh gia</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Quick reasons */}
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-xs px-3 py-1.5 rounded-full border
                           transition-colors
                           ${
                             reason === r
                               ? 'bg-red-50 border-red-300 text-red-700'
                               : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                           }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Custom reason */}
          <div className="space-y-2">
            <Label>Ly do chi tiet</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhap ly do tu choi..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huy
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tu choi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.6 ReviewModerationPage

```typescript
// apps/fe/src/app/admin/reviews/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Star, CheckCircle2, MessageSquare } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  useAdminReviews,
  useModerateReview,
  useBulkApproveReviews,
} from '@/hooks/use-review-moderation';
import { ReviewDetailModal } from './ReviewDetailModal';
import { RejectReasonDialog } from './RejectReasonDialog';
import { REVIEW_STATUS_TABS, REVIEW_STATUS_CONFIG } from './constants';

export default function ReviewModerationPage() {
  // ----- State -----
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Review[]>([]);

  // ----- Queries -----
  const { data, isLoading } = useAdminReviews({
    status: statusFilter,
    page,
    limit: 20,
  });
  const moderate = useModerateReview();
  const bulkApprove = useBulkApproveReviews();

  // ----- Column definitions -----
  const columns: ColumnDef<Review>[] = useMemo(
    () => [
      {
        id: 'product',
        header: 'San pham',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            {/* Product image placeholder */}
            <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0
                            overflow-hidden">
              <div className="h-full w-full flex items-center justify-center
                              text-xs text-gray-400">
                SP
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900 truncate
                             max-w-[140px]">
              {row.original.productId.slice(-8)}
            </span>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Khach hang',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.user?.fullName || 'Khach hang'}
          </span>
        ),
        meta: { className: 'hidden sm:table-cell' },
      },
      {
        accessorKey: 'rating',
        header: 'Sao',
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < row.original.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'comment',
        header: 'Noi dung',
        cell: ({ row }) => (
          <p className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">
            {row.original.comment}
          </p>
        ),
        meta: { className: 'hidden md:table-cell' },
      },
      {
        id: 'images',
        header: 'Anh',
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {row.original.images.length > 0
              ? `${row.original.images.length} anh`
              : '—'}
          </span>
        ),
        meta: { className: 'hidden lg:table-cell' },
      },
      {
        id: 'status',
        header: 'Trang thai',
        cell: ({ row }) => {
          const config = REVIEW_STATUS_CONFIG[row.original.status];
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
        header: 'Ngay',
        cell: ({ row }) => (
          <span className="text-xs text-gray-500">
            {formatDate(row.original.createdAt)}
          </span>
        ),
        meta: { className: 'hidden xl:table-cell' },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="flex items-center gap-1">
              {review.status === 'PENDING' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      moderate.mutate({
                        id: review.id,
                        action: 'approve',
                      });
                    }}
                    className="text-green-600 hover:bg-green-50 h-7 px-2
                               text-xs"
                  >
                    Duyet
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRejectTarget(review.id);
                    }}
                    className="text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                  >
                    Tu choi
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [moderate],
  );

  // ----- Toolbar -----
  const toolbar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center
                    gap-3 w-full">
      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1
                      overflow-x-auto w-full sm:w-auto">
        {REVIEW_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md
                       transition-colors whitespace-nowrap
                       ${
                         statusFilter === tab.value
                           ? 'bg-white text-gray-900 shadow-sm'
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Bulk approve */}
      {selectedRows.length > 0 && statusFilter === 'PENDING' && (
        <Button
          onClick={() => {
            const ids = selectedRows.map((r) => r.id);
            bulkApprove.mutate(ids, {
              onSuccess: () => setSelectedRows([]),
            });
          }}
          disabled={bulkApprove.isPending}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Duyet {selectedRows.length} danh gia
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <MessageSquare className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Duyet danh gia</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kiem duyet danh gia san pham tu khach hang.
          </p>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.reviews || []}
        isLoading={isLoading}
        loadingRows={6}
        enableRowSelection={statusFilter === 'PENDING'}
        onRowSelectionChange={(rows) => setSelectedRows(rows as Review[])}
        totalCount={data?.meta?.total}
        currentPage={page}
        pageSize={20}
        onPageChange={setPage}
        toolbar={toolbar}
        emptyTitle={
          statusFilter === 'PENDING'
            ? 'Khong co danh gia cho duyet'
            : 'Khong co danh gia'
        }
        emptyDescription={
          statusFilter === 'PENDING'
            ? 'Tat ca danh gia da duoc xu ly.'
            : 'Chua co danh gia nao trong tab nay.'
        }
      />

      {/* Review detail modal (click row) */}
      <ReviewDetailModal
        open={!!selectedReview}
        onOpenChange={(open) => {
          if (!open) setSelectedReview(null);
        }}
        review={selectedReview}
        onApprove={(id) => {
          moderate.mutate({ id, action: 'approve' });
          setSelectedReview(null);
        }}
        onReject={(id) => {
          setSelectedReview(null);
          setRejectTarget(id);
        }}
        onFlag={(id) => {
          moderate.mutate({ id, action: 'flag' });
          setSelectedReview(null);
        }}
      />

      {/* Reject reason dialog */}
      <RejectReasonDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onConfirm={(reason) => {
          if (rejectTarget) {
            moderate.mutate(
              { id: rejectTarget, action: 'reject', reason },
              { onSuccess: () => setRejectTarget(null) },
            );
          }
        }}
        isPending={moderate.isPending}
      />
    </div>
  );
}
```

---

## 5. ReportsPage - Bao cao tong hop

> File: `apps/fe/src/app/admin/reports/page.tsx`
> Bao cao tong hop voi nhieu tab: Doanh thu, Don hang, San pham, Ton kho, Khach hang, Shipper, Coupon.
> Bieu do Recharts. Date range filter. Xuat Excel moi tab.

### 5.1 Cau truc trang

```
Desktop:
+--------------------------------------------------------------+
|  BAO CAO                                                      |
+--------------------------------------------------------------+
|  [Hom nay] [7 ngay] [30 ngay] [Thang nay] [Thang truoc]     |
|  [Tu ngay ___] [Den ngay ___]                    [Xuat Excel]|
+--------------------------------------------------------------+
|  [Doanh thu] [Don hang] [San pham] [Ton kho] [KH] [Ship] [CP]|
+--------------------------------------------------------------+
|                                                               |
|  Tab content: Charts + Tables                                 |
|                                                               |
+--------------------------------------------------------------+

Mobile:
+------------------------------+
|  BAO CAO                     |
|  [7 ngay ▼]                  |
|  01/04/26 - 02/04/26         |
|  [Xuat Excel]                |
+------------------------------+
|  [Doanh thu] [Don hang] [..] |
|  (scroll ngang)              |
+------------------------------+
|  Tab content...              |
+------------------------------+
```

### 5.2 Date Range Presets

```typescript
// apps/fe/src/app/admin/reports/constants.ts
import {
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth,
  subMonths, format,
} from 'date-fns';

export type DatePreset = 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom';

export const DATE_PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: 'Hom nay' },
  { value: '7days', label: '7 ngay' },
  { value: '30days', label: '30 ngay' },
  { value: 'this_month', label: 'Thang nay' },
  { value: 'last_month', label: 'Thang truoc' },
  { value: 'custom', label: 'Tuy chon' },
];

export function getDateRange(preset: DatePreset): {
  fromDate: string;
  toDate: string;
} {
  const now = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (preset) {
    case 'today':
      return { fromDate: fmt(startOfDay(now)), toDate: fmt(endOfDay(now)) };
    case '7days':
      return { fromDate: fmt(subDays(now, 6)), toDate: fmt(now) };
    case '30days':
      return { fromDate: fmt(subDays(now, 29)), toDate: fmt(now) };
    case 'this_month':
      return {
        fromDate: fmt(startOfMonth(now)),
        toDate: fmt(endOfMonth(now)),
      };
    case 'last_month': {
      const last = subMonths(now, 1);
      return {
        fromDate: fmt(startOfMonth(last)),
        toDate: fmt(endOfMonth(last)),
      };
    }
    default:
      return { fromDate: fmt(subDays(now, 29)), toDate: fmt(now) };
  }
}

export const REPORT_TABS = [
  { value: 'revenue', label: 'Doanh thu' },
  { value: 'orders', label: 'Don hang' },
  { value: 'products', label: 'San pham' },
  { value: 'inventory', label: 'Ton kho' },
  { value: 'customers', label: 'Khach hang' },
  { value: 'shippers', label: 'Shipper' },
  { value: 'coupons', label: 'Coupon' },
] as const;

export type ReportTab = (typeof REPORT_TABS)[number]['value'];
```

### 5.3 Hooks

```typescript
// apps/fe/src/hooks/use-reports.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  reportService,
  DateRangeParams,
  RevenueReport,
} from '@/services/report.service';
import { toast } from 'sonner';

// ----- Doanh thu -----
export function useRevenueReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ['report', 'revenue', params],
    queryFn: () => reportService.getRevenue(params),
    select: (res) => res.data.data as RevenueReport,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

// ----- Don hang -----
export function useOrdersReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ['report', 'orders', params],
    queryFn: () => reportService.getOrdersSummary(params),
    select: (res) => res.data.data,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

// ----- Top san pham -----
export function useTopProductsReport(params: DateRangeParams & { limit?: number }) {
  return useQuery({
    queryKey: ['report', 'products', params],
    queryFn: () => reportService.getTopProducts(params),
    select: (res) => res.data.data,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

// ----- Ton kho -----
export function useInventoryReport() {
  return useQuery({
    queryKey: ['report', 'inventory'],
    queryFn: () => reportService.getInventory(),
    select: (res) => res.data.data,
  });
}

// ----- Khach hang -----
export function useCustomerReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ['report', 'customers', params],
    queryFn: () => reportService.getCustomers(params),
    select: (res) => res.data.data,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

// ----- Shipper performance -----
export function useShipperReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ['report', 'shippers', params],
    queryFn: () => reportService.getShipperPerformance(params),
    select: (res) => res.data.data,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

// ----- Coupon report -----
export function useCouponReport(params: DateRangeParams) {
  return useQuery({
    queryKey: ['report', 'coupons', params],
    queryFn: () => reportService.getCouponReport(params),
    select: (res) => res.data.data,
    enabled: !!params.fromDate && !!params.toDate,
  });
}

// ----- Xuat Excel -----
export function useExportReport() {
  return useMutation({
    mutationFn: ({
      type,
      params,
    }: {
      type: string;
      params: DateRangeParams;
    }) => reportService.exportExcel(type as any, params),
    onSuccess: (res, { type }) => {
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
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

### 5.4 DateRangeFilter

```typescript
// apps/fe/src/app/admin/reports/DateRangeFilter.tsx
'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { DATE_PRESETS, DatePreset } from './constants';

interface Props {
  preset: DatePreset;
  fromDate: string;
  toDate: string;
  onPresetChange: (preset: DatePreset) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onExport: () => void;
  isExporting: boolean;
}

export function DateRangeFilter({
  preset,
  fromDate,
  toDate,
  onPresetChange,
  onFromDateChange,
  onToDateChange,
  onExport,
  isExporting,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-3">
        {/* Preset buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPresetChange(p.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg
                         transition-colors whitespace-nowrap
                         ${
                           preset === p.value
                             ? 'bg-primary-500 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                         }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date inputs + Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center
                        gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                onFromDateChange(e.target.value);
                onPresetChange('custom');
              }}
              className="w-[150px]"
            />
            <span className="text-sm text-gray-400">den</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                onToDateChange(e.target.value);
                onPresetChange('custom');
              }}
              className="w-[150px]"
            />
          </div>

          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={onExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Xuat Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 5.5 Revenue Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/RevenueTab.tsx
'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useRevenueReport } from '@/hooks/use-reports';
import { DateRangeParams } from '@/services/report.service';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, ShoppingBag, Wallet } from 'lucide-react';

interface Props {
  params: DateRangeParams;
}

type GroupBy = 'day' | 'week' | 'month';

export function RevenueTab({ params }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const { data, isLoading } = useRevenueReport({
    ...params,
    groupBy,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const SUMMARY_CARDS = [
    {
      label: 'Tong doanh thu',
      value: formatCurrency(data?.totalRevenue ?? 0),
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Gia tri TB / don',
      value: formatCurrency(data?.averageOrderValue ?? 0),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Tong don hang',
      value: (data?.totalOrders ?? 0).toLocaleString('vi-VN'),
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group by toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1
                      w-fit">
        {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md
                       transition-colors
                       ${
                         groupBy === g
                           ? 'bg-white text-gray-900 shadow-sm'
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
          >
            {{ day: 'Ngay', week: 'Tuan', month: 'Thang' }[g]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Bieu do doanh thu
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(0)}tr`
                    : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Doanh thu',
                ]}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#8B4513"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                name="Don hang"
                stroke="#2D5016"
                strokeWidth={2}
                dot={{ r: 3 }}
                yAxisId={0}
                hide
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

### 5.6 Orders Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/OrdersTab.tsx
'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useOrdersReport } from '@/hooks/use-reports';
import { DateRangeParams } from '@/services/report.service';
import { Skeleton } from '@/components/ui/Skeleton';
import { ORDER_STATUS_MAP } from '@/lib/orderStatus';

interface Props {
  params: DateRangeParams;
}

const PIE_COLORS = [
  '#8B4513', '#2D5016', '#D4A373', '#eab308',
  '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4',
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tien mat',
  bank_transfer: 'Chuyen khoan',
  cod: 'COD',
};

const CHANNEL_LABELS: Record<string, string> = {
  web: 'Website',
  pos: 'POS',
};

export function OrdersTab({ params }: Props) {
  const { data, isLoading } = useOrdersReport(params);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      </div>
    );
  }

  // ----- Don hang theo trang thai (Pie chart) -----
  const statusData = Object.entries(data?.byStatus || {}).map(
    ([status, count]) => ({
      name:
        ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP]?.label ||
        status,
      value: count as number,
    }),
  );

  // ----- Don hang theo phuong thuc thanh toan (Bar chart) -----
  const paymentData = Object.entries(data?.byPayment || {}).map(
    ([method, count]) => ({
      name: PAYMENT_LABELS[method] || method,
      value: count as number,
    }),
  );

  // ----- Don hang theo kenh (Bar chart) -----
  const channelData = Object.entries(data?.byChannel || {}).map(
    ([channel, count]) => ({
      name: CHANNEL_LABELS[channel] || channel,
      value: count as number,
    }),
  );

  return (
    <div className="space-y-6">
      {/* Total */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Tong don hang trong ky</p>
        <p className="text-3xl font-bold text-gray-900">
          {(data?.total ?? 0).toLocaleString('vi-VN')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Don hang theo trang thai */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Don hang theo trang thai
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Phuong thuc thanh toan */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Phuong thuc thanh toan
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="So don" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar: Kenh ban hang (Web vs POS) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Kenh ban hang: Web vs POS
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip />
              <Bar dataKey="value" name="So don" fill="#2D5016" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

### 5.7 Products Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/ProductsTab.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTopProductsReport } from '@/hooks/use-reports';
import { DateRangeParams } from '@/services/report.service';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  params: DateRangeParams;
}

export function ProductsTab({ params }: Props) {
  const { data: products, isLoading } = useTopProductsReport({
    ...params,
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const chartData = (products || []).map((p: any) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
    revenue: p.revenue,
    quantity: p.totalSold,
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart: Top san pham theo doanh thu */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Top 10 san pham theo doanh thu
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(0)}tr`
                    : `${(v / 1000).toFixed(0)}k`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={160}
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Doanh thu',
                ]}
              />
              <Bar
                dataKey="revenue"
                name="Doanh thu"
                fill="#8B4513"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table: Chi tiet */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            Chi tiet top san pham
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">San pham</th>
                <th className="px-4 py-3 text-right">So luong ban</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">
                  Danh gia TB
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(products || []).map((p: any, i: number) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.thumbnail && (
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="h-8 w-8 rounded object-cover shrink-0"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900
                                       truncate max-w-[200px]">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {p.totalSold.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold
                                 text-primary-700">
                    {formatCurrency(p.revenue)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right hidden
                                 sm:table-cell text-amber-600">
                    {p.averageRating?.toFixed(1) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 5.8 Inventory Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/InventoryTab.tsx
'use client';

import { useState, useMemo } from 'react';
import { useInventoryReport } from '@/hooks/use-reports';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertTriangle, PackageX, CheckCircle2 } from 'lucide-react';
import { INVENTORY } from '@shared-types';

interface Props {
  params: { fromDate: string; toDate: string };
}

type StockFilter = 'all' | 'low' | 'out';

const STOCK_STATUS: Record<
  string,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  ok: {
    label: 'Binh thuong',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: CheckCircle2,
  },
  low: {
    label: 'Sap het',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: AlertTriangle,
  },
  out: {
    label: 'Het hang',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: PackageX,
  },
};

function getStockStatus(stock: number): 'ok' | 'low' | 'out' {
  if (stock === 0) return 'out';
  if (stock <= (INVENTORY?.LOW_STOCK_THRESHOLD ?? 5)) return 'low';
  return 'ok';
}

export function InventoryTab({ params }: Props) {
  const [filter, setFilter] = useState<StockFilter>('all');
  const { data: inventory, isLoading } = useInventoryReport();

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (filter === 'all') return inventory;
    return inventory.filter(
      (item: any) => getStockStatus(item.stock) === filter,
    );
  }, [inventory, filter]);

  // ----- Counts -----
  const counts = useMemo(() => {
    if (!inventory) return { all: 0, low: 0, out: 0 };
    return {
      all: inventory.length,
      low: inventory.filter((i: any) => getStockStatus(i.stock) === 'low').length,
      out: inventory.filter((i: any) => getStockStatus(i.stock) === 'out').length,
    };
  }, [inventory]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(
          [
            { value: 'all', label: 'Tat ca' },
            { value: 'low', label: 'Sap het hang' },
            { value: 'out', label: 'Het hang' },
          ] as const
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg
                       transition-colors
                       ${
                         filter === f.value
                           ? 'bg-primary-500 text-white'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                       }`}
          >
            {f.label}
            <span className="ml-1 text-xs opacity-70">
              ({counts[f.value]})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-gray-500 uppercase bg-gray-50">
                <th className="px-4 py-3 text-left">San pham</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">SKU</th>
                <th className="px-4 py-3 text-right">Ton kho</th>
                <th className="px-4 py-3 text-center">Trang thai</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventory.map((item: any) => {
                const status = getStockStatus(item.stock);
                const statusConfig = STOCK_STATUS[status];
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {status !== 'ok' && (
                          <StatusIcon
                            className={`h-4 w-4 ${statusConfig.color} shrink-0`}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900
                                         truncate max-w-[250px]">
                          {item.name}
                        </span>
                        {item.color && (
                          <span className="text-xs text-gray-400">
                            ({item.color}
                            {item.dimension ? `, ${item.dimension}` : ''})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono
                                   hidden sm:table-cell">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-bold ${
                          status === 'out'
                            ? 'text-red-600'
                            : status === 'low'
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={`${statusConfig.bgColor} ${statusConfig.color}
                                    border-0 text-xs`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 5.9 Customers Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/CustomersTab.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCustomerReport } from '@/hooks/use-reports';
import { customerService } from '@/services/customer.service';
import { useQuery } from '@tanstack/react-query';
import { DateRangeParams } from '@/services/report.service';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  params: DateRangeParams;
}

export function CustomersTab({ params }: Props) {
  const { data, isLoading } = useCustomerReport(params);

  // Top customers by spending
  const { data: topCustomers, isLoading: loadingTop } = useQuery({
    queryKey: ['customers', 'top'],
    queryFn: () => customerService.getTop(10),
    select: (res) => res.data.data,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Khach hang moi</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.totalNew?.toLocaleString('vi-VN') ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Khach quay lai</p>
          <p className="text-2xl font-bold text-blue-600">
            {data?.totalReturning?.toLocaleString('vi-VN') ?? 0}
          </p>
        </div>
      </div>

      {/* Line chart: Khach moi theo thoi gian */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Khach hang moi theo thoi gian
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                }}
              />
              <Line
                type="monotone"
                dataKey="newCustomers"
                name="Khach moi"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="returningCustomers"
                name="Quay lai"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top customers by spending */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            Top 10 khach hang chi tieu nhieu nhat
          </h3>
        </div>
        {loadingTop ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Khach hang</th>
                  <th className="px-4 py-3 text-right">Don hang</th>
                  <th className="px-4 py-3 text-right">Tong chi tieu</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(topCustomers || []).map((c: any, i: number) => (
                  <tr key={c._id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {c.fullName || c.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {c.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold
                                   text-primary-700">
                      {formatCurrency(c.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5.10 Shipper Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/ShipperTab.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useShipperReport } from '@/hooks/use-reports';
import { DateRangeParams } from '@/services/report.service';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

interface Props {
  params: DateRangeParams;
}

export function ShipperTab({ params }: Props) {
  const { data: shippers, isLoading } = useShipperReport(params);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const chartData = (shippers || []).map((s: any) => ({
    name: s.name.length > 15 ? s.name.slice(0, 15) + '...' : s.name,
    delivered: s.totalDelivered,
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart: So don giao moi shipper */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          So don giao theo shipper
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="delivered"
                name="Don giao"
                fill="#2D5016"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            Hieu suat shipper
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Shipper</th>
                <th className="px-4 py-3 text-right">Don giao</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">
                  Ty le dung hen
                </th>
                <th className="px-4 py-3 text-right hidden md:table-cell">
                  TG trung binh
                </th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">
                  Danh gia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(shippers || []).map((s: any) => {
                const onTimeRate = (s.completionRate * 100).toFixed(0);
                return (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {s.totalDelivered}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <Badge
                        className={`border-0 text-xs ${
                          Number(onTimeRate) >= 90
                            ? 'bg-green-50 text-green-700'
                            : Number(onTimeRate) >= 70
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {onTimeRate}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600
                                   hidden md:table-cell">
                      {s.averageTime} phut
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-amber-600
                                   hidden lg:table-cell">
                      {s.rating?.toFixed(1) || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 5.11 Coupon Tab

```typescript
// apps/fe/src/app/admin/reports/tabs/CouponTab.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCouponReport } from '@/hooks/use-reports';
import { DateRangeParams } from '@/services/report.service';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  params: DateRangeParams;
}

export function CouponTab({ params }: Props) {
  const { data: coupons, isLoading } = useCouponReport(params);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  const chartData = (coupons || [])
    .sort((a: any, b: any) => b.usageCount - a.usageCount)
    .slice(0, 10)
    .map((c: any) => ({
      code: c.code,
      usage: c.usageCount,
    }));

  return (
    <div className="space-y-6">
      {/* Bar chart: Coupon pho bien */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Coupon duoc su dung nhieu nhat
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="code"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="usage"
                name="Luot su dung"
                fill="#D4A373"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table: Chi tiet coupon */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            Chi tiet su dung coupon
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Ma coupon</th>
                <th className="px-4 py-3 text-right">Luot su dung</th>
                <th className="px-4 py-3 text-right">Tong giam gia</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">
                  TB giam / don
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(coupons || []).map((c: any) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary-700
                                     bg-primary-50 px-2 py-0.5 rounded text-sm">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {c.usageCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold
                                 text-red-600">
                    -{formatCurrency(c.totalDiscount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600
                                 hidden sm:table-cell">
                    {c.usageCount > 0
                      ? formatCurrency(c.totalDiscount / c.usageCount)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 5.12 ReportsPage (main)

```typescript
// apps/fe/src/app/admin/reports/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { BarChart3 } from 'lucide-react';
import { DateRangeFilter } from './DateRangeFilter';
import { RevenueTab } from './tabs/RevenueTab';
import { OrdersTab } from './tabs/OrdersTab';
import { ProductsTab } from './tabs/ProductsTab';
import { InventoryTab } from './tabs/InventoryTab';
import { CustomersTab } from './tabs/CustomersTab';
import { ShipperTab } from './tabs/ShipperTab';
import { CouponTab } from './tabs/CouponTab';
import { useExportReport } from '@/hooks/use-reports';
import {
  REPORT_TABS,
  ReportTab,
  DatePreset,
  getDateRange,
} from './constants';

export default function ReportsPage() {
  // ----- Date range state -----
  const [preset, setPreset] = useState<DatePreset>('30days');
  const initialRange = getDateRange('30days');
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);

  // ----- Active tab -----
  const [activeTab, setActiveTab] = useState<ReportTab>('revenue');

  // ----- Export -----
  const exportReport = useExportReport();

  // ----- Handle preset change -----
  const handlePresetChange = useCallback((newPreset: DatePreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const range = getDateRange(newPreset);
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
  }, []);

  const handleExport = useCallback(() => {
    exportReport.mutate({
      type: activeTab,
      params: { fromDate, toDate },
    });
  }, [activeTab, fromDate, toDate, exportReport]);

  const dateParams = { fromDate, toDate };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <BarChart3 className="h-6 w-6 text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bao cao</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Thong ke doanh thu, don hang, san pham, khach hang va nhieu hon.
          </p>
        </div>
      </div>

      {/* Date range filter */}
      <DateRangeFilter
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onPresetChange={handlePresetChange}
        onFromDateChange={(d) => {
          setFromDate(d);
          setPreset('custom');
        }}
        onToDateChange={(d) => {
          setToDate(d);
          setPreset('custom');
        }}
        onExport={handleExport}
        isExporting={exportReport.isPending}
      />

      {/* Report tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)}>
        <TabsList className="w-full justify-start border-b bg-transparent
                             rounded-none p-0 h-auto overflow-x-auto">
          {REPORT_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-3 rounded-none border-b-2 border-transparent
                         data-[state=active]:border-primary-500
                         data-[state=active]:text-primary-700
                         text-gray-500 hover:text-gray-700
                         transition-colors whitespace-nowrap text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="revenue" className="mt-6">
          <RevenueTab params={dateParams} />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersTab params={dateParams} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab params={dateParams} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryTab params={dateParams} />
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <CustomersTab params={dateParams} />
        </TabsContent>

        <TabsContent value="shippers" className="mt-6">
          <ShipperTab params={dateParams} />
        </TabsContent>

        <TabsContent value="coupons" className="mt-6">
          <CouponTab params={dateParams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 6. Excel Export - Xuat bao cao

> Tat ca cac tab bao cao deu ho tro xuat file Excel (.xlsx).
> Su dung `reportService.exportExcel()` tra ve blob, sau do tao download link.

### 6.1 Export Flow

```typescript
// Luong xu ly xuat Excel:
//
// 1. User click "Xuat Excel" tren toolbar
// 2. Frontend goi: GET /api/admin/reports/export/{type}?fromDate=...&toDate=...
//    voi responseType: 'blob'
// 3. Backend tao file Excel bang thu vien exceljs hoac xlsx
// 4. Frontend nhan blob → tao URL.createObjectURL → trigger download
// 5. Giai phong URL sau khi download

// Hook useExportReport (da dinh nghia o muc 5.3):
export function useExportReport() {
  return useMutation({
    mutationFn: ({
      type,
      params,
    }: {
      type: string;
      params: { fromDate: string; toDate: string };
    }) => reportService.exportExcel(type as any, params),
    onSuccess: (res, { type }) => {
      // Tao blob URL va trigger download
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Xuat file Excel thanh cong');
    },
    onError: () => {
      toast.error('Loi khi xuat file Excel. Vui long thu lai.');
    },
  });
}
```

### 6.2 Export Types va ten file

| Tab | API endpoint | Ten file |
|-----|-------------|----------|
| Doanh thu | `/admin/reports/export/revenue` | `bao-cao-revenue-2026-04-02.xlsx` |
| Don hang | `/admin/reports/export/orders` | `bao-cao-orders-2026-04-02.xlsx` |
| San pham | `/admin/reports/export/products` | `bao-cao-products-2026-04-02.xlsx` |
| Ton kho | `/admin/reports/export/inventory` | `bao-cao-inventory-2026-04-02.xlsx` |
| Khach hang | `/admin/reports/export/customers` | `bao-cao-customers-2026-04-02.xlsx` |
| Shipper | `/admin/reports/export/shippers` | `bao-cao-shippers-2026-04-02.xlsx` |
| Coupon | `/admin/reports/export/coupons` | `bao-cao-coupons-2026-04-02.xlsx` |

---

## Responsive & Loading Summary

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| CouponsPage | DataTable day du cot | An cot mo ta, thoi gian | Card list |
| CouponFormDialog | 2-col layout | 2-col layout | 1-col layout |
| ReviewModerationPage | DataTable + bulk select | An cot anh, ngay | Card list |
| ReportsPage | Full charts + tables | Charts responsive | Charts stack doc, tables scroll ngang |
| DateRangeFilter | Inline presets + dates | Giong desktop | Stack doc |

**Loading states:** Moi tab bao cao su dung `Skeleton` component tuong ung voi layout cua no (card skeleton, chart skeleton, table skeleton). DataTable tu dong hien thi loading rows.

**Chart responsive:** Tat ca chart su dung `ResponsiveContainer` cua Recharts voi `width="100%" height="100%"` trong container co chieu cao co dinh (`h-64`, `h-72`, `h-80`).
