'use client';
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { PaginationControl } from '@/components/shared/pagination-control';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/coupon.service';
import { formatDate, formatPrice } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { type ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: () => couponService.getCoupons({ page, limit: 15 }),
  });
  const coupons = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (d: any) => couponService.createCoupon(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Đã tạo mã giảm giá'); setOpen(false); },
    onError: () => toast.error('Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => couponService.updateCoupon(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Đã cập nhật'); setOpen(false); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Đã xóa'); setDeletingId(null); },
    onError: () => toast.error('Xóa thất bại'),
  });

  const openAdd = () => { setEditing(null); reset({ type: 'percentage', usageLimit: 100, isActive: true }); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); reset(c); setOpen(true); };
  const onSubmit = (d: any) => editing ? updateMutation.mutate({ id: editing._id, data: d }) : createMutation.mutate(d);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'code',
      header: 'Mã',
      cell: ({ row }) => <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">{row.original.code}</code>,
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => (
        <span>{row.original.type === 'percentage' ? `${row.original.value}%` : formatPrice(row.original.value)}</span>
      ),
    },
    {
      accessorKey: 'minOrderValue',
      header: 'Đơn tối thiểu',
      cell: ({ row }) => <span>{row.original.minOrderValue ? formatPrice(row.original.minOrderValue) : '—'}</span>,
    },
    {
      accessorKey: 'usedCount',
      header: 'Đã dùng',
      cell: ({ row }) => <span>{row.original.usedCount || 0}/{row.original.usageLimit || '∞'}</span>,
    },
    {
      accessorKey: 'expiresAt',
      header: 'Hết hạn',
      cell: ({ row }) => <span className="text-gray-500">{row.original.expiresAt ? formatDate(row.original.expiresAt) : '—'}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${row.original.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.original.isActive ? 'Đang dùng' : 'Tắt'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-danger-400" onClick={() => setDeletingId(row.original._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mã Giảm Giá</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo mã giảm giá
        </Button>
      </div>

      <DataTable columns={columns} data={coupons} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã code *</Label>
                <Input {...register('code', { required: true })} placeholder="VD: SUMMER20" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Loại *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                        <SelectItem value="fixed">Số tiền cố định</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Giá trị *</Label>
                <Input type="number" {...register('value', { required: true, valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Đơn tối thiểu</Label>
                <Input type="number" {...register('minOrderValue', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Giới hạn sử dụng</Label>
                <Input type="number" {...register('usageLimit', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày hết hạn</Label>
                <Input type="datetime-local" {...register('expiresAt')} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="Xóa mã giảm giá"
        description="Bạn có chắc muốn xóa mã giảm giá này?"
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
