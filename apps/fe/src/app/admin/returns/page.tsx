'use client';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReturns } from '@/hooks/use-returns';
import { formatDate, formatPrice } from '@/lib/utils';
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'completed', label: 'Hoàn thành' },
];

export default function AdminReturnsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');

  const { data, isLoading } = useReturns({ page, limit: 15, status: status === 'all' ? undefined : status });
  const returns = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'order',
      header: 'Mã đơn',
      cell: ({ row }) => <span className="font-mono font-medium">#{row.original.order?.orderCode}</span>,
    },
    {
      accessorKey: 'customer',
      header: 'Khách hàng',
      cell: ({ row }) => <span>{row.original.customer?.fullName || '—'}</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ row }) => <p className="text-sm text-gray-600 line-clamp-1 max-w-[180px]">{row.original.reason}</p>,
    },
    {
      accessorKey: 'refundAmount',
      header: 'Hoàn tiền',
      cell: ({ row }) => <span className="font-medium">{row.original.refundAmount ? formatPrice(row.original.refundAmount) : '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} type="return" />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày yêu cầu',
      cell: ({ row }) => <span className="text-gray-500">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
          <Link href={`/admin/returns/${row.original._id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Đổi Trả Hàng</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} yêu cầu</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={returns} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
