'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validators';
import { authService } from '@/services/auth.service';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await authService.resetPassword(token, data.password);
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || 'Liên kết không hợp lệ hoặc đã hết hạn');
    }
  };

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Liên kết không hợp lệ</p>
          <Button asChild variant="outline">
            <Link href="/forgot-password">Gửi lại email</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {done ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="h-20 w-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="h-10 w-10 text-success-500" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Đặt lại mật khẩu thành công!</h1>
            <p className="text-gray-500 mb-6">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
            <Button className="w-full" onClick={() => router.push('/login')}>
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
              <p className="text-gray-500 mt-2">Nhập mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Mật khẩu mới</Label>
                  <Input type="password" placeholder="Ít nhất 6 ký tự" {...register('password')} />
                  {errors.password && (
                    <p className="text-xs text-danger-500">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Xác nhận mật khẩu mới</Label>
                  <Input type="password" placeholder="Nhập lại mật khẩu" {...register('confirmPassword')} />
                  {errors.confirmPassword && (
                    <p className="text-xs text-danger-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </Button>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
