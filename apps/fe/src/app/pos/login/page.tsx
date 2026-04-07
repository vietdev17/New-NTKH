'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Monitor } from 'lucide-react';
import { STORE } from '@/lib/store-info';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/use-auth-store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PosLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      if (res.user.role !== 'staff' && res.user.role !== 'admin' && res.user.role !== 'manager') {
        toast.error('Ban khong co quyen truy cap POS');
        return;
      }
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success('Dang nhap thanh cong!');
      window.location.href = '/pos';
    } catch (err: any) {
      toast.error(err.message || 'Dang nhap that bai');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-white/10 backdrop-blur items-center justify-center mb-4">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">POS Terminal</h1>
          <p className="text-white/70 mt-1">Dang nhap de bat dau ca ban hang</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email nhan vien</Label>
              <Input
                id="email"
                type="email"
                placeholder="nhanvien@furniture.vn"
                {...register('email')}
                className={errors.email ? 'border-danger-500' : ''}
              />
              {errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mat khau</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhap mat khau"
                  {...register('password')}
                  className={errors.password ? 'border-danger-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? 'Dang dang nhap...' : 'Bat Dau Ca Lam'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/50 mt-6">
          {STORE.name} &copy; {new Date().getFullYear()} — Point of Sale
        </p>
      </div>
    </div>
  );
}
