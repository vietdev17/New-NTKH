# CUSTOMER - DANG NHAP & DANG KY

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/login/`, `apps/fe/src/app/(customer)/register/`, `apps/fe/src/components/auth/`
> Dang nhap, dang ky, quen mat khau, dat lai mat khau, Google OAuth, AuthGuard
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + react-hook-form + zod
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Auth Store (Zustand)](#1-auth-store-zustand)
2. [LoginPage - Dang nhap](#2-loginpage---dang-nhap)
3. [RegisterPage - Dang ky](#3-registerpage---dang-ky)
4. [ForgotPasswordPage - Quen mat khau](#4-forgotpasswordpage---quen-mat-khau)
5. [ResetPasswordPage - Dat lai mat khau](#5-resetpasswordpage---dat-lai-mat-khau)
6. [AuthGuard - Bao ve route](#6-authguard---bao-ve-route)
7. [GoogleAuthButton - Dang nhap Google](#7-googleauthbutton---dang-nhap-google)
8. [Responsive Design](#8-responsive-design)
9. [Tong ket cau truc file](#9-tong-ket-cau-truc-file)

---

## 1. Auth Store (Zustand)

> File: `apps/fe/src/stores/auth-store.ts`
> Quan ly trang thai xac thuc: token, user, login, logout, Google login.

```typescript
// apps/fe/src/stores/auth-store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

// ======================== TYPES ========================

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: 'customer' | 'admin' | 'shipper';
  authProvider: 'local' | 'google';
  createdAt: string;
}

interface AuthState {
  // === Data ===
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // === Actions ===
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setToken: (token: string) => void;
  updateProfile: (data: Partial<AuthUser>) => void;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

// ======================== STORE ========================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // --- Login bang email/password ---
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.post<{
            data: { token: string; user: AuthUser };
          }>('/auth/login', { email, password });

          const { token, user } = res.data.data;

          // Set token cho apiClient
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // --- Dang ky ---
      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.post<{
            data: { token: string; user: AuthUser };
          }>('/auth/register', data);

          const { token, user } = res.data.data;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // --- Login bang Google OAuth ---
      googleLogin: async (googleToken) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.post<{
            data: { token: string; user: AuthUser };
          }>('/auth/google', { token: googleToken });

          const { token, user } = res.data.data;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // --- Logout ---
      logout: () => {
        delete apiClient.defaults.headers.common['Authorization'];
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      // --- Refresh user data ---
      refreshUser: async () => {
        try {
          const res = await apiClient.get<{ data: AuthUser }>('/auth/me');
          set({ user: res.data.data });
        } catch (error) {
          // Token het han -> logout
          get().logout();
        }
      },

      // --- Set token (dung khi khoi phuc tu storage) ---
      setToken: (token) => {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, isAuthenticated: true });
      },

      // --- Update profile trong store (sau khi API thanh cong) ---
      updateProfile: (data) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },
    }),
    {
      name: 'furniture-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 2. LoginPage - Dang nhap

> File: `apps/fe/src/app/(customer)/login/page.tsx`
> Two-column layout: form trai, anh phai (desktop).
> Login form, Google OAuth, link dang ky, redirect sau login.

```tsx
// apps/fe/src/app/(customer)/login/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { cn } from '@/lib/utils';

// ======================== VALIDATION ========================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui long nhap email')
    .email('Email khong hop le'),
  password: z
    .string()
    .min(1, 'Vui long nhap mat khau'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ======================== ANIMATION VARIANTS ========================

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ======================== PAGE ========================

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const { login, isLoading } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // --- Submit ---
  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(data.email, data.password);
      router.push(callbackUrl);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Dang nhap that bai. Vui long thu lai.';
      setErrorMessage(msg);
    }
  };

  // --- Google login success ---
  const handleGoogleSuccess = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* ==================== LEFT: Form ==================== */}
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md space-y-8">
          {/* --- Header --- */}
          <motion.div variants={itemVariants} className="text-center">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo.svg"
                alt="Noi That Viet"
                width={48}
                height={48}
              />
            </Link>
            <h1 className="text-h2 text-foreground">Dang nhap</h1>
            <p className="text-body text-muted-foreground mt-2">
              Chao mung ban quay tro lai
            </p>
          </motion.div>

          {/* --- Error message --- */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-4 bg-danger-50 border border-danger-200
                         rounded-lg text-danger-700 text-body-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMessage}
            </motion.div>
          )}

          {/* --- Google OAuth --- */}
          <motion.div variants={itemVariants}>
            <GoogleAuthButton onSuccess={handleGoogleSuccess} />
          </motion.div>

          {/* --- Divider --- */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-caption">
              <span className="bg-white px-4 text-muted-foreground">hoac</span>
            </div>
          </motion.div>

          {/* --- Login Form --- */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                error={errors.email?.message}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password">Mat khau</Label>
                <Link
                  href="/forgot-password"
                  className="text-caption text-primary-600 hover:text-primary-700
                             font-medium transition-colors"
                >
                  Quen mat khau?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Nhap mat khau"
                  error={errors.password?.message}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              Dang nhap
            </Button>
          </motion.form>

          {/* --- Register link --- */}
          <motion.p
            variants={itemVariants}
            className="text-center text-body-sm text-muted-foreground"
          >
            Chua co tai khoan?{' '}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Dang ky
            </Link>
          </motion.p>
        </div>
      </motion.div>

      {/* ==================== RIGHT: Image (Desktop only) ==================== */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="hidden lg:block lg:flex-1 relative"
      >
        <Image
          src="/images/auth/login-furniture.webp"
          alt="Noi that dep"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />

        {/* Quote overlay */}
        <div className="absolute bottom-12 left-12 right-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-white/90 backdrop-blur-md rounded-xl p-6 shadow-lg"
          >
            <p className="text-body text-foreground italic">
              &ldquo;Noi that khong chi la do vat, ma la cach ban the hien phong cach song.&rdquo;
            </p>
            <p className="text-body-sm text-primary-600 font-medium mt-2">
              Noi That Viet
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
```

### Layout (Metadata)

```tsx
// apps/fe/src/app/(customer)/login/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dang nhap | Noi That Viet',
  description: 'Dang nhap vao tai khoan Noi That Viet cua ban.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

---

## 3. RegisterPage - Dang ky

> File: `apps/fe/src/app/(customer)/register/page.tsx`
> Form dang ky: fullName, email, phone, password, confirm password.
> Google OAuth. Auto login va redirect sau dang ky thanh cong.

```tsx
// apps/fe/src/app/(customer)/register/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

// ======================== VALIDATION ========================

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Ho ten phai co it nhat 2 ky tu')
      .max(100, 'Ho ten khong duoc qua 100 ky tu'),
    email: z
      .string()
      .min(1, 'Vui long nhap email')
      .email('Email khong hop le'),
    phone: z
      .string()
      .regex(/^0\d{9}$/, 'So dien thoai phai co 10 so, bat dau bang 0'),
    password: z
      .string()
      .min(6, 'Mat khau phai co it nhat 6 ky tu'),
    confirmPassword: z
      .string()
      .min(1, 'Vui long xac nhan mat khau'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ======================== ANIMATION VARIANTS ========================

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ======================== PAGE ========================

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // --- Submit ---
  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      // Auto login thanh cong -> redirect ve home
      router.push('/');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Dang ky that bai. Vui long thu lai.';
      setErrorMessage(msg);
    }
  };

  // --- Google login success ---
  const handleGoogleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* ==================== LEFT: Image (Desktop only) ==================== */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="hidden lg:block lg:flex-1 relative"
      >
        <Image
          src="/images/auth/register-furniture.webp"
          alt="Noi that hien dai"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent" />

        {/* Benefits overlay */}
        <div className="absolute top-1/2 -translate-y-1/2 left-12 right-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-white/90 backdrop-blur-md rounded-xl p-8 shadow-lg space-y-4"
          >
            <h3 className="text-h4 text-foreground">Quyen loi thanh vien</h3>
            <ul className="space-y-3">
              {[
                'Tich diem doi qua voi moi don hang',
                'Nhan thong bao uu dai doc quyen',
                'Theo doi don hang de dang',
                'Luu dia chi giao hang thuong xuyen',
              ].map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="flex items-center gap-3 text-body-sm text-foreground"
                >
                  <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                  </div>
                  {benefit}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* ==================== RIGHT: Form ==================== */}
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md space-y-6">
          {/* --- Header --- */}
          <motion.div variants={itemVariants} className="text-center">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo.svg"
                alt="Noi That Viet"
                width={48}
                height={48}
              />
            </Link>
            <h1 className="text-h2 text-foreground">Tao tai khoan</h1>
            <p className="text-body text-muted-foreground mt-2">
              Dang ky de trai nghiem mua sam tot hon
            </p>
          </motion.div>

          {/* --- Error --- */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 p-4 bg-danger-50 border border-danger-200
                         rounded-lg text-danger-700 text-body-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMessage}
            </motion.div>
          )}

          {/* --- Google OAuth --- */}
          <motion.div variants={itemVariants}>
            <GoogleAuthButton
              text="Dang ky voi Google"
              onSuccess={handleGoogleSuccess}
            />
          </motion.div>

          {/* --- Divider --- */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-caption">
              <span className="bg-white px-4 text-muted-foreground">hoac</span>
            </div>
          </motion.div>

          {/* --- Register Form --- */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">Ho va ten</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Nguyen Van A"
                error={errors.fullName?.message}
                autoComplete="name"
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                error={errors.email?.message}
                autoComplete="email"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">So dien thoai</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="0912345678"
                error={errors.phone?.message}
                autoComplete="tel"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="reg-password">Mat khau</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="It nhat 6 ky tu"
                  error={errors.password?.message}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-caption text-muted-foreground mt-1">
                Mat khau phai co it nhat 6 ky tu
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="reg-confirmPassword">Xac nhan mat khau</Label>
              <div className="relative">
                <Input
                  id="reg-confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Nhap lai mat khau"
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              Dang ky
            </Button>
          </motion.form>

          {/* --- Login link --- */}
          <motion.p
            variants={itemVariants}
            className="text-center text-body-sm text-muted-foreground"
          >
            Da co tai khoan?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Dang nhap
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
```

---

## 4. ForgotPasswordPage - Quen mat khau

> File: `apps/fe/src/app/(customer)/forgot-password/page.tsx`
> Form nhap email, gui link dat lai mat khau. Hien thi thong bao thanh cong.

```tsx
// apps/fe/src/app/(customer)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

// ======================== VALIDATION ========================

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui long nhap email')
    .email('Email khong hop le'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ======================== PAGE ========================

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || 'Co loi xay ra. Vui long thu lai.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* --- Back to login --- */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-body-sm text-muted-foreground
                     hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai dang nhap
        </Link>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            /* ==================== SUCCESS STATE ==================== */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center bg-white rounded-xl border border-border shadow-card p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-8 h-8 text-success-500" />
              </motion.div>

              <h1 className="text-h3 text-foreground mb-3">
                Kiem tra hop thu cua ban
              </h1>
              <p className="text-body text-muted-foreground mb-2">
                Da gui email dat lai mat khau toi:
              </p>
              <p className="text-body font-medium text-foreground mb-6">
                {getValues('email')}
              </p>
              <p className="text-body-sm text-muted-foreground mb-8">
                Vui long kiem tra hop thu (va thu muc spam) de tim link dat lai mat khau.
                Link co hieu luc trong 1 gio.
              </p>

              <Link href="/login">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Quay lai dang nhap
                </Button>
              </Link>
            </motion.div>
          ) : (
            /* ==================== FORM STATE ==================== */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-border shadow-card p-8"
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary-500" />
                </div>
                <h1 className="text-h3 text-foreground mb-2">
                  Quen mat khau?
                </h1>
                <p className="text-body-sm text-muted-foreground">
                  Nhap email cua ban, chung toi se gui link dat lai mat khau.
                </p>
              </div>

              {/* Error */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-3 bg-danger-50 border border-danger-200 rounded-lg
                             text-danger-700 text-body-sm"
                >
                  {errorMessage}
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    {...register('email')}
                    placeholder="email@example.com"
                    error={errors.email?.message}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  Gui link dat lai mat khau
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

---

## 5. ResetPasswordPage - Dat lai mat khau

> File: `apps/fe/src/app/(customer)/reset-password/page.tsx`
> Nhan token tu URL query param. Form nhap mat khau moi.
> Xu ly token het han / khong hop le.

```tsx
// apps/fe/src/app/(customer)/reset-password/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

// ======================== VALIDATION ========================

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'Mat khau phai co it nhat 6 ky tu'),
    confirmPassword: z
      .string()
      .min(1, 'Vui long xac nhan mat khau'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ======================== PAGE STATES ========================

type PageState = 'validating' | 'form' | 'success' | 'invalid_token';

// ======================== PAGE ========================

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('validating');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // --- Validate token khi mount ---
  useEffect(() => {
    if (!token) {
      setPageState('invalid_token');
      return;
    }

    const validateToken = async () => {
      try {
        await apiClient.post('/auth/validate-reset-token', { token });
        setPageState('form');
      } catch (error) {
        setPageState('invalid_token');
      }
    };

    validateToken();
  }, [token]);

  // --- Submit ---
  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      setPageState('success');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (msg?.includes('expired') || msg?.includes('invalid')) {
        setPageState('invalid_token');
      } else {
        setErrorMessage(msg || 'Co loi xay ra. Vui long thu lai.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* ==================== VALIDATING ==================== */}
          {pageState === 'validating' && (
            <motion.div
              key="validating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
              <p className="text-body text-muted-foreground">
                Dang xac minh link dat lai mat khau...
              </p>
            </motion.div>
          )}

          {/* ==================== INVALID TOKEN ==================== */}
          {pageState === 'invalid_token' && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-border shadow-card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center mx-auto mb-6"
              >
                <AlertTriangle className="w-8 h-8 text-warning-500" />
              </motion.div>

              <h1 className="text-h3 text-foreground mb-3">
                Link khong hop le hoac da het han
              </h1>
              <p className="text-body text-muted-foreground mb-8">
                Link dat lai mat khau da het han hoac khong hop le.
                Vui long yeu cau gui lai link moi.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/forgot-password">
                  <Button className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Gui lai link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">
                    Quay lai dang nhap
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ==================== FORM ==================== */}
          {pageState === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-border shadow-card p-8"
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-primary-500" />
                </div>
                <h1 className="text-h3 text-foreground mb-2">
                  Dat lai mat khau
                </h1>
                <p className="text-body-sm text-muted-foreground">
                  Nhap mat khau moi cho tai khoan cua ban.
                </p>
              </div>

              {/* Error */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-3 bg-danger-50 border border-danger-200 rounded-lg
                             text-danger-700 text-body-sm"
                >
                  {errorMessage}
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New password */}
                <div>
                  <Label htmlFor="reset-new">Mat khau moi</Label>
                  <div className="relative">
                    <Input
                      id="reset-new"
                      type={showNew ? 'text' : 'password'}
                      {...register('newPassword')}
                      placeholder="It nhat 6 ky tu"
                      error={errors.newPassword?.message}
                      autoComplete="new-password"
                      autoFocus
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <Label htmlFor="reset-confirm">Xac nhan mat khau moi</Label>
                  <div className="relative">
                    <Input
                      id="reset-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Nhap lai mat khau moi"
                      error={errors.confirmPassword?.message}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  Dat lai mat khau
                </Button>
              </form>
            </motion.div>
          )}

          {/* ==================== SUCCESS ==================== */}
          {pageState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-border shadow-card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-8 h-8 text-success-500" />
              </motion.div>

              <h1 className="text-h3 text-foreground mb-3">
                Dat lai mat khau thanh cong!
              </h1>
              <p className="text-body text-muted-foreground mb-8">
                Mat khau cua ban da duoc cap nhat. Hay dang nhap bang mat khau moi.
              </p>

              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Dang nhap ngay
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

---

## 6. AuthGuard - Bao ve route

> File: `apps/fe/src/components/auth/AuthGuard.tsx`
> Wrapper component cho protected routes.
> Kiem tra auth store, redirect ve /login neu chua dang nhap.
> Ho tro required role.

```tsx
// apps/fe/src/components/auth/AuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';

// ======================== TYPES ========================

interface AuthGuardProps {
  children: React.ReactNode;
  /** Role bat buoc (vd: 'admin', 'shipper'). Mac dinh khong kiem tra role. */
  requiredRole?: string;
  /** Redirect URL khi khong co quyen. Mac dinh: /login */
  redirectTo?: string;
}

// ======================== COMPONENT ========================

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = '/login',
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated, user, isLoading, refreshUser, token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Neu co token nhung chua co user data -> refresh
      if (token && !user) {
        await refreshUser();
      }

      const currentAuth = useAuthStore.getState();

      if (!currentAuth.isAuthenticated) {
        // Chua dang nhap -> redirect voi callbackUrl
        const callbackUrl = encodeURIComponent(pathname);
        router.replace(`${redirectTo}?callbackUrl=${callbackUrl}`);
        return;
      }

      if (requiredRole && currentAuth.user?.role !== requiredRole) {
        // Khong du quyen -> redirect ve trang chu
        router.replace('/');
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [token, user, isAuthenticated, pathname, requiredRole, redirectTo, router, refreshUser]);

  // === LOADING STATE ===
  if (isChecking || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-body-sm text-muted-foreground">
            Dang kiem tra quyen truy cap...
          </p>
        </motion.div>
      </div>
    );
  }

  // === AUTHORIZED ===
  return <>{children}</>;
}
```

**Vi du su dung:**

```tsx
// Protected route khong can role cu the
<AuthGuard>
  <WishlistContent />
</AuthGuard>

// Protected route can role admin
<AuthGuard requiredRole="admin" redirectTo="/admin/login">
  <AdminDashboard />
</AuthGuard>

// Protected route can role shipper
<AuthGuard requiredRole="shipper">
  <ShipperDashboard />
</AuthGuard>
```

---

## 7. GoogleAuthButton - Dang nhap Google

> File: `apps/fe/src/components/auth/GoogleAuthButton.tsx`
> Nut dang nhap/dang ky voi Google. Su dung Google OAuth flow.
> Branded button theo Google guidelines (nen trang, logo Google).

```tsx
// apps/fe/src/components/auth/GoogleAuthButton.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

// ======================== TYPES ========================

interface GoogleAuthButtonProps {
  /** Text tren button. Mac dinh: "Dang nhap voi Google" */
  text?: string;
  /** Callback khi login thanh cong */
  onSuccess?: () => void;
  /** Callback khi login that bai */
  onError?: (error: any) => void;
  className?: string;
}

// ======================== COMPONENT ========================

export function GoogleAuthButton({
  text = 'Dang nhap voi Google',
  onSuccess,
  onError,
  className,
}: GoogleAuthButtonProps) {
  const { googleLogin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // --- Google OAuth flow ---
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        await googleLogin(tokenResponse.access_token);
        onSuccess?.();
      } catch (error) {
        console.error('Google login failed:', error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      onError?.(error);
    },
    flow: 'implicit',
  });

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => !isLoading && login()}
      disabled={isLoading}
      className={cn(
        'w-full flex items-center justify-center gap-3 px-6 py-3',
        'bg-white border border-border rounded-lg',
        'text-body font-medium text-foreground',
        'hover:bg-surface-50 hover:shadow-sm transition-all duration-200',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        /* Google Logo SVG - Theo chuan Google brand */
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {text}
    </motion.button>
  );
}
```

### GoogleOAuthProvider Setup

```tsx
// apps/fe/src/app/providers.tsx (phan lien quan)

import { GoogleOAuthProvider } from '@react-oauth/google';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {/* ... other providers */}
      {children}
    </GoogleOAuthProvider>
  );
}
```

**Cau hinh environment:**

```bash
# apps/fe/.env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 8. Responsive Design

### Bang tom tat responsive cho Auth pages

| Page | Desktop (>= lg) | Tablet / Mobile (< lg) |
|------|-----------------|----------------------|
| Login | 2 cols: form trai + anh phai | 1 col: chi form, an anh |
| Register | 2 cols: anh trai + form phai | 1 col: chi form, an anh |
| Forgot Password | Centered card, max-w-md | Full width card |
| Reset Password | Centered card, max-w-md | Full width card |

### Responsive patterns

```
// Two-column auth layout
<div className="min-h-[calc(100vh-4rem)] flex">
  {/* Form: luon hien thi */}
  <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div className="w-full max-w-md">
      {/* Form content */}
    </div>
  </div>

  {/* Image: chi hien tren desktop */}
  <div className="hidden lg:block lg:flex-1 relative">
    <Image src="..." alt="..." fill className="object-cover" />
  </div>
</div>

// Centered card layout (Forgot/Reset)
<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-md">
    {/* Card content */}
  </div>
</div>
```

### Framer Motion transitions

| Component | Animation | Chi tiet |
|-----------|-----------|---------|
| Page mount | Fade + stagger | Container fadeIn, children stagger 0.08-0.1s |
| Form items | Slide up | Y: 20 -> 0, opacity 0 -> 1, ease "easeOut" |
| Image column | Slide horizontal | X: 50 -> 0 (login phai), X: -50 -> 0 (register trai) |
| Success state | Scale spring | Scale: 0.95 -> 1, icon scale: 0 -> 1 voi spring |
| Error message | Expand | Height: 0 -> auto, opacity: 0 -> 1 |
| Button tap | Scale | whileTap scale 0.99 |
| Page switch (success/form) | AnimatePresence | mode "wait", fade transition |

---

## 9. Tong ket cau truc file

```
apps/fe/src/
├── app/(customer)/
│   ├── login/
│   │   ├── layout.tsx                   # Metadata
│   │   └── page.tsx                     # LoginPage (2-col layout)
│   │
│   ├── register/
│   │   ├── layout.tsx                   # Metadata
│   │   └── page.tsx                     # RegisterPage (2-col layout)
│   │
│   ├── forgot-password/
│   │   ├── layout.tsx                   # Metadata
│   │   └── page.tsx                     # ForgotPasswordPage
│   │
│   └── reset-password/
│       ├── layout.tsx                   # Metadata
│       └── page.tsx                     # ResetPasswordPage (?token=xxx)
│
├── components/auth/
│   ├── AuthGuard.tsx                    # Protected route wrapper
│   └── GoogleAuthButton.tsx             # Google OAuth branded button
│
└── stores/
    └── auth-store.ts                    # Zustand auth store (persist)
```

### Luu do authentication flow

```
                        ┌─────────────┐
                        │  LoginPage  │
                        └──────┬──────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              Email/Password         Google OAuth
                    │                     │
                    ▼                     ▼
            POST /auth/login    POST /auth/google
                    │                     │
                    └──────────┬──────────┘
                               │
                     ┌─────────▼─────────┐
                     │  authStore.login   │
                     │  Save token + user │
                     │  Set apiClient     │
                     └─────────┬─────────┘
                               │
                     ┌─────────▼─────────┐
                     │  Redirect to      │
                     │  callbackUrl || / │
                     └───────────────────┘


            ┌──────────────────┐
            │  Protected Page  │
            └────────┬─────────┘
                     │
              ┌──────▼──────┐
              │  AuthGuard  │
              └──────┬──────┘
                     │
              isAuthenticated?
                 /        \
               Yes         No
                │           │
         Render children   Redirect to
                          /login?callbackUrl=xxx


            ┌──────────────────────┐
            │  ForgotPasswordPage  │
            └──────────┬───────────┘
                       │
             POST /auth/forgot-password
                       │
                 Email gui link
                       │
            ┌──────────▼──────────┐
            │  ResetPasswordPage  │
            │  ?token=xxx         │
            └──────────┬──────────┘
                       │
             POST /auth/reset-password
                       │
                 Redirect to /login
                 (voi success message)
```
