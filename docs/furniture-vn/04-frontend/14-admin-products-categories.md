# ADMIN - SAN PHAM & DANH MUC

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(admin)/products/`, `apps/fe/src/app/(admin)/categories/`, `apps/fe/src/components/admin/products/`
> Bao gom: ProductsList, ProductCreate/Edit (multi-tab form), ImageUploadManager, CategoriesTree, BulkImport
> Tech stack: Next.js 14 + TailwindCSS + React Hook Form + Zod + react-beautiful-dnd + TipTap
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [ProductsListPage - Danh sach san pham](#1-productslistpage---danh-sach-san-pham)
2. [ProductCreatePage - Them san pham moi](#2-productcreatepage---them-san-pham-moi)
3. [ProductEditPage - Chinh sua san pham](#3-producteditpage---chinh-sua-san-pham)
4. [ProductFormTabs - Form nhieu tab](#4-productformtabs---form-nhieu-tab)
5. [Tab 1 - Thong tin co ban](#5-tab-1---thong-tin-co-ban)
6. [Tab 2 - Bien the (Variants)](#6-tab-2---bien-the-variants)
7. [Tab 3 - Hinh anh](#7-tab-3---hinh-anh)
8. [Tab 4 - SEO & Them](#8-tab-4---seo--them)
9. [ImageUploadManager](#9-imageuploadmanager)
10. [CategoriesPage - Quan ly danh muc](#10-categoriespage---quan-ly-danh-muc)
11. [CategoryFormDialog](#11-categoryformdialog)
12. [BulkImport Dialog](#12-bulkimport-dialog)
13. [Responsive Behavior Summary](#13-responsive-behavior-summary)

---

## 1. ProductsListPage - Danh sach san pham

> File: `apps/fe/src/app/(admin)/products/page.tsx`
> DataTable voi cot: Image, Name, SKU count, Base Price, Total Stock, Status badge, Actions.
> Filter: category, status, search. Sort: name, price, stock, createdAt.
> Bulk actions: doi status, xoa. Xuat Excel. Pagination.

### 1.1 Product List Hook

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-products-list.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { IProduct, ProductStatus, PaginatedResponse } from '@/types';

export interface ProductListItem {
  _id: string;
  name: string;
  slug: string;
  mainImage: string;
  basePrice: number;
  skuCount: number;         // So luong bien the (variants)
  totalStock: number;       // Tong ton kho tat ca variants
  status: ProductStatus;
  categoryName: string;
  createdAt: string;
}

interface ProductFilters {
  search: string;
  category: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export function useProductsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ----- Filters tu URL params -----
  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
  });

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ----- Fetch products -----
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: filters.page,
        limit: filters.limit,
        sort: `${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`,
      };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const res = await apiClient.get<PaginatedResponse<ProductListItem>>(
        '/api/admin/products',
        { params }
      );

      setProducts(res.data.items);
      setTotalCount(res.data.totalCount);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Fetch products failed:', error);
      toast({
        title: 'Loi tai du lieu',
        description: 'Khong the tai danh sach san pham',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ----- Sync filters -> URL -----
  const updateFilters = useCallback(
    (updates: Partial<ProductFilters>) => {
      const newFilters = { ...filters, ...updates };

      // Reset ve trang 1 khi doi filter
      if (updates.search !== undefined || updates.category !== undefined || updates.status !== undefined) {
        newFilters.page = 1;
      }

      setFilters(newFilters);

      // Cap nhat URL params
      const params = new URLSearchParams();
      if (newFilters.search) params.set('search', newFilters.search);
      if (newFilters.category) params.set('category', newFilters.category);
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.sortBy !== 'createdAt') params.set('sortBy', newFilters.sortBy);
      if (newFilters.sortOrder !== 'desc') params.set('sortOrder', newFilters.sortOrder);
      if (newFilters.page > 1) params.set('page', String(newFilters.page));

      router.replace(`/admin/products?${params.toString()}`, { scroll: false });
    },
    [filters, router]
  );

  // ----- Bulk actions -----
  const bulkChangeStatus = useCallback(
    async (status: ProductStatus) => {
      try {
        await apiClient.patch('/api/admin/products/bulk-status', {
          ids: Array.from(selectedIds),
          status,
        });
        toast({ title: 'Thanh cong', description: `Da cap nhat ${selectedIds.size} san pham` });
        setSelectedIds(new Set());
        fetchProducts();
      } catch {
        toast({ title: 'Loi', description: 'Cap nhat that bai', variant: 'destructive' });
      }
    },
    [selectedIds, fetchProducts, toast]
  );

  const bulkDelete = useCallback(async () => {
    try {
      await apiClient.delete('/api/admin/products/bulk', {
        data: { ids: Array.from(selectedIds) },
      });
      toast({ title: 'Thanh cong', description: `Da xoa ${selectedIds.size} san pham` });
      setSelectedIds(new Set());
      fetchProducts();
    } catch {
      toast({ title: 'Loi', description: 'Xoa that bai', variant: 'destructive' });
    }
  }, [selectedIds, fetchProducts, toast]);

  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/api/admin/products/${id}`);
        toast({ title: 'Thanh cong', description: 'Da xoa san pham' });
        fetchProducts();
      } catch {
        toast({ title: 'Loi', description: 'Xoa that bai', variant: 'destructive' });
      }
    },
    [fetchProducts, toast]
  );

  // ----- Export Excel -----
  const exportExcel = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/admin/products/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `san-pham-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Loi', description: 'Xuat file that bai', variant: 'destructive' });
    }
  }, [toast]);

  return {
    products,
    totalCount,
    totalPages,
    isLoading,
    filters,
    updateFilters,
    selectedIds,
    setSelectedIds,
    bulkChangeStatus,
    bulkDelete,
    deleteProduct,
    exportExcel,
    refetch: fetchProducts,
  };
}
```

### 1.2 ProductsListPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/products/page.tsx
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductsList, type ProductListItem } from '@/hooks/admin/use-products-list';
import { useCategoriesList } from '@/hooks/admin/use-categories-list';
import { ProductStatus, ProductStatusLabel, ProductStatusColor } from '@/types';
import { DataTable } from '@/components/admin/shared/data-table';
import { Pagination } from '@/components/admin/shared/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BulkImportDialog } from '@/components/admin/products/bulk-import-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

export default function ProductsListPage() {
  const {
    products,
    totalCount,
    totalPages,
    isLoading,
    filters,
    updateFilters,
    selectedIds,
    setSelectedIds,
    bulkChangeStatus,
    bulkDelete,
    deleteProduct,
    exportExcel,
  } = useProductsList();

  const { categories } = useCategoriesList();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // ----- Toggle select -----
  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [setSelectedIds]
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p._id)));
    }
  }, [selectedIds.size, products, setSelectedIds]);

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">San pham</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quan ly {totalCount} san pham
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Nhap CSV</span>
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuat Excel</span>
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Them san pham
          </Link>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tim san pham theo ten..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Category filter */}
        <Select
          value={filters.category}
          onValueChange={(value) =>
            updateFilters({ category: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Danh muc" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca danh muc</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            updateFilters({ status: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca trang thai</SelectItem>
            {Object.entries(ProductStatusLabel).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split(':') as [string, 'asc' | 'desc'];
            updateFilters({ sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Sap xep" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Moi nhat</SelectItem>
            <SelectItem value="createdAt:asc">Cu nhat</SelectItem>
            <SelectItem value="name:asc">Ten A-Z</SelectItem>
            <SelectItem value="name:desc">Ten Z-A</SelectItem>
            <SelectItem value="basePrice:asc">Gia tang dan</SelectItem>
            <SelectItem value="basePrice:desc">Gia giam dan</SelectItem>
            <SelectItem value="totalStock:asc">Ton kho tang</SelectItem>
            <SelectItem value="totalStock:desc">Ton kho giam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ===== Bulk Actions Bar ===== */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-primary-700">
            Da chon {selectedIds.size} san pham
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                  Doi trang thai
                  <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkChangeStatus(ProductStatus.ACTIVE)}>
                  Kich hoat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkChangeStatus(ProductStatus.DRAFT)}>
                  Nhap
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkChangeStatus(ProductStatus.INACTIVE)}>
                  Ngung ban
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setDeleteTarget('bulk')}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Xoa
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Bo chon
            </button>
          </div>
        </div>
      )}

      {/* ===== DataTable ===== */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {/* Checkbox */}
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  San pham
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-center font-medium text-gray-500">
                  SKU
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Gia co ban
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-center font-medium text-gray-500">
                  Ton kho
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">
                  Trang thai
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">
                  Thao tac
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  isSelected={selectedIds.has(product._id)}
                  onToggleSelect={toggleSelect}
                  onDelete={() => setDeleteTarget(product._id)}
                />
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Khong tim thay san pham nao
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

      {/* ===== Confirm Delete Dialog ===== */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget === 'bulk') {
            bulkDelete();
          } else if (deleteTarget) {
            deleteProduct(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Xac nhan xoa"
        description={
          deleteTarget === 'bulk'
            ? `Ban co chac muon xoa ${selectedIds.size} san pham da chon?`
            : 'Ban co chac muon xoa san pham nay? Hanh dong nay khong the hoan tac.'
        }
        variant="destructive"
      />

      {/* ===== Bulk Import Dialog ===== */}
      <BulkImportDialog
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => {
          setShowBulkImport(false);
          // refetch handled inside dialog
        }}
      />
    </div>
  );
}

// ============================================================
// ProductRow - Dong san pham trong bang
// ============================================================
interface ProductRowProps {
  product: ProductListItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: () => void;
}

function ProductRow({
  product,
  isSelected,
  onToggleSelect,
  onDelete,
}: ProductRowProps) {
  const statusColor = ProductStatusColor[product.status] || 'gray';

  return (
    <tr className={cn('hover:bg-gray-50/50 transition-colors', isSelected && 'bg-primary-50/30')}>
      {/* Checkbox */}
      <td className="w-12 px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(product._id)}
          className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
        />
      </td>

      {/* Product info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
            <Image
              src={product.mainImage || '/images/placeholder.webp'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/products/${product._id}/edit`}
              className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
            >
              {product.name}
            </Link>
            <p className="text-xs text-gray-500 truncate">
              {product.categoryName}
            </p>
          </div>
        </div>
      </td>

      {/* SKU count */}
      <td className="hidden md:table-cell px-4 py-3 text-center text-gray-600">
        {product.skuCount}
      </td>

      {/* Base price */}
      <td className="px-4 py-3 text-right font-medium text-gray-900">
        {product.basePrice.toLocaleString('vi-VN')}d
      </td>

      {/* Total stock */}
      <td className="hidden sm:table-cell px-4 py-3 text-center">
        <span
          className={cn(
            'text-sm font-medium',
            product.totalStock <= 5 ? 'text-red-600' : 'text-gray-700'
          )}
        >
          {product.totalStock}
        </span>
      </td>

      {/* Status badge */}
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            `bg-${statusColor}-50 text-${statusColor}-700`
          )}
        >
          {ProductStatusLabel[product.status]}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product._id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Chinh sua
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xoa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
```

---

## 2. ProductCreatePage - Them san pham moi

> File: `apps/fe/src/app/(admin)/products/new/page.tsx`
> Wrapper goi ProductFormTabs voi mode = 'create'.

```tsx
// ============================================================
// apps/fe/src/app/(admin)/products/new/page.tsx
// ============================================================
'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { ProductFormTabs, type ProductFormData } from '@/components/admin/products/product-form-tabs';

export default function ProductCreatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (data: ProductFormData, asDraft: boolean) => {
    try {
      const payload = {
        ...data,
        status: asDraft ? 'draft' : 'active',
      };

      const res = await apiClient.post('/api/admin/products', payload);

      toast({
        title: 'Thanh cong',
        description: asDraft
          ? 'San pham da duoc luu nhap'
          : 'San pham da duoc tao',
      });

      router.push(`/admin/products/${res.data._id}/edit`);
    } catch (error: any) {
      toast({
        title: 'Loi tao san pham',
        description: error.response?.data?.message || 'Vui long thu lai',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Them san pham moi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dien day du thong tin san pham
        </p>
      </div>

      <ProductFormTabs mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
```

---

## 3. ProductEditPage - Chinh sua san pham

> File: `apps/fe/src/app/(admin)/products/[id]/edit/page.tsx`
> Fetch du lieu san pham hien tai, truyen vao ProductFormTabs voi mode = 'edit'.

```tsx
// ============================================================
// apps/fe/src/app/(admin)/products/[id]/edit/page.tsx
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { ProductFormTabs, type ProductFormData } from '@/components/admin/products/product-form-tabs';

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<ProductFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ----- Fetch product -----
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiClient.get<ProductFormData>(
          `/api/admin/products/${id}`
        );
        setInitialData(res.data);
      } catch {
        toast({
          title: 'Loi',
          description: 'Khong the tai thong tin san pham',
          variant: 'destructive',
        });
        router.push('/admin/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router, toast]);

  const handleSubmit = async (data: ProductFormData, asDraft: boolean) => {
    try {
      const payload = {
        ...data,
        status: asDraft ? 'draft' : data.status || 'active',
      };

      await apiClient.put(`/api/admin/products/${id}`, payload);

      toast({
        title: 'Thanh cong',
        description: 'San pham da duoc cap nhat',
      });
    } catch (error: any) {
      toast({
        title: 'Loi cap nhat',
        description: error.response?.data?.message || 'Vui long thu lai',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!initialData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chinh sua san pham</h1>
        <p className="text-sm text-gray-500 mt-1">{initialData.name}</p>
      </div>

      <ProductFormTabs
        mode="edit"
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

---

## 4. ProductFormTabs - Form nhieu tab

> File: `apps/fe/src/components/admin/products/product-form-tabs.tsx`
> Form nhieu tab dung React Hook Form + Zod. 4 tab:
> Tab 1: Thong tin co ban
> Tab 2: Bien the (Variants)
> Tab 3: Hinh anh
> Tab 4: SEO & Them

### 4.1 Form Schema & Types

```typescript
// ============================================================
// apps/fe/src/components/admin/products/product-form-schema.ts
// ============================================================
import { z } from 'zod';

// ----- Color variant -----
export const colorSchema = z.object({
  name: z.string().min(1, 'Ten mau la bat buoc'),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ma mau hex khong hop le'),
  colorFamily: z.string().optional(),
  priceModifier: z.number().default(0),
  images: z.array(z.string()).default([]),
});

// ----- Dimension variant -----
export const dimensionSchema = z.object({
  label: z.string().min(1, 'Nhan kich thuoc la bat buoc'),
  width: z.number().positive('Chieu rong phai lon hon 0'),
  depth: z.number().positive('Chieu sau phai lon hon 0'),
  height: z.number().positive('Chieu cao phai lon hon 0'),
  weight: z.number().positive('Can nang phai lon hon 0'),
  priceModifier: z.number().default(0),
});

// ----- Variant row (generated from colors x dimensions) -----
export const variantRowSchema = z.object({
  sku: z.string().min(1, 'SKU la bat buoc'),
  colorIndex: z.number(),
  dimensionIndex: z.number(),
  price: z.number().positive('Gia phai lon hon 0'),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, 'Ton kho khong duoc am'),
});

// ----- SEO -----
export const seoSchema = z.object({
  seoTitle: z.string().max(70, 'Toi da 70 ky tu').optional(),
  seoDescription: z.string().max(160, 'Toi da 160 ky tu').optional(),
});

// ----- Specification -----
export const specificationSchema = z.object({
  warranty: z.string().optional(),
  assembly: z.string().optional(),
  careInstructions: z.string().optional(),
  custom: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ).default([]),
});

// ----- Full product form -----
export const productFormSchema = z.object({
  // Tab 1: Thong tin co ban
  name: z.string().min(1, 'Ten san pham la bat buoc').max(200),
  slug: z.string().min(1, 'Slug la bat buoc'),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Danh muc la bat buoc'),
  brand: z.string().optional(),
  material: z.string().optional(),
  origin: z.string().optional(),
  basePrice: z.number().positive('Gia co ban phai lon hon 0'),
  costPrice: z.number().min(0).optional(),
  tags: z.array(z.string()).default([]),

  // Tab 2: Variants
  colors: z.array(colorSchema).default([]),
  dimensions: z.array(dimensionSchema).default([]),
  variants: z.array(variantRowSchema).default([]),

  // Tab 3: Images
  mainImages: z.array(z.string()).default([]),

  // Tab 4: SEO & Specifications
  seo: seoSchema.default({}),
  specifications: specificationSchema.default({}),

  // Meta
  status: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
```

### 4.2 ProductFormTabs Component

```tsx
// ============================================================
// apps/fe/src/components/admin/products/product-form-tabs.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  Layers,
  ImageIcon,
  Search,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  productFormSchema,
  type ProductFormData,
} from './product-form-schema';
import { ProductBasicInfoTab } from './tabs/product-basic-info-tab';
import { ProductVariantsTab } from './tabs/product-variants-tab';
import { ProductImagesTab } from './tabs/product-images-tab';
import { ProductSeoTab } from './tabs/product-seo-tab';

interface ProductFormTabsProps {
  mode: 'create' | 'edit';
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData, asDraft: boolean) => Promise<void>;
}

const TABS = [
  { id: 'basic', label: 'Thong tin co ban', icon: FileText },
  { id: 'variants', label: 'Bien the', icon: Layers },
  { id: 'images', label: 'Hinh anh', icon: ImageIcon },
  { id: 'seo', label: 'SEO & Them', icon: Search },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Map tab ID -> cac field can validate */
const TAB_FIELDS: Record<TabId, (keyof ProductFormData)[]> = {
  basic: ['name', 'slug', 'category', 'basePrice'],
  variants: ['colors', 'dimensions', 'variants'],
  images: ['mainImages'],
  seo: ['seo', 'specifications'],
};

export function ProductFormTabs({
  mode,
  initialData,
  onSubmit,
}: ProductFormTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabErrors, setTabErrors] = useState<Record<TabId, boolean>>({
    basic: false,
    variants: false,
    images: false,
    seo: false,
  });

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData || {
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      category: '',
      brand: '',
      material: '',
      origin: '',
      basePrice: 0,
      costPrice: 0,
      tags: [],
      colors: [],
      dimensions: [],
      variants: [],
      mainImages: [],
      seo: { seoTitle: '', seoDescription: '' },
      specifications: { warranty: '', assembly: '', careInstructions: '', custom: [] },
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  // ----- Kiem tra tab nao co loi -----
  const checkTabErrors = () => {
    const newTabErrors: Record<TabId, boolean> = {
      basic: false,
      variants: false,
      images: false,
      seo: false,
    };

    for (const [tabId, fields] of Object.entries(TAB_FIELDS) as [TabId, (keyof ProductFormData)[]][]) {
      newTabErrors[tabId] = fields.some((field) => !!errors[field]);
    }

    setTabErrors(newTabErrors);
  };

  // ----- Submit -----
  const handleFormSubmit = async (asDraft: boolean) => {
    setIsSubmitting(true);
    try {
      await handleSubmit(
        async (data) => {
          await onSubmit(data, asDraft);
        },
        () => {
          // Validation failed - highlight tab co loi
          checkTabErrors();
        }
      )();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* ===== Tab Navigation ===== */}
        <div className="flex overflow-x-auto border-b border-gray-200 -mx-4 px-4 lg:mx-0 lg:px-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const hasError = tabErrors[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  hasError && 'text-red-500'
                )}
              >
                {hasError ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===== Tab Content ===== */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:p-6">
          {activeTab === 'basic' && <ProductBasicInfoTab />}
          {activeTab === 'variants' && <ProductVariantsTab />}
          {activeTab === 'images' && <ProductImagesTab />}
          {activeTab === 'seo' && <ProductSeoTab />}
        </div>

        {/* ===== Action Buttons ===== */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => handleFormSubmit(true)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Luu nhap
          </button>
          <button
            type="button"
            onClick={() => handleFormSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tao san pham' : 'Cap nhat'}
          </button>
        </div>
      </div>
    </FormProvider>
  );
}

export type { ProductFormData };
```

---

## 5. Tab 1 - Thong tin co ban

> File: `apps/fe/src/components/admin/products/tabs/product-basic-info-tab.tsx`
> Cac truong: name, slug, shortDescription, description, category, brand, material, origin, basePrice, costPrice, tags.

```tsx
// ============================================================
// apps/fe/src/components/admin/products/tabs/product-basic-info-tab.tsx
// ============================================================
'use client';

import { useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategoriesList } from '@/hooks/admin/use-categories-list';
import { TagInput } from '@/components/ui/tag-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductFormData } from '../product-form-schema';

/** Chuyen ten -> slug (khong dau) */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function ProductBasicInfoTab() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  const { categories } = useCategoriesList();
  const name = watch('name');

  // ----- Auto-generate slug tu name -----
  useEffect(() => {
    if (name) {
      setValue('slug', generateSlug(name), { shouldValidate: true });
    }
  }, [name, setValue]);

  return (
    <div className="space-y-6">
      {/* ===== Row 1: Name + Slug ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Ten san pham <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="VD: Ban an go soi Bac Au"
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm',
              'focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100',
              errors.name ? 'border-red-300' : 'border-gray-200'
            )}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Slug (URL) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('slug')}
            placeholder="ban-an-go-soi-bac-au"
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm font-mono',
              'focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100',
              errors.slug ? 'border-red-300' : 'border-gray-200'
            )}
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <Info className="h-3 w-3" />
            Tu dong sinh tu ten san pham, co the chinh sua
          </p>
        </div>
      </div>

      {/* ===== Short Description ===== */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Mo ta ngan
        </label>
        <textarea
          {...register('shortDescription')}
          rows={2}
          placeholder="Mo ta ngan gon ve san pham (hien thi tren danh sach)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
        />
      </div>

      {/* ===== Description (Rich text or Textarea) ===== */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Mo ta chi tiet
        </label>
        <textarea
          {...register('description')}
          rows={6}
          placeholder="Mo ta day du ve san pham, chat lieu, tinh nang noi bat..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-y"
        />
        <p className="mt-1 text-xs text-gray-400">
          Ho tro HTML co ban. Co the tich hop TipTap rich text editor.
        </p>
      </div>

      {/* ===== Row 2: Category + Brand + Material + Origin ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Danh muc <span className="text-red-500">*</span>
          </label>
          <Select
            value={watch('category')}
            onValueChange={(value) =>
              setValue('category', value, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className={cn(errors.category && 'border-red-300')}
            >
              <SelectValue placeholder="Chon danh muc" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.depth > 0 && '— '.repeat(cat.depth)}
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="mt-1 text-xs text-red-500">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Thuong hieu
          </label>
          <input
            {...register('brand')}
            placeholder="VD: Moho"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Material */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Chat lieu
          </label>
          <input
            {...register('material')}
            placeholder="VD: Go soi tu nhien"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Origin */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Xuat xu
          </label>
          <input
            {...register('origin')}
            placeholder="VD: Viet Nam"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* ===== Row 3: Base Price + Cost Price ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Base Price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Gia co ban (VND) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              {...register('basePrice', { valueAsNumber: true })}
              placeholder="0"
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 pr-10 text-sm',
                'focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100',
                errors.basePrice ? 'border-red-300' : 'border-gray-200'
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              d
            </span>
          </div>
          {errors.basePrice && (
            <p className="mt-1 text-xs text-red-500">
              {errors.basePrice.message}
            </p>
          )}
        </div>

        {/* Cost Price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Gia von (VND)
          </label>
          <div className="relative">
            <input
              type="number"
              {...register('costPrice', { valueAsNumber: true })}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              d
            </span>
          </div>
        </div>
      </div>

      {/* ===== Tags ===== */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Tags
        </label>
        <TagInput
          value={watch('tags')}
          onChange={(tags) => setValue('tags', tags)}
          placeholder="Nhap tag va nhan Enter..."
        />
        <p className="mt-1 text-xs text-gray-400">
          VD: go-tu-nhien, bac-au, phong-khach
        </p>
      </div>
    </div>
  );
}
```

---

## 6. Tab 2 - Bien the (Variants)

> File: `apps/fe/src/components/admin/products/tabs/product-variants-tab.tsx`
> Them mau sac (color), kich thuoc (dimension).
> Auto-generate ma tran variants: moi to hop color x dimension = 1 variant row.
> Variants table: SKU, color, dimension, price, cost, stock - chinh sua inline.

```tsx
// ============================================================
// apps/fe/src/components/admin/products/tabs/product-variants-tab.tsx
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Wand2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFormData } from '../product-form-schema';

export function ProductVariantsTab() {
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  const {
    fields: colorFields,
    append: appendColor,
    remove: removeColor,
  } = useFieldArray({ control, name: 'colors' });

  const {
    fields: dimensionFields,
    append: appendDimension,
    remove: removeDimension,
  } = useFieldArray({ control, name: 'dimensions' });

  const {
    fields: variantFields,
    replace: replaceVariants,
  } = useFieldArray({ control, name: 'variants' });

  const colors = watch('colors');
  const dimensions = watch('dimensions');
  const basePrice = watch('basePrice');

  // ----- Them mau moi -----
  const handleAddColor = useCallback(() => {
    appendColor({
      name: '',
      hexCode: '#8B4513',
      colorFamily: '',
      priceModifier: 0,
      images: [],
    });
  }, [appendColor]);

  // ----- Them kich thuoc moi -----
  const handleAddDimension = useCallback(() => {
    appendDimension({
      label: '',
      width: 0,
      depth: 0,
      height: 0,
      weight: 0,
      priceModifier: 0,
    });
  }, [appendDimension]);

  // ----- Auto-generate variants matrix -----
  const handleGenerateVariants = useCallback(() => {
    const newVariants: ProductFormData['variants'] = [];

    if (colors.length === 0 && dimensions.length === 0) return;

    const colorsToUse = colors.length > 0 ? colors : [null];
    const dimsToUse = dimensions.length > 0 ? dimensions : [null];

    let index = 0;
    for (let ci = 0; ci < colorsToUse.length; ci++) {
      for (let di = 0; di < dimsToUse.length; di++) {
        const color = colorsToUse[ci];
        const dim = dimsToUse[di];

        // Tinh gia = basePrice + color modifier + dimension modifier
        const price =
          (basePrice || 0) +
          (color?.priceModifier || 0) +
          (dim?.priceModifier || 0);

        // Tao SKU tu: SP-{colorName}-{dimLabel}
        const skuParts = ['SP'];
        if (color) skuParts.push(color.name.substring(0, 3).toUpperCase());
        if (dim) skuParts.push(dim.label.substring(0, 5).toUpperCase());
        skuParts.push(String(index + 1).padStart(3, '0'));

        newVariants.push({
          sku: skuParts.join('-'),
          colorIndex: color ? ci : -1,
          dimensionIndex: dim ? di : -1,
          price: Math.max(0, price),
          costPrice: 0,
          stock: 0,
        });

        index++;
      }
    }

    replaceVariants(newVariants);
  }, [colors, dimensions, basePrice, replaceVariants]);

  return (
    <div className="space-y-8">
      {/* ===== Colors Section ===== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="h-4.5 w-4.5 text-primary-500" />
              Mau sac
            </h3>
            <p className="text-sm text-gray-500">Them cac tuy chon mau cho san pham</p>
          </div>
          <button
            type="button"
            onClick={handleAddColor}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Them mau
          </button>
        </div>

        {colorFields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-400">Chua co mau nao. Bam "Them mau" de bat dau.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {colorFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-wrap items-start gap-3 rounded-lg border border-gray-200 p-4"
              >
                {/* Color preview */}
                <div
                  className="h-10 w-10 flex-shrink-0 rounded-lg border border-gray-200"
                  style={{ backgroundColor: watch(`colors.${index}.hexCode`) }}
                />

                {/* Name */}
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 block text-xs text-gray-500">Ten mau</label>
                  <input
                    {...register(`colors.${index}.name`)}
                    placeholder="VD: Nau go soi"
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-primary-300 focus:outline-none"
                  />
                </div>

                {/* Hex code */}
                <div className="w-[110px]">
                  <label className="mb-1 block text-xs text-gray-500">Ma mau</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={watch(`colors.${index}.hexCode`)}
                      onChange={(e) =>
                        setValue(`colors.${index}.hexCode`, e.target.value)
                      }
                      className="h-8 w-8 cursor-pointer rounded border-0"
                    />
                    <input
                      {...register(`colors.${index}.hexCode`)}
                      className="w-[75px] rounded-md border border-gray-200 px-2 py-1.5 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Color family */}
                <div className="w-[120px]">
                  <label className="mb-1 block text-xs text-gray-500">Nhom mau</label>
                  <input
                    {...register(`colors.${index}.colorFamily`)}
                    placeholder="VD: Nau"
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Price modifier */}
                <div className="w-[120px]">
                  <label className="mb-1 block text-xs text-gray-500">Chenh lech gia</label>
                  <input
                    type="number"
                    {...register(`colors.${index}.priceModifier`, { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="mt-5 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  title="Xoa mau nay"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Dimensions Section ===== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Kich thuoc
            </h3>
            <p className="text-sm text-gray-500">Them cac tuy chon kich thuoc (W x D x H)</p>
          </div>
          <button
            type="button"
            onClick={handleAddDimension}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Them kich thuoc
          </button>
        </div>

        {dimensionFields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-400">Chua co kich thuoc nao.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dimensionFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-wrap items-start gap-3 rounded-lg border border-gray-200 p-4"
              >
                {/* Label */}
                <div className="flex-1 min-w-[120px]">
                  <label className="mb-1 block text-xs text-gray-500">Nhan</label>
                  <input
                    {...register(`dimensions.${index}.label`)}
                    placeholder="VD: 180x90x75"
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Width */}
                <div className="w-[80px]">
                  <label className="mb-1 block text-xs text-gray-500">Rong (cm)</label>
                  <input
                    type="number"
                    {...register(`dimensions.${index}.width`, { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Depth */}
                <div className="w-[80px]">
                  <label className="mb-1 block text-xs text-gray-500">Sau (cm)</label>
                  <input
                    type="number"
                    {...register(`dimensions.${index}.depth`, { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Height */}
                <div className="w-[80px]">
                  <label className="mb-1 block text-xs text-gray-500">Cao (cm)</label>
                  <input
                    type="number"
                    {...register(`dimensions.${index}.height`, { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Weight */}
                <div className="w-[80px]">
                  <label className="mb-1 block text-xs text-gray-500">Nang (kg)</label>
                  <input
                    type="number"
                    {...register(`dimensions.${index}.weight`, { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Price modifier */}
                <div className="w-[110px]">
                  <label className="mb-1 block text-xs text-gray-500">Chenh lech gia</label>
                  <input
                    type="number"
                    {...register(`dimensions.${index}.priceModifier`, { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeDimension(index)}
                  className="mt-5 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Generate Variants Button ===== */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerateVariants}
          disabled={colors.length === 0 && dimensions.length === 0}
          className="flex items-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wand2 className="h-4 w-4" />
          Tu dong tao bien the ({colors.length || 1} x {dimensions.length || 1} ={' '}
          {Math.max(1, colors.length) * Math.max(1, dimensions.length)})
        </button>
        <p className="text-xs text-gray-400">
          Ma tran: moi to hop mau + kich thuoc = 1 bien the
        </p>
      </div>

      {/* ===== Variants Table ===== */}
      {variantFields.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-semibold text-gray-900">
            Bang bien the ({variantFields.length})
          </h3>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">SKU</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Mau</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500">Kich thuoc</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500">Gia ban</th>
                  <th className="hidden sm:table-cell px-3 py-2.5 text-right font-medium text-gray-500">Gia von</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500">Ton kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variantFields.map((field, index) => {
                  const colorIdx = watch(`variants.${index}.colorIndex`);
                  const dimIdx = watch(`variants.${index}.dimensionIndex`);
                  const colorName = colorIdx >= 0 ? colors[colorIdx]?.name : '—';
                  const dimLabel = dimIdx >= 0 ? dimensions[dimIdx]?.label : '—';

                  return (
                    <tr key={field.id} className="hover:bg-gray-50/50">
                      {/* SKU */}
                      <td className="px-3 py-2">
                        <input
                          {...register(`variants.${index}.sku`)}
                          className="w-[120px] rounded border border-gray-200 px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary-300"
                        />
                      </td>
                      {/* Color */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {colorIdx >= 0 && (
                            <div
                              className="h-4 w-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: colors[colorIdx]?.hexCode }}
                            />
                          )}
                          <span className="text-xs text-gray-700">{colorName}</span>
                        </div>
                      </td>
                      {/* Dimension */}
                      <td className="px-3 py-2 text-xs text-gray-700">{dimLabel}</td>
                      {/* Price */}
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          {...register(`variants.${index}.price`, { valueAsNumber: true })}
                          className="w-[100px] rounded border border-gray-200 px-2 py-1 text-xs text-right focus:outline-none focus:border-primary-300"
                        />
                      </td>
                      {/* Cost */}
                      <td className="hidden sm:table-cell px-3 py-2 text-right">
                        <input
                          type="number"
                          {...register(`variants.${index}.costPrice`, { valueAsNumber: true })}
                          className="w-[100px] rounded border border-gray-200 px-2 py-1 text-xs text-right focus:outline-none focus:border-primary-300"
                        />
                      </td>
                      {/* Stock */}
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                          className="w-[70px] rounded border border-gray-200 px-2 py-1 text-xs text-right focus:outline-none focus:border-primary-300"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 7. Tab 3 - Hinh anh

> File: `apps/fe/src/components/admin/products/tabs/product-images-tab.tsx`
> Upload anh chinh (drag & drop, reorder), anh theo mau sac.
> Dung ImageUploadManager component.

```tsx
// ============================================================
// apps/fe/src/components/admin/products/tabs/product-images-tab.tsx
// ============================================================
'use client';

import { useFormContext } from 'react-hook-form';
import { ImageIcon, Palette } from 'lucide-react';
import { ImageUploadManager } from '@/components/admin/products/image-upload-manager';
import type { ProductFormData } from '../product-form-schema';

export function ProductImagesTab() {
  const { watch, setValue } = useFormContext<ProductFormData>();

  const mainImages = watch('mainImages');
  const colors = watch('colors');

  return (
    <div className="space-y-8">
      {/* ===== Main Images ===== */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="h-4.5 w-4.5 text-primary-500" />
            Hinh anh chinh
          </h3>
          <p className="text-sm text-gray-500">
            Keo tha de thay doi thu tu. Anh dau tien se la anh dai dien.
          </p>
        </div>

        <ImageUploadManager
          images={mainImages}
          onChange={(images) => setValue('mainImages', images)}
          maxFiles={10}
          category="product"
        />
      </section>

      {/* ===== Color-specific Images ===== */}
      {colors.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="h-4.5 w-4.5 text-primary-500" />
              Hinh anh theo mau
            </h3>
            <p className="text-sm text-gray-500">
              Upload hinh rieng cho tung mau sac
            </p>
          </div>

          <div className="space-y-6">
            {colors.map((color, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {color.name || `Mau ${index + 1}`}
                  </span>
                </div>

                <ImageUploadManager
                  images={color.images || []}
                  onChange={(images) =>
                    setValue(`colors.${index}.images`, images)
                  }
                  maxFiles={5}
                  category="product-color"
                  compact
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 8. Tab 4 - SEO & Them

> File: `apps/fe/src/components/admin/products/tabs/product-seo-tab.tsx`
> SEO title, description. Thong so ky thuat: bao hanh, lap dat, huong dan bao quan.

```tsx
// ============================================================
// apps/fe/src/components/admin/products/tabs/product-seo-tab.tsx
// ============================================================
'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Search, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFormData } from '../product-form-schema';

export function ProductSeoTab() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormData>();

  const {
    fields: customSpecFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({
    control,
    name: 'specifications.custom',
  });

  const seoTitle = watch('seo.seoTitle') || '';
  const seoDescription = watch('seo.seoDescription') || '';

  return (
    <div className="space-y-8">
      {/* ===== SEO Section ===== */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Search className="h-4.5 w-4.5 text-primary-500" />
            SEO (Tim kiem)
          </h3>
          <p className="text-sm text-gray-500">
            Toi uu hien thi tren Google va mang xa hoi
          </p>
        </div>

        <div className="space-y-4">
          {/* SEO Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              SEO Title
            </label>
            <input
              {...register('seo.seoTitle')}
              placeholder="Tieu de hien thi tren Google (mac dinh dung ten san pham)"
              maxLength={70}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-400">Toi da 70 ky tu</p>
              <span
                className={cn(
                  'text-xs',
                  seoTitle.length > 70 ? 'text-red-500' : 'text-gray-400'
                )}
              >
                {seoTitle.length}/70
              </span>
            </div>
          </div>

          {/* SEO Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              SEO Description
            </label>
            <textarea
              {...register('seo.seoDescription')}
              rows={3}
              placeholder="Mo ta hien thi tren Google (mac dinh dung mo ta ngan)"
              maxLength={160}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-400">Toi da 160 ky tu</p>
              <span
                className={cn(
                  'text-xs',
                  seoDescription.length > 160
                    ? 'text-red-500'
                    : 'text-gray-400'
                )}
              >
                {seoDescription.length}/160
              </span>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-400 mb-2">Xem truoc tren Google:</p>
            <div>
              <p className="text-lg text-blue-700 hover:underline cursor-pointer leading-tight">
                {seoTitle || 'Tieu de san pham'}
              </p>
              <p className="text-sm text-green-700 mt-0.5">
                noithatvn.com/products/slug-san-pham
              </p>
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                {seoDescription || 'Mo ta san pham se hien thi o day...'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Specifications Section ===== */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-4.5 w-4.5 text-primary-500" />
            Thong so ky thuat
          </h3>
        </div>

        <div className="space-y-4">
          {/* Warranty */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Bao hanh
            </label>
            <input
              {...register('specifications.warranty')}
              placeholder="VD: 24 thang bao hanh chinh hang"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Assembly */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Lap dat
            </label>
            <input
              {...register('specifications.assembly')}
              placeholder="VD: Mien phi lap dat tai TP.HCM"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Care Instructions */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Huong dan bao quan
            </label>
            <textarea
              {...register('specifications.careInstructions')}
              rows={2}
              placeholder="VD: Lau bang khan am mem, tranh tiep xuc truc tiep voi nuoc..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>

          {/* Custom Specifications */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Thong so them
              </label>
              <button
                type="button"
                onClick={() => appendSpec({ key: '', value: '' })}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Them dong
              </button>
            </div>

            {customSpecFields.length > 0 && (
              <div className="space-y-2">
                {customSpecFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      {...register(`specifications.custom.${index}.key`)}
                      placeholder="Ten thong so"
                      className="flex-1 rounded-md border border-gray-200 px-2.5 py-2 text-sm focus:outline-none focus:border-primary-300"
                    />
                    <input
                      {...register(`specifications.custom.${index}.value`)}
                      placeholder="Gia tri"
                      className="flex-1 rounded-md border border-gray-200 px-2.5 py-2 text-sm focus:outline-none focus:border-primary-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(index)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## 9. ImageUploadManager

> File: `apps/fe/src/components/admin/products/image-upload-manager.tsx`
> Component dung chung: drag & drop upload, preview grid, reorder, xoa.
> Upload len Google Drive qua uploadService.

```tsx
// ============================================================
// apps/fe/src/components/admin/products/image-upload-manager.tsx
// ============================================================
'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, GripVertical, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadService, type UploadProgress } from '@/lib/upload-service';

interface ImageUploadManagerProps {
  /** Danh sach URL anh hien tai */
  images: string[];

  /** Callback khi thay doi (them, xoa, reorder) */
  onChange: (images: string[]) => void;

  /** So file toi da */
  maxFiles?: number;

  /** Upload category (product, category, avatar, ...) */
  category: string;

  /** Che do compact (cho color images) */
  compact?: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
}

export function ImageUploadManager({
  images,
  onChange,
  maxFiles = 10,
  category,
  compact = false,
}: ImageUploadManagerProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ----- Xu ly upload -----
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxFiles - images.length;

      if (remaining <= 0) return;
      const filesToUpload = fileArray.slice(0, remaining);

      // Tao preview + them vao uploading list
      const newUploading: UploadingFile[] = filesToUpload.map((file) => ({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploading]);

      // Upload tung file
      const uploadedUrls: string[] = [];
      for (const item of newUploading) {
        try {
          const url = await uploadService.upload(item.file, category, {
            onProgress: (progress: number) => {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id ? { ...f, progress } : f
                )
              );
            },
          });
          uploadedUrls.push(url);
        } catch (error) {
          console.error('Upload failed:', error);
        } finally {
          // Don dep preview
          URL.revokeObjectURL(item.preview);
          setUploadingFiles((prev) => prev.filter((f) => f.id !== item.id));
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    },
    [images, maxFiles, category, onChange]
  );

  // ----- Drag & drop file vao zone -----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // ----- Xoa anh -----
  const handleRemove = useCallback(
    (index: number) => {
      const newImages = [...images];
      newImages.splice(index, 1);
      onChange(newImages);
    },
    [images, onChange]
  );

  // ----- Reorder (dnd-kit) -----
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(images, oldIndex, newIndex));
      }
    },
    [images, onChange]
  );

  const canUploadMore = images.length + uploadingFiles.length < maxFiles;
  const imgSize = compact ? 'h-20 w-20' : 'h-28 w-28';

  return (
    <div className="space-y-3">
      {/* ===== Image Grid (Sortable) ===== */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className={cn('flex flex-wrap gap-3', compact && 'gap-2')}>
            {/* Existing images */}
            {images.map((url, index) => (
              <SortableImageItem
                key={url}
                id={url}
                url={url}
                index={index}
                isFirst={index === 0 && !compact}
                size={imgSize}
                onRemove={() => handleRemove(index)}
              />
            ))}

            {/* Uploading previews */}
            {uploadingFiles.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'relative overflow-hidden rounded-lg border border-gray-200',
                  imgSize
                )}
              >
                <Image
                  src={item.preview}
                  alt="Uploading"
                  fill
                  className="object-cover opacity-50"
                />
                {/* Progress overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                    <span className="text-xs font-medium text-gray-700">
                      {item.progress}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-primary-500 transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Upload zone */}
            {canUploadMore && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 border-dashed',
                  'transition-colors cursor-pointer',
                  imgSize,
                  isDraggingOver
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                )}
              >
                <Upload className="h-5 w-5 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-400 text-center px-1">
                  Keo tha hoac bam
                </span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Info text */}
      <p className="text-xs text-gray-400">
        Toi da {maxFiles} anh. JPG, PNG, WebP. Toi da 5MB/anh.
        {!compact && ' Keo de thay doi thu tu. Anh dau tien la anh dai dien.'}
      </p>
    </div>
  );
}

// ============================================================
// SortableImageItem - Anh co the keo tha
// ============================================================
interface SortableImageItemProps {
  id: string;
  url: string;
  index: number;
  isFirst: boolean;
  size: string;
  onRemove: () => void;
}

function SortableImageItem({
  id,
  url,
  index,
  isFirst,
  size,
  onRemove,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative overflow-hidden rounded-lg border border-gray-200',
        size,
        isDragging && 'opacity-50 shadow-lg',
        isFirst && 'ring-2 ring-primary-300'
      )}
    >
      <Image
        src={url}
        alt={`Anh ${index + 1}`}
        fill
        className="object-cover"
        sizes="112px"
      />

      {/* First badge */}
      {isFirst && (
        <div className="absolute top-1 left-1 rounded bg-primary-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
          Chinh
        </div>
      )}

      {/* Hover overlay voi actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="rounded p-1 text-white hover:bg-white/20 cursor-grab active:cursor-grabbing"
          title="Keo de doi vi tri"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-white hover:bg-red-500/80"
          title="Xoa anh"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

---

## 10. CategoriesPage - Quan ly danh muc

> File: `apps/fe/src/app/(admin)/categories/page.tsx`
> Tree view: danh muc cha-con co the mo rong.
> Moi node: name, slug, product count, active badge, sortOrder.
> Actions: edit (dialog), them con, xoa.
> Button "Them danh muc" -> CategoryFormDialog.
> Phan combo categories o cuoi.

### 10.1 Categories Hook

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-categories-admin.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export interface CategoryTreeItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  isCombo: boolean;
  sortOrder: number;
  productCount: number;
  depth: number;
  parentId?: string;
  children: CategoryTreeItem[];
  tags?: string[];
}

export function useCategoriesAdmin() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryTreeItem[]>([]);
  const [comboCategories, setComboCategories] = useState<CategoryTreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{
        tree: CategoryTreeItem[];
        combos: CategoryTreeItem[];
      }>('/api/admin/categories/tree');

      setCategories(res.data.tree);
      setComboCategories(res.data.combos);
    } catch {
      toast({
        title: 'Loi',
        description: 'Khong the tai danh muc',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(
    async (data: Partial<CategoryTreeItem>) => {
      const res = await apiClient.post('/api/admin/categories', data);
      toast({ title: 'Thanh cong', description: 'Da tao danh muc' });
      fetchCategories();
      return res.data;
    },
    [fetchCategories, toast]
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<CategoryTreeItem>) => {
      await apiClient.put(`/api/admin/categories/${id}`, data);
      toast({ title: 'Thanh cong', description: 'Da cap nhat danh muc' });
      fetchCategories();
    },
    [fetchCategories, toast]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await apiClient.delete(`/api/admin/categories/${id}`);
      toast({ title: 'Thanh cong', description: 'Da xoa danh muc' });
      fetchCategories();
    },
    [fetchCategories, toast]
  );

  return {
    categories,
    comboCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
```

### 10.2 CategoriesPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/categories/page.tsx
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Pencil,
  Trash2,
  FolderPlus,
  GripVertical,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCategoriesAdmin,
  type CategoryTreeItem,
} from '@/hooks/admin/use-categories-admin';
import { CategoryFormDialog } from '@/components/admin/categories/category-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoriesPage() {
  const {
    categories,
    comboCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesAdmin();

  // ----- Dialog state -----
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    parentId?: string;
    initialData?: CategoryTreeItem;
  }>({
    open: false,
    mode: 'create',
  });

  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeItem | null>(null);

  // ----- Handlers -----
  const handleCreate = useCallback(() => {
    setFormDialog({ open: true, mode: 'create' });
  }, []);

  const handleCreateChild = useCallback((parentId: string) => {
    setFormDialog({ open: true, mode: 'create', parentId });
  }, []);

  const handleEdit = useCallback((category: CategoryTreeItem) => {
    setFormDialog({ open: true, mode: 'edit', initialData: category });
  }, []);

  const handleFormSubmit = useCallback(
    async (data: Partial<CategoryTreeItem>) => {
      if (formDialog.mode === 'create') {
        if (formDialog.parentId) {
          data.parentId = formDialog.parentId;
        }
        await createCategory(data);
      } else if (formDialog.initialData) {
        await updateCategory(formDialog.initialData._id, data);
      }
      setFormDialog({ open: false, mode: 'create' });
    },
    [formDialog, createCategory, updateCategory]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget._id);
    } catch (error: any) {
      // Error toast handled in hook
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteCategory]);

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh muc</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quan ly cay danh muc san pham
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          Them danh muc
        </button>
      </div>

      {/* ===== Category Tree ===== */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-5 py-3 text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-5">Danh muc</div>
            <div className="col-span-1 text-center hidden sm:block">San pham</div>
            <div className="col-span-2 text-center hidden md:block">Slug</div>
            <div className="col-span-1 text-center hidden sm:block">Thu tu</div>
            <div className="col-span-1 text-center">Trang thai</div>
            <div className="col-span-2 text-center">Thao tac</div>
          </div>

          {/* Tree */}
          <div className="divide-y divide-gray-100">
            {categories.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400">
                <FolderTree className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                <p>Chua co danh muc nao</p>
              </div>
            ) : (
              categories.map((category) => (
                <CategoryTreeNode
                  key={category._id}
                  category={category}
                  depth={0}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onCreateChild={handleCreateChild}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== Combo Categories ===== */}
      {comboCategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent-400" />
            Danh muc Combo
          </h2>
          <div className="rounded-xl border border-accent-200 bg-accent-50/30">
            <div className="divide-y divide-accent-100">
              {comboCategories.map((combo) => (
                <div
                  key={combo._id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {combo.name}
                    </p>
                    <p className="text-xs text-gray-500">{combo.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {combo.productCount} san pham
                    </span>
                    <button
                      onClick={() => handleEdit(combo)}
                      className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== Dialogs ===== */}
      <CategoryFormDialog
        open={formDialog.open}
        mode={formDialog.mode}
        initialData={formDialog.initialData}
        parentId={formDialog.parentId}
        onSubmit={handleFormSubmit}
        onClose={() => setFormDialog({ open: false, mode: 'create' })}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoa danh muc"
        description={
          deleteTarget?.children?.length
            ? `Danh muc "${deleteTarget.name}" co ${deleteTarget.children.length} danh muc con. Xoa se chuyen cac danh muc con len cap tren.`
            : `Ban co chac muon xoa danh muc "${deleteTarget?.name}"?`
        }
        variant="destructive"
      />
    </div>
  );
}

// ============================================================
// CategoryTreeNode - Node trong cay danh muc (recursive)
// ============================================================
interface CategoryTreeNodeProps {
  category: CategoryTreeItem;
  depth: number;
  onEdit: (category: CategoryTreeItem) => void;
  onDelete: (category: CategoryTreeItem) => void;
  onCreateChild: (parentId: string) => void;
}

function CategoryTreeNode({
  category,
  depth,
  onEdit,
  onDelete,
  onCreateChild,
}: CategoryTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <div
        className="grid grid-cols-12 gap-4 items-center px-5 py-3 hover:bg-gray-50/50 transition-colors"
        style={{ paddingLeft: `${20 + depth * 28}px` }}
      >
        {/* Name + expand toggle */}
        <div className="col-span-5 flex items-center gap-2 min-w-0">
          {/* Expand/collapse */}
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Placeholder
          )}

          <FolderTree
            className={cn(
              'h-4 w-4 flex-shrink-0',
              depth === 0 ? 'text-primary-500' : 'text-gray-400'
            )}
          />
          <span className="text-sm font-medium text-gray-900 truncate">
            {category.name}
          </span>
        </div>

        {/* Product count */}
        <div className="col-span-1 text-center hidden sm:block">
          <span className="text-sm text-gray-600">{category.productCount}</span>
        </div>

        {/* Slug */}
        <div className="col-span-2 hidden md:block">
          <span className="text-xs text-gray-400 font-mono truncate block">
            {category.slug}
          </span>
        </div>

        {/* Sort order */}
        <div className="col-span-1 text-center hidden sm:block">
          <span className="text-xs text-gray-500">{category.sortOrder}</span>
        </div>

        {/* Active badge */}
        <div className="col-span-1 text-center">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
              category.isActive
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {category.isActive ? 'Active' : 'Off'}
          </span>
        </div>

        {/* Actions */}
        <div className="col-span-2 flex items-center justify-center gap-1">
          <button
            onClick={() => onCreateChild(category._id)}
            className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
            title="Them danh muc con"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Chinh sua"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="Xoa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <>
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              category={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
            />
          ))}
        </>
      )}
    </>
  );
}
```

---

## 11. CategoryFormDialog

> File: `apps/fe/src/components/admin/categories/category-form-dialog.tsx`
> Dialog them/sua danh muc: name, parent select, description, image, isCombo, tags.

```tsx
// ============================================================
// apps/fe/src/components/admin/categories/category-form-dialog.tsx
// ============================================================
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { ImageUploadManager } from '@/components/admin/products/image-upload-manager';
import { useCategoriesList } from '@/hooks/admin/use-categories-list';
import type { CategoryTreeItem } from '@/hooks/admin/use-categories-admin';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Ten danh muc la bat buoc'),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  isCombo: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: CategoryTreeItem;
  parentId?: string;
  onSubmit: (data: Partial<CategoryTreeItem>) => Promise<void>;
  onClose: () => void;
}

export function CategoryFormDialog({
  open,
  mode,
  initialData,
  parentId,
  onSubmit,
  onClose,
}: CategoryFormDialogProps) {
  const { categories: flatCategories } = useCategoriesList();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
      parentId: '',
      isActive: true,
      isCombo: false,
      sortOrder: 0,
      tags: [],
    },
  });

  // ----- Reset form khi mo dialog -----
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || '',
          image: initialData.image || '',
          parentId: initialData.parentId || '',
          isActive: initialData.isActive,
          isCombo: initialData.isCombo,
          sortOrder: initialData.sortOrder,
          tags: initialData.tags || [],
        });
      } else {
        reset({
          name: '',
          description: '',
          image: '',
          parentId: parentId || '',
          isActive: true,
          isCombo: false,
          sortOrder: 0,
          tags: [],
        });
      }
    }
  }, [open, mode, initialData, parentId, reset]);

  const onFormSubmit = async (data: CategoryFormValues) => {
    await onSubmit(data);
  };

  const image = watch('image');

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Them danh muc' : 'Chinh sua danh muc'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Ten danh muc <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="VD: Ban an"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Parent category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Danh muc cha
            </label>
            <Select
              value={watch('parentId') || 'none'}
              onValueChange={(val) =>
                setValue('parentId', val === 'none' ? '' : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Khong co (danh muc goc)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Khong co (danh muc goc)</SelectItem>
                {flatCategories
                  .filter(
                    (c) => c._id !== initialData?._id // Khong cho chon chinh no
                  )
                  .map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {'— '.repeat(cat.depth)}{cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Mo ta
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Mo ta ngan ve danh muc..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Hinh anh
            </label>
            <ImageUploadManager
              images={image ? [image] : []}
              onChange={(imgs) => setValue('image', imgs[0] || '')}
              maxFiles={1}
              category="category"
              compact
            />
          </div>

          {/* Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Thu tu sap xep
              </label>
              <input
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none"
              />
            </div>

            {/* isCombo toggle */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isCombo')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                />
                <span className="text-sm text-gray-700">La danh muc Combo</span>
              </label>
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
            />
            <span className="text-sm text-gray-700">Kich hoat</span>
          </label>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tags
            </label>
            <TagInput
              value={watch('tags')}
              onChange={(tags) => setValue('tags', tags)}
              placeholder="Nhap tag..."
            />
          </div>

          {/* Footer */}
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Tao' : 'Cap nhat'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 12. BulkImport Dialog

> File: `apps/fe/src/components/admin/products/bulk-import-dialog.tsx`
> Upload file CSV, preview bang du lieu, hien thi loi validation, confirm import.

```tsx
// ============================================================
// apps/fe/src/components/admin/products/bulk-import-dialog.tsx
// ============================================================
'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'done';

export function BulkImportDialog({
  open,
  onClose,
  onSuccess,
}: BulkImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  // ----- Reset khi dong -----
  const handleClose = useCallback(() => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setErrors([]);
    setImportProgress(0);
    setImportResult(null);
    onClose();
  }, [onClose]);

  // ----- Xu ly file CSV -----
  const handleFileChange = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);

      try {
        // Gui file de validate + preview
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await apiClient.post<{
          preview: ImportPreview;
          errors: ValidationError[];
        }>('/api/admin/products/import/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setPreview(res.data.preview);
        setErrors(res.data.errors);
        setStep('preview');
      } catch (error: any) {
        toast({
          title: 'Loi doc file',
          description: error.response?.data?.message || 'File khong hop le',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // ----- Confirm import -----
  const handleImport = useCallback(async () => {
    if (!file) return;

    setStep('importing');
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<{
        success: number;
        failed: number;
      }>('/api/admin/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setImportProgress(percent);
          }
        },
      });

      setImportResult(res.data);
      setStep('done');

      if (res.data.success > 0) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Loi import',
        description: error.response?.data?.message || 'Import that bai',
        variant: 'destructive',
      });
      setStep('preview');
    }
  }, [file, toast, onSuccess]);

  // ----- Tai file mau -----
  const downloadTemplate = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/admin/products/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'san-pham-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast({ title: 'Loi', description: 'Khong the tai file mau', variant: 'destructive' });
    }
  }, [toast]);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nhap san pham tu CSV</DialogTitle>
        </DialogHeader>

        {/* ===== Step 1: Upload ===== */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Upload zone */}
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-10 hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Keo tha file CSV vao day
              </p>
              <p className="text-xs text-gray-400 mt-1">
                hoac bam de chon file
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Download template */}
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <Download className="h-4 w-4" />
              Tai file CSV mau
            </button>
          </div>
        )}

        {/* ===== Step 2: Preview ===== */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{file?.name}</p>
                <p className="text-xs text-gray-500">
                  {preview.totalRows} dong du lieu
                </p>
              </div>
              <button
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setPreview(null);
                  setErrors([]);
                }}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    {errors.length} loi can sua
                  </span>
                </div>
                <ul className="space-y-1 max-h-[150px] overflow-y-auto">
                  {errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">
                      Dong {err.row}, cot "{err.column}": {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                    {preview.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.rows.slice(0, 20).map((row, ri) => {
                    const rowErrors = errors.filter((e) => e.row === ri + 1);
                    const hasError = rowErrors.length > 0;

                    return (
                      <tr
                        key={ri}
                        className={cn(hasError && 'bg-red-50/50')}
                      >
                        <td className="px-3 py-2 text-gray-400">{ri + 1}</td>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[150px] truncate"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {preview.totalRows > 20 && (
                <div className="px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                  Hien thi 20/{preview.totalRows} dong
                </div>
              )}
            </div>

            {/* Actions */}
            <DialogFooter>
              <button
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Huy
              </button>
              <button
                onClick={handleImport}
                disabled={errors.length > 0}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                Nhap {preview.totalRows} san pham
              </button>
            </DialogFooter>
          </div>
        )}

        {/* ===== Step 3: Importing ===== */}
        {step === 'importing' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
            <p className="text-sm font-medium text-gray-900">
              Dang nhap san pham...
            </p>
            <div className="mt-4 w-full max-w-xs">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-center text-gray-400">
                {importProgress}%
              </p>
            </div>
          </div>
        )}

        {/* ===== Step 4: Done ===== */}
        {step === 'done' && importResult && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold text-gray-900">Hoan tat!</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-green-600">
                Thanh cong: {importResult.success}
              </span>
              {importResult.failed > 0 && (
                <span className="text-red-600">
                  That bai: {importResult.failed}
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="mt-6 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Dong
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 13. Responsive Behavior Summary

| Component | Desktop (>= 1024px) | Tablet (768-1023px) | Mobile (< 768px) |
|-----------|---------------------|---------------------|-------------------|
| Product List | Bang day du 7 cot | An cot SKU | An cot SKU, Stock |
| Filters | 1 hang ngang | 2 hang | Stack doc |
| Product Form Tabs | Tab text + icon | Tab text + icon | Chi icon |
| Basic Info Fields | 4 cot (category, brand, material, origin) | 2 cot | 1 cot |
| Variants Table | Day du 6 cot | An cot Cost | An cot Cost |
| Image Grid | 10 anh/hang | 6 anh/hang | 4 anh/hang |
| Category Tree | Day du 6 cot | An cot Slug | An cot Slug, SortOrder, ProductCount |
| Category Dialog | 480px max-width | 480px | Full width |
| Bulk Import | 640px dialog | 640px | Full width, scroll ngang cho bang |
