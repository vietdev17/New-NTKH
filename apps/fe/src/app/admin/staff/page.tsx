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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { formatDate, getInitials } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { type ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';

export default function AdminStaffPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-staff', page],
    queryFn: () => userService.getStaff({ page, limit: 15 }),
  });
  const staff = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const { register, handleSubmit, reset, control } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (d: any) => userService.createStaff(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-staff'] }); toast.success('Đã tạo tài khoản'); setOpen(false); },
    onError: (e: any) => toast.error(e.message || 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => userService.updateStaff(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-staff'] }); toast.success('Đã cập nhật'); setOpen(false); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteStaff(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-staff'] }); toast.success('Đã xóa'); setDeletingId(null); },
    onError: () => toast.error('Xóa thất bại'),
  });

  const openAdd = () => { setEditing(null); reset({ role: 'staff' }); setOpen(true); };
  const openEdit = (s: any) => { setEditing(s); reset({ fullName: s.fullName, email: s.email, phone: s.phone, role: s.role }); setOpen(true); };
  const onSubmit = (d: any) => editing ? updateMutation.mutate({ id: editing._id, data: d }) : createMutation.mutate(d);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'fullName',
      header: 'Nhân viên',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
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
      accessorKey: 'role',
      header: 'Vai trò',
      cell: ({ row }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.original.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
          {row.original.role === 'admin' ? 'Quản trị viên' : 'Nhân viên POS'}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Điện thoại',
      cell: ({ row }) => <span>{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }) => <span className="text-gray-500">{formatDate(row.original.createdAt)}</span>,
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
        <h1 className="text-2xl font-bold">Nhân Viên</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      <DataTable columns={columns} data={staff} isLoading={isLoading} />

      {meta && meta.totalPages > 1 && (
        <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Họ và tên *</Label>
              <Input {...register('fullName', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" {...register('email', { required: true })} />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Mật khẩu *</Label>
                <Input type="password" {...register('password', { required: !editing })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Điện thoại</Label>
              <Input type="tel" {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Nhân viên POS</SelectItem>
                      <SelectItem value="admin">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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
        title="Xóa nhân viên"
        description="Bạn có chắc muốn xóa tài khoản này?"
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
