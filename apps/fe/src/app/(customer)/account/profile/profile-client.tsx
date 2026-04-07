'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/use-auth-store';
import { userService } from '@/services/user.service';
import { profileSchema, changePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from '@/lib/validators';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName || '', phone: user?.phone || '' },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile(data);
      setUser(updated);
      toast.success('Cập nhật thành công!');
    } catch (e: any) {
      toast.error(e.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setSaving(true);
    try {
      await userService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Đổi mật khẩu thành công!');
      passwordForm.reset();
    } catch (e: any) {
      toast.error(e.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-custom py-6 lg:py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Thông Tin Cá Nhân</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Thông tin</TabsTrigger>
          <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-2xl bg-primary-100 text-primary-600">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-sm">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Họ và tên</Label>
                  <Input {...profileForm.register('fullName')} />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-xs text-danger-500">{profileForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Số điện thoại</Label>
                  <Input type="tel" {...profileForm.register('phone')} />
                  {profileForm.formState.errors.phone && (
                    <p className="text-xs text-danger-500">{profileForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <Button type="submit" className="gap-2" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Button>
              </form>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="password">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                <Button type="submit" className="gap-2" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu...' : 'Đổi Mật Khẩu'}
                </Button>
              </form>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
