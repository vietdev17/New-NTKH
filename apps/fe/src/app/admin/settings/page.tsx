'use client';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/use-auth-store';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      userService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => { toast.success('Đổi mật khẩu thành công'); passwordForm.reset(); },
    onError: (e: any) => toast.error(e.message || 'Đổi mật khẩu thất bại'),
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary-500" />
        <h1 className="text-2xl font-bold">Cài Đặt</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Store className="h-4 w-4" />
            Tài khoản
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Bảo mật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4 mt-4">
              <h3 className="font-semibold">Thông tin tài khoản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Họ và tên</Label>
                  <Input defaultValue={user?.fullName} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Vai trò</Label>
                  <Input defaultValue={user?.role === 'admin' ? 'Quản trị viên' : user?.role} disabled className="bg-gray-50" />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 mt-4">
              <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>
              <form onSubmit={passwordForm.handleSubmit((d) => changePasswordMutation.mutate(d))} className="space-y-4 max-w-sm">
                <div className="space-y-1.5">
                  <Label>Mật khẩu hiện tại</Label>
                  <Input type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-danger-500">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Mật khẩu mới</Label>
                  <Input type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-danger-500">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Xác nhận mật khẩu mới</Label>
                  <Input type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-danger-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </Button>
              </form>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
