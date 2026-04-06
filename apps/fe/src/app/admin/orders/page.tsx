'use client';
import Link from 'next/link';
import { Eye, MoreHorizontal, CheckCircle, Truck, XCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { SearchInput } from '@/components/shared/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data, isLoading } = useOrders({ page, limit: 15, search, status: status === 'all' ? undefined : status });
  const updateStatus = useUpdateOrderStatus();
  const orders = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Mã đơn',
      cell: ({ row }) => <span className="font-mono font-medium">#{row.original.orderNumber}</span>,
    },
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.customerName || row.original.customerId?.fullName}</p>
          <p className="text-xs text-gray-400">{row.original.customerEmail || row.original.customerId?.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Tổng tiền',
      cell: ({ row }) => <span className="font-semibold text-primary-600">{formatPrice(row.original.total)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} type="order" />,
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Thanh toán',
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} type="payment" />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày đặt',
      cell: ({ row }) => <span className="text-gray-500">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const o = row.original;
        const handleStatus = (newStatus: string) => {
          updateStatus.mutate({ id: o._id, status: newStatus }, {
            onSuccess: () => toast.success('Đã cập nhật trạng thái'),
            onError: () => toast.error('Cập nhật thất bại'),
          });
        };
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/orders/${o._id}`} className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {o.status === 'pending' && (
                <DropdownMenuItem onClick={() => handleStatus('confirmed')} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-500" /> Xác nhận
                </DropdownMenuItem>
              )}
              {o.status === 'confirmed' && (
                <DropdownMenuItem onClick={() => handleStatus('processing')} className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-orange-500" /> Đang xử lý
                </DropdownMenuItem>
              )}
              {o.status === 'processing' && (
                <DropdownMenuItem onClick={() => handleStatus('shipping')} className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-purple-500" /> Giao hàng
                </DropdownMenuItem>
              )}
              {o.status === 'shipping' && (
                <DropdownMenuItem onClick={() => handleStatus('delivered')} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Đã giao
                </DropdownMenuItem>
              )}
              {['pending', 'confirmed'].includes(o.status) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatus('cancelled')} className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-3.5 w-3.5" /> Hủy đơn
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Đơn Hàng</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} đơn hàng</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm mã đơn, khách hàng..." className="max-w-sm flex-1" />
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

      <DataTable columns={columns} data={orders} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
