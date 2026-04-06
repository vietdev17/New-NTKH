'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface CategoryFormData {
  name: string;
  description?: string;
  parentId?: string;
}

function CategoryNode({ cat, depth = 0, onEdit, onDelete }: any) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group"
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="flex-1 font-medium text-sm text-gray-700">{cat.name}</span>
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          {cat.productCount || 0} sản phẩm
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(cat)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-danger-400" onClick={() => onDelete(cat._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
      {hasChildren && expanded && (
        <div>
          {cat.children.map((child: any) => (
            <CategoryNode key={child._id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => categoryService.getCategoryTree(),
  });
  const tree = (data as any) || [];

  const form = useForm<CategoryFormData>();

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoryService.createCategory(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-tree'] }); toast.success('Đã tạo danh mục'); setOpen(false); },
    onError: () => toast.error('Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) => categoryService.updateCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-tree'] }); toast.success('Đã cập nhật'); setOpen(false); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-tree'] }); toast.success('Đã xóa'); setDeletingId(null); },
    onError: () => toast.error('Xóa thất bại'),
  });

  const openAdd = () => { setEditing(null); form.reset({}); setOpen(true); };
  const openEdit = (cat: any) => { setEditing(cat); form.reset({ name: cat.name, description: cat.description }); setOpen(true); };

  const onSubmit = (data: CategoryFormData) => {
    if (editing) updateMutation.mutate({ id: editing._id, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh Mục</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-2">
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : tree.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Chưa có danh mục nào</p>
        ) : (
          <AnimatePresence>
            {tree.map((cat: any) => (
              <CategoryNode key={cat._id} cat={cat} onEdit={openEdit} onDelete={setDeletingId} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên danh mục *</Label>
              <Input {...form.register('name', { required: true })} placeholder="VD: Bàn ăn" />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea {...form.register('description')} rows={2} />
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
        title="Xóa danh mục"
        description="Bạn có chắc muốn xóa danh mục này?"
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
