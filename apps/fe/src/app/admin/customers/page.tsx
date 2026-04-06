'use client';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { PaginationControl } from '@/components/shared/pagination-control';
import { SearchInput } from '@/components/shared/search-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { formatDate } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => userService.getCustomers({ page, limit: 15, search }),
  });

  const customers = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback className="text-xs bg-primary-100 text-primary-600">
              {getInitials(row.original.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.fullName}</p>
            <p className="text-xs text-gray-400">{row.original.email}</p>
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
      accessorKey: 'totalOrders',
      header: 'Đơn hàng',
      cell: ({ row }) => <span>{row.original.totalOrders || 0}</span>,
    },
    {
      accessorKey: 'loyaltyPoints',
      header: 'Điểm tích lũy',
      cell: ({ row }) => (
        <span className="text-primary-600 font-medium">{(row.original.loyaltyPoints || 0).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tham gia',
      cell: ({ row }) => <span className="text-gray-500">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
          <Link href={`/admin/customers/${row.original._id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Khách Hàng</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} khách hàng</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, email, số điện thoại..." className="max-w-sm" />
      </div>

      <DataTable columns={columns} data={customers} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
