'use client';
import Image from 'next/image';
import { Star, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, status],
    queryFn: () => reviewService.getReviews({ page, limit: 15, status: status === 'all' ? undefined : status }),
  });

  const reviews = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewService.approveReview(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Đã duyệt'); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => reviewService.rejectReview(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Đã từ chối'); },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded overflow-hidden bg-gray-50 shrink-0">
            <Image src={row.original.product?.images?.[0] || '/images/placeholder.svg'} alt="" fill className="object-cover" />
          </div>
          <p className="text-sm font-medium line-clamp-1 max-w-[120px]">{row.original.product?.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Người dùng',
      cell: ({ row }) => <span className="text-sm">{row.original.user?.fullName || '—'}</span>,
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ row }) => (
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className={cn('h-3.5 w-3.5', s <= row.original.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Nội dung',
      cell: ({ row }) => <p className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">{row.original.comment}</p>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} type="review" />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày',
      cell: ({ row }) => <span className="text-xs text-gray-400">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        row.original.status === 'pending' ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-success-500 hover:bg-success-50"
              onClick={() => approveMutation.mutate(row.original._id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-danger-400 hover:bg-danger-50"
              onClick={() => rejectMutation.mutate(row.original._id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Đánh Giá</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} đánh giá</p>
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

      <DataTable columns={columns} data={reviews} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
