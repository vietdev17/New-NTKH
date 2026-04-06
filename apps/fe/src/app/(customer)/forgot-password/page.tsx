'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (e: any) {
      toast.error(e.message || 'Co loi xay ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary-50 items-center justify-center mb-4">
            <Mail className="h-7 w-7 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quen Mat Khau</h1>
          <p className="text-gray-500 mt-1">Nhap email de nhan huong dan dat lai mat khau</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 lg:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-success-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email da duoc gui!</h3>
              <p className="text-sm text-gray-500 mb-6">Kiem tra hop thu den de dat lai mat khau. Email co hieu luc trong 15 phut.</p>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/login"><ArrowLeft className="h-4 w-4" /> Quay lai dang nhap</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Email dang ky</Label>
                <Input type="email" placeholder="email@example.com" {...register('email')} className={errors.email ? 'border-danger-500' : ''} />
                {errors.email && <p className="text-xs text-danger-500">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Dang gui...' : 'Gui Email Dat Lai'}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-primary-600 flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Quay lai dang nhap
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
