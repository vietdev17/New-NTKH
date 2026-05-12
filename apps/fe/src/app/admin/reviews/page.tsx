'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Star, Check, X, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import { formatDate, cn } from '@/lib/utils';
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
  const [status, setStatus] = useState('all');
  const qc = useQueryClient();

  // Note dialog
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteReviewId, setNoteReviewId] = useState('');
  const [noteAction, setNoteAction] = useState<'approved' | 'rejected'>('approved');
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, status],
    queryFn: () => reviewService.getReviews({ page, limit: 15, status: status === 'all' ? undefined : status }),
  });

  const reviews = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const moderateMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: 'approved' | 'rejected'; adminNote?: string }) =>
      reviewService.moderateReview(id, status, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      setNoteOpen(false);
      setAdminNote('');
      toast.success('Cập nhật thành công');
    },
    onError: () => toast.error('Thao tác thất bại'),
  });

  const openNoteDialog = (id: string, action: 'approved' | 'rejected') => {
    setNoteReviewId(id);
    setNoteAction(action);
    setAdminNote('');
    setNoteOpen(true);
  };

  const handleModerate = () => {
    moderateMutation.mutate({ id: noteReviewId, status: noteAction, adminNote: adminNote.trim() || undefined });
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'product',
      header: 'Sản phẩm',
      cell: ({ row }) => {
        const p = row.original.productId || row.original.product;
        return (
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded overflow-hidden bg-gray-50 shrink-0">
              <Image src={p?.images?.[0] || '/images/placeholder.svg'} alt="" fill className="object-cover" />
            </div>
            <p className="text-sm font-medium line-clamp-1 max-w-[120px]">{p?.name || '—'}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'user',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const u = row.original.userId || row.original.user;
        return (
          <div>
            <p className="text-sm font-medium">{u?.fullName || '—'}</p>
            <p className="text-xs text-gray-400">{u?.email || ''}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={cn('h-3.5 w-3.5', s <= row.original.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Nội dung',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          {row.original.title && <p className="text-sm font-medium mb-0.5">{row.original.title}</p>}
          <p className="text-sm text-gray-600 line-clamp-2">{row.original.comment || '—'}</p>
        </div>
      ),
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
      cell: ({ row }) => {
        const r = row.original;
        if (r.status !== 'pending') {
          if (r.adminNote) {
            return (
              <div className="flex items-center gap-1 text-xs text-gray-400" title={r.adminNote}>
                <MessageSquare className="h-3 w-3" />
              </div>
            );
          }
          return null;
        }
        return (
          <div className="flex gap-1">
            <Button
              size="sm" variant="ghost" className="h-7 w-7 p-0 text-success-500 hover:bg-success-50"
              onClick={() => openNoteDialog(r._id, 'approved')}
              title="Duyệt"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm" variant="ghost" className="h-7 w-7 p-0 text-danger-400 hover:bg-danger-50"
              onClick={() => openNoteDialog(r._id, 'rejected')}
              title="Từ chối"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Đánh giá</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} đánh giá</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
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

      {/* Dialog duyệt/từ chối */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noteAction === 'approved' ? 'Duyệt đánh giá' : 'Từ chối đánh giá'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ghi chú (tùy chọn)</Label>
              <Input
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={noteAction === 'approved' ? 'Lý do duyệt...' : 'Lý do từ chối...'}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setNoteOpen(false)}>Hủy</Button>
              <Button
                variant={noteAction === 'approved' ? 'default' : 'destructive'}
                onClick={handleModerate}
                disabled={moderateMutation.isPending}
              >
                {moderateMutation.isPending ? 'Đang xử lý...' : noteAction === 'approved' ? 'Duyệt' : 'Từ chối'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
