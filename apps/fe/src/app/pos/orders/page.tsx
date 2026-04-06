'use client';
import { useState } from 'react';
import { formatDate, formatPrice } from '@/lib/utils';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { useOrders } from '@/hooks/use-orders';
import { type ColumnDef } from '@tanstack/react-table';

export default function POSOrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({ page, limit: 15 });
  const orders = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Mã đơn',
      cell: ({ row }) => <span className="font-mono font-medium">#{row.original.orderNumber}</span>,
    },
    {
      accessorKey: 'items',
      header: 'Sản phẩm',
      cell: ({ row }) => <span>{row.original.items?.length || 0} sản phẩm</span>,
    },
    {
      accessorKey: 'total',
      header: 'Tổng tiền',
      cell: ({ row }) => <span className="font-semibold text-primary-600">{formatPrice(row.original.total)}</span>,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Thanh toán',
      cell: ({ row }) => <span>{row.original.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} type="order" />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ row }) => <span className="text-gray-500 text-xs">{formatDate(row.original.createdAt)}</span>,
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold">Đơn Hàng POS</h1>
      <DataTable columns={columns} data={orders} isLoading={isLoading} />
      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
