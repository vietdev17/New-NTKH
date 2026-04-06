'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SearchInput } from '@/components/shared/search-input';
import { PriceDisplay } from '@/components/shared/price-display';
import { useProducts, useDeleteProduct } from '@/hooks/use-products';
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useProducts({ page, limit: 15, search });
  const products = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const deleteProduct = useDeleteProduct();

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-50 shrink-0">
            <Image
              src={row.original.images?.[0] || '/images/placeholder.svg'}
              alt={row.original.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium line-clamp-1">{row.original.name}</p>
            <p className="text-xs text-gray-400">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Danh mục',
      cell: ({ row }) => <span className="text-gray-600">{row.original.categoryId?.name || '—'}</span>,
    },
    {
      accessorKey: 'price',
      header: 'Giá',
      cell: ({ row }) => (
        <PriceDisplay price={row.original.salePrice || row.original.basePrice} originalPrice={row.original.salePrice ? row.original.basePrice : undefined} size="sm" />
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Tồn kho',
      cell: ({ row }) => {
        const totalStock = (row.original.variants || []).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        return (
          <span className={totalStock <= 5 ? 'text-danger-500 font-medium' : ''}>
            {totalStock}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${row.original.status === 'active' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.original.status === 'active' ? 'Đang bán' : row.original.status === 'draft' ? 'Nháp' : 'Ẩn'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
            <Link href={`/admin/products/${row.original._id}/edit`}>
              <Edit className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-danger-400 hover:text-danger-600"
            onClick={() => setDeletingId(row.original._id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sản Phẩm</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} sản phẩm</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/products/create">
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, SKU..."
          className="max-w-sm"
        />
      </div>

      <DataTable columns={columns} data={products} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="Xóa sản phẩm"
        description="Bạn có chắc muốn xóa sản phẩm này? Hành động không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => {
          if (deletingId) {
            deleteProduct.mutate(deletingId, {
              onSuccess: () => toast.success('Đã xóa sản phẩm'),
              onError: () => toast.error('Xóa thất bại'),
            });
          }
          setDeletingId(null);
        }}
      />
    </div>
  );
}
