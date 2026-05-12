'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { PaginationControl } from '@/components/shared/pagination-control';
import { SearchInput } from '@/components/shared/search-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { formatDate, getInitials } from '@/lib/utils';
import { SHIPPER_STATUS_LABELS } from '@/lib/constants';
import { type ColumnDef } from '@tanstack/react-table';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'secondary'> = {
  available: 'success',
  busy: 'warning',
  offline: 'secondary',
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: 'Xe máy',
  car: 'Ô tô',
  van: 'Xe tải',
};

export default function AdminShippersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shippers', page, search],
    queryFn: () => shipperService.getShippers({ page, limit: 15, search }),
  });
  const shippers = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Shipper',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback className="text-xs bg-secondary-100 text-secondary-600">
              {getInitials(row.original.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{row.original.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Điện thoại',
      cell: ({ row }) => <span className="text-gray-600">{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'vehicleType',
      header: 'Phương tiện',
      cell: ({ row }) => (
        <span className="text-sm">
          {VEHICLE_LABELS[row.original.vehicleType] || row.original.vehicleType || '—'}
          {row.original.licensePlate && (
            <span className="text-gray-400 ml-1">({row.original.licensePlate})</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'activeOrders',
      header: 'Đang giao',
      cell: ({ row }) => (
        <span className="font-medium text-orange-600">{row.original.activeOrders || 0}</span>
      ),
    },
    {
      accessorKey: 'deliveredOrders',
      header: 'Đã giao',
      cell: ({ row }) => (
        <span className="font-medium text-green-600">{row.original.deliveredOrders || 0}</span>
      ),
    },
    {
      accessorKey: 'shipperStatus',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const status = row.original.shipperStatus || row.original.status || 'offline';
        return (
          <Badge variant={STATUS_VARIANT[status] || 'secondary'}>
            {SHIPPER_STATUS_LABELS[status] || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Tham gia',
      cell: ({ row }) => <span className="text-gray-500 text-xs">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
          <Link href={`/admin/shippers/${row.original._id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Shipper</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} shipper</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, email, điện thoại..." className="max-w-sm" />
      </div>

      <DataTable columns={columns} data={shippers} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
