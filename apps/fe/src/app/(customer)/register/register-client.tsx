'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { STORE } from '@/lib/store-info';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { registerSchema, type RegisterFormData } from '@/lib/validators';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary-500 items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Tài Khoản</h1>
          <p className="text-gray-500 mt-1">Tham gia cùng {STORE.name} ngay hôm nay</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 lg:p-8">
          <form onSubmit={handleSubmit((data) => registerUser(data))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ho va ten</Label>
              <Input placeholder="Nguyen Van An" {...register('fullName')} className={errors.fullName ? 'border-danger-500' : ''} />
              {errors.fullName && <p className="text-xs text-danger-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="email@example.com" {...register('email')} className={errors.email ? 'border-danger-500' : ''} />
              {errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input type="tel" placeholder="0912345678" {...register('phone')} className={errors.phone ? 'border-danger-500' : ''} />
              {errors.phone && <p className="text-xs text-danger-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Mật khẩu</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Toi thieu 6 ky tu"
                  {...register('password')}
                  className={errors.password ? 'border-danger-500 pr-10' : 'pr-10'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Xác nhận mật khẩu</Label>
              <Input type="password" placeholder="Nhap lai mat khau" {...register('confirmPassword')} className={errors.confirmPassword ? 'border-danger-500' : ''} />
              {errors.confirmPassword && <p className="text-xs text-danger-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 mt-2" disabled={isRegistering}>
              {isRegistering ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-primary-500 font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
