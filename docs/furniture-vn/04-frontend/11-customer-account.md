# CUSTOMER - TAI KHOAN

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/account/`, `apps/fe/src/components/account/`
> Trang quan ly tai khoan khach hang: tong quan, thong tin ca nhan, dia chi, diem tich luy, thong bao
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + react-hook-form + zod + Socket.IO
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [AccountLayout - Sidebar Navigation](#1-accountlayout---sidebar-navigation)
2. [AccountOverviewPage - Tong quan tai khoan](#2-accountoverviewpage---tong-quan-tai-khoan)
3. [ProfileEditPage - Chinh sua thong tin ca nhan](#3-profileeditpage---chinh-sua-thong-tin-ca-nhan)
4. [AddressesPage - Quan ly dia chi](#4-addressespage---quan-ly-dia-chi)
5. [LoyaltyPointsSection - Diem tich luy](#5-loyaltypointssection---diem-tich-luy)
6. [NotificationsPage - Thong bao](#6-notificationspage---thong-bao)
7. [Responsive Design](#7-responsive-design)
8. [Tong ket cau truc file](#8-tong-ket-cau-truc-file)

---

## 1. AccountLayout - Sidebar Navigation

> File: `apps/fe/src/app/(customer)/account/layout.tsx`
> Layout chia 2 phan: sidebar trai (desktop) hoac tabs ngang (mobile).
> Tat ca trang account deu la protected route (AuthGuard).

```tsx
// apps/fe/src/app/(customer)/account/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  MapPin,
  Star,
  Bell,
  ChevronRight,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageTransition } from '@/components/ui/PageTransition';
import { cn } from '@/lib/utils';

// ======================== NAV ITEMS ========================

const accountNavItems = [
  {
    label: 'Tong quan',
    href: '/account',
    icon: LayoutDashboard,
    exact: true,    // Chi active khi dung path /account (khong phai /account/xxx)
  },
  {
    label: 'Thong tin ca nhan',
    href: '/account/profile',
    icon: User,
  },
  {
    label: 'Dia chi',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    label: 'Diem tich luy',
    href: '/account/loyalty',
    icon: Star,
  },
  {
    label: 'Thong bao',
    href: '/account/notifications',
    icon: Bell,
    badge: true,     // Hien thi badge so thong bao chua doc
  },
];

// ======================== LAYOUT ========================

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* === Sidebar (Desktop) === */}
            <DesktopSidebar />

            {/* === Mobile Tabs === */}
            <MobileTabs />

            {/* === Main Content === */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  );
}

// ======================== DESKTOP SIDEBAR ========================

function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-24 bg-white rounded-lg border border-border shadow-card p-2">
        <ul className="space-y-1">
          {accountNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md text-body-sm font-medium',
                    'transition-colors duration-200 group',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 shrink-0',
                      isActive ? 'text-primary-500' : 'text-muted-foreground'
                    )}
                  />
                  <span className="flex-1">{item.label}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="account-nav-indicator"
                      className="w-1 h-5 bg-primary-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Badge thong bao */}
                  {item.badge && <NotificationBadge />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

// ======================== MOBILE TABS ========================

function MobileTabs() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden -mx-4 px-4 mb-6">
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex gap-2 min-w-max pb-2">
          {accountNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-body-sm font-medium',
                  'whitespace-nowrap transition-colors duration-200',
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-surface-100 text-muted-foreground hover:bg-surface-200'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.badge && !isActive && <NotificationBadge />}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ======================== NOTIFICATION BADGE ========================

function NotificationBadge() {
  // TODO: Lay tu notification store
  const unreadCount = 3; // Placeholder

  if (unreadCount === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                     bg-danger-500 text-white text-[10px] font-bold leading-none">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
```

**Giai thich layout:**

| Element | Desktop (>= lg) | Mobile (< lg) |
|---------|-----------------|----------------|
| Navigation | Sidebar trai, sticky top 24 | Horizontal scroll tabs, pill style |
| Content | Ben phai sidebar, flex-1 | Full width ben duoi tabs |
| Active indicator | Thanh doc ben phai (layoutId animation) | Background pill mau primary |

---

## 2. AccountOverviewPage - Tong quan tai khoan

> File: `apps/fe/src/app/(customer)/account/page.tsx`
> Hien thi: user info card, quick stats, recent orders, quick links.

```tsx
// apps/fe/src/app/(customer)/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  Star,
  Wallet,
  ChevronRight,
  Package,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

// ======================== TYPES ========================

interface AccountOverview {
  user: {
    fullName: string;
    email: string;
    phone: string;
    avatar: string | null;
    createdAt: string;
  };
  stats: {
    totalOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
    wishlistCount: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    statusLabel: string;
    total: number;
    createdAt: string;
    itemCount: number;
  }>;
}

// ======================== ANIMATION VARIANTS ========================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ======================== ORDER STATUS COLORS ========================

const orderStatusColors: Record<string, string> = {
  pending: 'bg-warning-50 text-warning-700',
  confirmed: 'bg-info-50 text-info-700',
  shipping: 'bg-info-50 text-info-700',
  delivered: 'bg-success-50 text-success-700',
  cancelled: 'bg-danger-50 text-danger-700',
};

// ======================== PAGE ========================

export default function AccountOverviewPage() {
  const { user: authUser } = useAuthStore();
  const [data, setData] = useState<AccountOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await apiClient.get<{ data: AccountOverview }>('/account/overview');
        setData(res.data.data);
      } catch (error) {
        console.error('Fetch account overview failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // === LOADING ===
  if (isLoading || !data) {
    return <AccountOverviewSkeleton />;
  }

  const { user, stats, recentOrders } = data;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* === User Info Card === */}
      <motion.div
        variants={cardVariants}
        className="bg-white rounded-lg border border-border shadow-card p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary-100 shrink-0">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.fullName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center
                              text-h3 text-primary-500 font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-h3 text-foreground">{user.fullName}</h2>
            <p className="text-body-sm text-muted-foreground">{user.email}</p>
            {user.phone && (
              <p className="text-body-sm text-muted-foreground">{user.phone}</p>
            )}
          </div>

          {/* Member since */}
          <div className="flex items-center gap-2 text-caption text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Thanh vien tu {formatDate(user.createdAt, 'MM/yyyy')}
          </div>
        </div>
      </motion.div>

      {/* === Quick Stats === */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={ShoppingBag}
          label="Don hang"
          value={stats.totalOrders.toString()}
          color="primary"
        />
        <StatCard
          icon={Wallet}
          label="Tong chi tieu"
          value={formatCurrency(stats.totalSpent)}
          color="secondary"
        />
        <StatCard
          icon={Star}
          label="Diem tich luy"
          value={stats.loyaltyPoints.toLocaleString('vi-VN')}
          color="accent"
        />
        <StatCard
          icon={Heart}
          label="Yeu thich"
          value={stats.wishlistCount.toString()}
          color="danger"
        />
      </motion.div>

      {/* === Don hang gan day === */}
      <motion.div variants={cardVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h4 text-foreground">Don hang gan day</h3>
          <Link
            href="/orders"
            className="text-body-sm text-primary-600 hover:text-primary-700
                       font-medium flex items-center gap-1"
          >
            Xem tat ca
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-border p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-body text-muted-foreground">
              Chua co don hang nao
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg border border-border p-4
                           hover:shadow-card-hover transition-shadow duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-body font-medium text-foreground">
                        #{order.orderNumber}
                      </span>
                      <Badge className={orderStatusColors[order.status] || ''}>
                        {order.statusLabel}
                      </Badge>
                    </div>
                    <p className="text-body-sm text-muted-foreground">
                      {order.itemCount} san pham &middot; {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-h5 text-primary-600 font-bold">
                      {formatCurrency(order.total)}
                    </span>
                    <ChevronRight
                      className="w-5 h-5 text-muted-foreground
                                 group-hover:text-primary-500 transition-colors"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* === Quick Links === */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <QuickLinkCard
          href="/orders"
          icon={Package}
          title="Xem don hang"
          description="Theo doi trang thai don hang"
        />
        <QuickLinkCard
          href="/wishlist"
          icon={Heart}
          title="Danh sach yeu thich"
          description="San pham ban quan tam"
        />
        <QuickLinkCard
          href="/account/profile"
          icon={MessageSquare}
          title="Danh gia cua toi"
          description="Quan ly danh gia san pham"
        />
      </motion.div>
    </motion.div>
  );
}

// ======================== STAT CARD ========================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'accent' | 'danger';
}

const colorMap = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-500',
    value: 'text-primary-700',
  },
  secondary: {
    bg: 'bg-secondary-50',
    icon: 'text-secondary-500',
    value: 'text-secondary-700',
  },
  accent: {
    bg: 'bg-accent-50',
    icon: 'text-accent-500',
    value: 'text-accent-foreground',
  },
  danger: {
    bg: 'bg-danger-50',
    icon: 'text-danger-500',
    value: 'text-danger-700',
  },
};

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg border border-border p-4 shadow-card
                 hover:shadow-card-hover transition-shadow"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.icon)} />
      </div>
      <p className={cn('text-h4 font-bold', colors.value)}>{value}</p>
      <p className="text-caption text-muted-foreground">{label}</p>
    </motion.div>
  );
}

// ======================== QUICK LINK CARD ========================

interface QuickLinkCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function QuickLinkCard({ href, icon: Icon, title, description }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white rounded-lg border border-border p-4
                 hover:shadow-card-hover hover:border-primary-200 transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center shrink-0
                      group-hover:bg-primary-100 transition-colors">
        <Icon className="w-6 h-6 text-primary-500" />
      </div>
      <div className="min-w-0">
        <h4 className="text-body font-medium text-foreground group-hover:text-primary-600 transition-colors">
          {title}
        </h4>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

// ======================== SKELETON ========================

function AccountOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* User info */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-200" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-40 bg-surface-200 rounded" />
            <div className="h-4 w-56 bg-surface-200 rounded" />
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-4">
            <div className="w-10 h-10 rounded-lg bg-surface-200 mb-3" />
            <div className="h-6 w-16 bg-surface-200 rounded mb-1" />
            <div className="h-3 w-20 bg-surface-200 rounded" />
          </div>
        ))}
      </div>
      {/* Recent orders */}
      <div>
        <div className="h-6 w-40 bg-surface-200 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-4 mb-3">
            <div className="h-5 w-32 bg-surface-200 rounded mb-2" />
            <div className="h-4 w-48 bg-surface-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================== HELPER (import tu lib/utils) ========================
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
```

---

## 3. ProfileEditPage - Chinh sua thong tin ca nhan

> File: `apps/fe/src/app/(customer)/account/profile/page.tsx`
> Form chinh sua: fullName, email (read-only neu Google auth), phone, avatar upload.
> Form doi mat khau rieng: current password, new password, confirm.
> Password strength indicator. react-hook-form + zod. Toast khi luu thanh cong.

```tsx
// apps/fe/src/app/(customer)/account/profile/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Eye, EyeOff, Loader2, Check, Lock, User } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';

// ======================== VALIDATION SCHEMAS ========================

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Ten phai co it nhat 2 ky tu')
    .max(100, 'Ten khong duoc qua 100 ky tu'),
  email: z.string().email('Email khong hop le'),
  phone: z
    .string()
    .regex(/^0\d{9}$/, 'So dien thoai phai co 10 so, bat dau bang 0')
    .or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui long nhap mat khau hien tai'),
    newPassword: z
      .string()
      .min(6, 'Mat khau moi phai co it nhat 6 ky tu'),
    confirmPassword: z.string().min(1, 'Vui long xac nhan mat khau moi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// ======================== PAGE ========================

export default function ProfileEditPage() {
  const { user, updateProfile } = useAuthStore();
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  useEffect(() => {
    // Kiem tra auth provider
    if (user?.authProvider === 'google') {
      setIsGoogleAuth(true);
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-h3 text-foreground mb-1">Thong tin ca nhan</h2>
        <p className="text-body-sm text-muted-foreground">
          Cap nhat thong tin ca nhan va anh dai dien cua ban.
        </p>
      </motion.div>

      {/* === Form thong tin === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <ProfileForm isGoogleAuth={isGoogleAuth} />
      </motion.div>

      {/* === Form doi mat khau === */}
      {!isGoogleAuth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ChangePasswordForm />
        </motion.div>
      )}
    </div>
  );
}

// ======================== PROFILE FORM ========================

function ProfileForm({ isGoogleAuth }: { isGoogleAuth: boolean }) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // --- Avatar upload handler ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: max 5MB, chi nhan image
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Anh khong duoc vuot qua 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Vui long chon file anh');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- Submit ---
  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('phone', data.phone);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await apiClient.patch('/account/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Cap nhat thong tin thanh cong');
      setAvatarFile(null);
      // Cap nhat auth store
      useAuthStore.getState().refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cap nhat that bai. Vui long thu lai.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-5 h-5 text-primary-500" />
        <h3 className="text-h4 text-foreground">Thong tin co ban</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* === Avatar === */}
        <div className="flex items-center gap-6">
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-200
                        ring-4 ring-surface-100 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {(avatarPreview || user?.avatar) ? (
              <Image
                src={avatarPreview || user?.avatar || ''}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center
                              text-h2 text-primary-400 font-bold">
                {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}

            {/* Overlay camera icon */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Doi anh dai dien
            </Button>
            <p className="text-caption text-muted-foreground mt-1">
              JPG, PNG. Toi da 5MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* === Full Name === */}
        <div>
          <Label htmlFor="fullName">Ho va ten</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder="Nguyen Van A"
            error={errors.fullName?.message}
          />
        </div>

        {/* === Email === */}
        <div>
          <Label htmlFor="email">
            Email
            {isGoogleAuth && (
              <span className="text-caption text-muted-foreground ml-2">
                (Dang nhap bang Google - khong the thay doi)
              </span>
            )}
          </Label>
          <Input
            id="email"
            {...register('email')}
            disabled={isGoogleAuth}
            readOnly={isGoogleAuth}
            className={isGoogleAuth ? 'bg-surface-100 cursor-not-allowed' : ''}
          />
        </div>

        {/* === Phone === */}
        <div>
          <Label htmlFor="phone">So dien thoai</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="0912345678"
            error={errors.phone?.message}
          />
        </div>

        {/* === Submit === */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={(!isDirty && !avatarFile) || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Luu thay doi
          </Button>
        </div>
      </form>
    </div>
  );
}

// ======================== CHANGE PASSWORD FORM ========================

function ChangePasswordForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch('newPassword', '');

  // --- Submit ---
  const onSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      await apiClient.patch('/account/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Doi mat khau thanh cong');
      reset();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Doi mat khau that bai';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border shadow-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-5 h-5 text-primary-500" />
        <h3 className="text-h4 text-foreground">Doi mat khau</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
        {/* === Current Password === */}
        <div>
          <Label htmlFor="currentPassword">Mat khau hien tai</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                         hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* === New Password === */}
        <div>
          <Label htmlFor="newPassword">Mat khau moi</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              {...register('newPassword')}
              error={errors.newPassword?.message}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                         hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength indicator */}
          {newPassword.length > 0 && (
            <PasswordStrengthIndicator password={newPassword} />
          )}
        </div>

        {/* === Confirm Password === */}
        <div>
          <Label htmlFor="confirmPassword">Xac nhan mat khau moi</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                         hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* === Submit === */}
        <Button type="submit" disabled={isSaving} className="gap-2">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          Doi mat khau
        </Button>
      </form>
    </div>
  );
}

// ======================== PASSWORD STRENGTH INDICATOR ========================

function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 1, label: 'Yeu', color: 'bg-danger-500' };
    if (score <= 2) return { score: 2, label: 'Trung binh', color: 'bg-warning-500' };
    if (score <= 3) return { score: 3, label: 'Kha', color: 'bg-info-500' };
    if (score <= 4) return { score: 4, label: 'Manh', color: 'bg-success-500' };
    return { score: 5, label: 'Rat manh', color: 'bg-success-600' };
  };

  const strength = getStrength(password);

  return (
    <div className="mt-2 space-y-1.5">
      {/* Bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              level <= strength.score ? strength.color : 'bg-surface-200'
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: level * 0.05 }}
          />
        ))}
      </div>
      {/* Label */}
      <p className="text-caption text-muted-foreground">
        Do manh: <span className="font-medium">{strength.label}</span>
        {' '}&middot; Toi thieu 6 ky tu. Nen co chu hoa, so, ky tu dac biet.
      </p>
    </div>
  );
}
```

---

## 4. AddressesPage - Quan ly dia chi

> File: `apps/fe/src/app/(customer)/account/addresses/page.tsx`
> Danh sach dia chi da luu. Toi da 5 dia chi.
> Them, sua, xoa, dat mac dinh. Dialog form voi chon tinh/huyen/xa cascade.

```tsx
// apps/fe/src/app/(customer)/account/addresses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

// ======================== TYPES ========================

interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: { code: string; name: string };
  district: { code: string; name: string };
  ward: { code: string; name: string };
  street: string;
  isDefault: boolean;
  fullAddress: string;      // Pre-formatted: "123 Nguyen Hue, Phuong Ben Nghe, Quan 1, TP.HCM"
}

interface Province { code: string; name: string; }
interface District { code: string; name: string; }
interface Ward { code: string; name: string; }

// ======================== VALIDATION ========================

const addressSchema = z.object({
  fullName: z.string().min(2, 'Vui long nhap ho ten'),
  phone: z.string().regex(/^0\d{9}$/, 'So dien thoai phai co 10 so, bat dau bang 0'),
  provinceCode: z.string().min(1, 'Vui long chon tinh/thanh pho'),
  districtCode: z.string().min(1, 'Vui long chon quan/huyen'),
  wardCode: z.string().min(1, 'Vui long chon phuong/xa'),
  street: z.string().min(1, 'Vui long nhap dia chi cu the'),
  isDefault: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

// ======================== CONSTANTS ========================

const MAX_ADDRESSES = 5;

// ======================== PAGE ========================

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Fetch addresses ---
  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get<{ data: Address[] }>('/account/addresses');
      setAddresses(res.data.data);
    } catch (error) {
      console.error('Fetch addresses failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // --- Set default ---
  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.patch(`/account/addresses/${id}/default`);
      toast.success('Da dat dia chi mac dinh');
      fetchAddresses();
    } catch (error) {
      toast.error('Khong the dat mac dinh. Vui long thu lai.');
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient.delete(`/account/addresses/${deletingId}`);
      toast.success('Da xoa dia chi');
      setAddresses(addresses.filter((a) => a.id !== deletingId));
      setDeletingId(null);
    } catch (error) {
      toast.error('Xoa that bai. Vui long thu lai.');
    }
  };

  // --- Edit ---
  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  // --- After save ---
  const handleSaved = () => {
    setShowForm(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  // === LOADING ===
  if (isLoading) {
    return <AddressesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-h3 text-foreground">Dia chi giao hang</h2>
          <p className="text-body-sm text-muted-foreground">
            {addresses.length}/{MAX_ADDRESSES} dia chi
          </p>
        </div>

        {addresses.length < MAX_ADDRESSES && (
          <Button
            onClick={() => {
              setEditingAddress(null);
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Them dia chi moi
          </Button>
        )}
      </motion.div>

      {/* --- Danh sach dia chi --- */}
      {addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg border border-border p-12 text-center"
        >
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-body text-muted-foreground mb-4">
            Chua co dia chi nao duoc luu
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Them dia chi dau tien
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {addresses.map((address) => (
              <motion.div
                key={address.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  'bg-white rounded-lg border p-5 relative',
                  'hover:shadow-card-hover transition-shadow duration-200',
                  address.isDefault
                    ? 'border-primary-300 shadow-card'
                    : 'border-border'
                )}
              >
                {/* Mac dinh badge */}
                {address.isDefault && (
                  <Badge className="absolute top-4 right-4 bg-primary-50 text-primary-700">
                    <Star className="w-3 h-3 mr-1 fill-primary-500" />
                    Mac dinh
                  </Badge>
                )}

                {/* Thong tin */}
                <div className="space-y-2 mb-4 pr-20">
                  <p className="text-body font-medium text-foreground">
                    {address.fullName}
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    {address.phone}
                  </p>
                  <p className="text-body-sm text-foreground leading-relaxed">
                    {address.fullAddress}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-surface-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Sua
                  </Button>

                  {!address.isDefault && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="gap-1.5 text-muted-foreground hover:text-primary-600"
                      >
                        <Star className="w-3.5 h-3.5" />
                        Dat mac dinh
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(address.id)}
                        className="gap-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xoa
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* --- Address Form Dialog --- */}
      <AddressFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingAddress(null);
        }}
        editingAddress={editingAddress}
        onSaved={handleSaved}
        isFirstAddress={addresses.length === 0}
      />

      {/* --- Confirm Delete --- */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoa dia chi?"
        description="Ban co chac muon xoa dia chi nay? Hanh dong nay khong the hoan tac."
        confirmText="Xoa"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        icon={<AlertTriangle className="w-6 h-6 text-danger-500" />}
      />
    </div>
  );
}

// ======================== ADDRESS FORM DIALOG ========================

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAddress: Address | null;
  onSaved: () => void;
  isFirstAddress: boolean;
}

function AddressFormDialog({
  open,
  onOpenChange,
  editingAddress,
  onSaved,
  isFirstAddress,
}: AddressFormDialogProps) {
  const isEditing = !!editingAddress;

  // --- Province / District / Ward cascade ---
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      provinceCode: '',
      districtCode: '',
      wardCode: '',
      street: '',
      isDefault: isFirstAddress,
    },
  });

  const selectedProvinceCode = watch('provinceCode');
  const selectedDistrictCode = watch('districtCode');

  // --- Fetch provinces (63 tinh thanh) ---
  useEffect(() => {
    if (!open) return;
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await apiClient.get<{ data: Province[] }>('/locations/provinces');
        setProvinces(res.data.data);
      } catch (error) {
        console.error('Fetch provinces failed:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [open]);

  // --- Fetch districts khi chon province ---
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      setValue('districtCode', '');
      setValue('wardCode', '');
      setWards([]);
      try {
        const res = await apiClient.get<{ data: District[] }>(
          `/locations/provinces/${selectedProvinceCode}/districts`
        );
        setDistricts(res.data.data);
      } catch (error) {
        console.error('Fetch districts failed:', error);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvinceCode, setValue]);

  // --- Fetch wards khi chon district ---
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setIsLoadingWards(true);
      setValue('wardCode', '');
      try {
        const res = await apiClient.get<{ data: Ward[] }>(
          `/locations/districts/${selectedDistrictCode}/wards`
        );
        setWards(res.data.data);
      } catch (error) {
        console.error('Fetch wards failed:', error);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrictCode, setValue]);

  // --- Pre-fill form khi editing ---
  useEffect(() => {
    if (!open) {
      reset({
        fullName: '',
        phone: '',
        provinceCode: '',
        districtCode: '',
        wardCode: '',
        street: '',
        isDefault: isFirstAddress,
      });
      return;
    }

    if (editingAddress) {
      reset({
        fullName: editingAddress.fullName,
        phone: editingAddress.phone,
        provinceCode: editingAddress.province.code,
        districtCode: editingAddress.district.code,
        wardCode: editingAddress.ward.code,
        street: editingAddress.street,
        isDefault: editingAddress.isDefault,
      });
    }
  }, [open, editingAddress, reset, isFirstAddress]);

  // --- Submit ---
  const onSubmit = async (data: AddressFormData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await apiClient.patch(`/account/addresses/${editingAddress!.id}`, data);
        toast.success('Cap nhat dia chi thanh cong');
      } else {
        await apiClient.post('/account/addresses', data);
        toast.success('Them dia chi thanh cong');
      }
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Luu that bai. Vui long thu lai.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-h4">
            {isEditing ? 'Sua dia chi' : 'Them dia chi moi'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Ho ten */}
          <div>
            <Label htmlFor="addr-fullName">Ho va ten nguoi nhan</Label>
            <Input
              id="addr-fullName"
              {...register('fullName')}
              placeholder="Nguyen Van A"
              error={errors.fullName?.message}
            />
          </div>

          {/* So dien thoai */}
          <div>
            <Label htmlFor="addr-phone">So dien thoai</Label>
            <Input
              id="addr-phone"
              {...register('phone')}
              placeholder="0912345678"
              error={errors.phone?.message}
            />
          </div>

          {/* Tinh / Thanh pho */}
          <div>
            <Label>Tinh / Thanh pho</Label>
            <Controller
              name="provinceCode"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingProvinces}
                >
                  <SelectTrigger
                    className={errors.provinceCode ? 'border-danger-500' : ''}
                  >
                    <SelectValue placeholder="Chon tinh / thanh pho" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {provinces.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.provinceCode && (
              <p className="text-caption text-danger-500 mt-1">
                {errors.provinceCode.message}
              </p>
            )}
          </div>

          {/* Quan / Huyen */}
          <div>
            <Label>Quan / Huyen</Label>
            <Controller
              name="districtCode"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedProvinceCode || isLoadingDistricts}
                >
                  <SelectTrigger
                    className={errors.districtCode ? 'border-danger-500' : ''}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingDistricts ? 'Dang tai...' : 'Chon quan / huyen'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {districts.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.districtCode && (
              <p className="text-caption text-danger-500 mt-1">
                {errors.districtCode.message}
              </p>
            )}
          </div>

          {/* Phuong / Xa */}
          <div>
            <Label>Phuong / Xa</Label>
            <Controller
              name="wardCode"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedDistrictCode || isLoadingWards}
                >
                  <SelectTrigger
                    className={errors.wardCode ? 'border-danger-500' : ''}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingWards ? 'Dang tai...' : 'Chon phuong / xa'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {wards.map((w) => (
                      <SelectItem key={w.code} value={w.code}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.wardCode && (
              <p className="text-caption text-danger-500 mt-1">
                {errors.wardCode.message}
              </p>
            )}
          </div>

          {/* Dia chi cu the */}
          <div>
            <Label htmlFor="addr-street">Dia chi cu the (so nha, ten duong)</Label>
            <Input
              id="addr-street"
              {...register('street')}
              placeholder="123 Nguyen Hue"
              error={errors.street?.message}
            />
          </div>

          {/* Dat lam mac dinh */}
          <div className="flex items-center gap-3">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="addr-default"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={editingAddress?.isDefault}
                />
              )}
            />
            <Label htmlFor="addr-default" className="cursor-pointer text-body-sm">
              Dat lam dia chi mac dinh
            </Label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Huy
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isEditing ? 'Luu thay doi' : 'Them dia chi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ======================== SKELETON ========================

function AddressesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-7 w-40 bg-surface-200 rounded" />
        <div className="h-10 w-36 bg-surface-200 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-border p-5">
            <div className="h-5 w-32 bg-surface-200 rounded mb-2" />
            <div className="h-4 w-24 bg-surface-200 rounded mb-2" />
            <div className="h-4 w-full bg-surface-200 rounded mb-1" />
            <div className="h-4 w-3/4 bg-surface-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. LoyaltyPointsSection - Diem tich luy

> File: `apps/fe/src/app/(customer)/account/loyalty/page.tsx`
> Hien thi diem hien tai, gia tri quy doi, lich su diem.

```tsx
// apps/fe/src/app/(customer)/account/loyalty/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { formatDate, cn } from '@/lib/utils';

// ======================== TYPES ========================

interface LoyaltyData {
  currentPoints: number;
  pointValue: number;            // 1 diem = bao nhieu VND (vd: 1000)
  history: Array<{
    id: string;
    type: 'earn' | 'spend';
    points: number;              // So diem (duong = cong, am = tru)
    balance: number;             // So du sau giao dich
    description: string;         // VD: "Don hang #ORD-001 giao thanh cong"
    createdAt: string;
  }>;
  totalPages: number;
  currentPage: number;
}

// ======================== PAGE ========================

export default function LoyaltyPointsPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLoyalty = async (pageNum: number) => {
    try {
      const res = await apiClient.get<{ data: LoyaltyData }>(
        `/account/loyalty?page=${pageNum}&limit=10`
      );
      setData(res.data.data);
    } catch (error) {
      console.error('Fetch loyalty failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyalty(page);
  }, [page]);

  if (isLoading || !data) {
    return <LoyaltySkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* --- Header --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-h3 text-foreground mb-1">Diem tich luy</h2>
        <p className="text-body-sm text-muted-foreground">
          Tich diem khi mua hang va su dung diem de giam gia.
        </p>
      </motion.div>

      {/* === Diem hien tai === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-8 text-white
                   shadow-lg relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-accent-300 fill-accent-300" />
            <span className="text-body-sm text-primary-100 font-medium">
              Diem tich luy hien tai
            </span>
          </div>

          <p className="text-display text-white font-bold mb-2">
            {data.currentPoints.toLocaleString('vi-VN')}
          </p>

          <p className="text-body-sm text-primary-200">
            Tuong duong{' '}
            <span className="text-white font-semibold">
              {(data.currentPoints * data.pointValue).toLocaleString('vi-VN')}d
            </span>
          </p>
        </div>
      </motion.div>

      {/* === Thong tin quy doi === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-start gap-3 p-4 bg-info-50 rounded-lg border border-info-200"
      >
        <Info className="w-5 h-5 text-info-500 shrink-0 mt-0.5" />
        <div className="text-body-sm text-info-700 space-y-1">
          <p>
            <strong>1 diem = {data.pointValue.toLocaleString('vi-VN')}d</strong> khi thanh toan.
          </p>
          <p>Diem duoc cong sau khi don hang giao thanh cong.</p>
          <p>Diem se het han sau 12 thang ke tu ngay nhan.</p>
        </div>
      </motion.div>

      {/* === Lich su diem === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-h4 text-foreground mb-4">Lich su diem</h3>

        {data.history.length === 0 ? (
          <div className="bg-white rounded-lg border border-border p-8 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-body text-muted-foreground">
              Chua co giao dich diem nao
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border divide-y divide-surface-200">
            {data.history.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 p-4"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    entry.type === 'earn'
                      ? 'bg-success-50'
                      : 'bg-danger-50'
                  )}
                >
                  {entry.type === 'earn' ? (
                    <ArrowUpRight className="w-5 h-5 text-success-600" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-danger-600" />
                  )}
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-foreground line-clamp-1">
                    {entry.description}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {formatDate(entry.createdAt)}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'text-body font-bold',
                      entry.type === 'earn'
                        ? 'text-success-600'
                        : 'text-danger-600'
                    )}
                  >
                    {entry.type === 'earn' ? '+' : '-'}
                    {Math.abs(entry.points).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    So du: {entry.balance.toLocaleString('vi-VN')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-9 h-9 rounded-md text-body-sm font-medium transition-colors',
                    pageNum === data.currentPage
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-muted-foreground hover:bg-surface-200'
                  )}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ======================== SKELETON ========================

function LoyaltySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-36 bg-surface-200 rounded mb-2" />
        <div className="h-4 w-64 bg-surface-200 rounded" />
      </div>
      <div className="h-40 bg-surface-300 rounded-xl" />
      <div className="h-16 bg-surface-200 rounded-lg" />
      <div>
        <div className="h-6 w-28 bg-surface-200 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-surface-100">
            <div className="w-10 h-10 rounded-full bg-surface-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 bg-surface-200 rounded" />
              <div className="h-3 w-24 bg-surface-200 rounded" />
            </div>
            <div className="h-5 w-16 bg-surface-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 6. NotificationsPage - Thong bao

> File: `apps/fe/src/app/(customer)/account/notifications/page.tsx`
> Danh sach thong bao voi icon theo loai, unread highlight, real-time qua Socket.IO.
> Click thong bao navigate toi actionUrl. Doc tat ca. Xoa tung thong bao.

```tsx
// apps/fe/src/app/(customer)/account/notifications/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Package,
  Tag,
  Star,
  Gift,
  Info,
  Trash2,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api-client';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime, cn } from '@/lib/utils';

// ======================== TYPES ========================

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'review' | 'loyalty' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;          // URL dich khi click (VD: /orders/xxx)
  createdAt: string;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
  totalPages: number;
  currentPage: number;
}

// ======================== ICON MAP ========================

const notificationIconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order: { icon: Package, color: 'text-info-600', bg: 'bg-info-50' },
  promotion: { icon: Tag, color: 'text-danger-600', bg: 'bg-danger-50' },
  review: { icon: Star, color: 'text-warning-600', bg: 'bg-warning-50' },
  loyalty: { icon: Gift, color: 'text-success-600', bg: 'bg-success-50' },
  system: { icon: Info, color: 'text-muted-foreground', bg: 'bg-surface-100' },
};

// ======================== PAGE ========================

export default function NotificationsPage() {
  const router = useRouter();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Fetch notifications ---
  const fetchNotifications = useCallback(async (pageNum: number) => {
    try {
      const res = await apiClient.get<{ data: NotificationsData }>(
        `/account/notifications?page=${pageNum}&limit=15`
      );
      setData(res.data.data);
    } catch (error) {
      console.error('Fetch notifications failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  // --- Real-time updates via Socket.IO ---
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: [notification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
        };
      });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // --- Click notification ---
  const handleClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await apiClient.patch(`/account/notifications/${notification.id}/read`);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.id === notification.id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          };
        });
      } catch (error) {
        console.error('Mark read failed:', error);
      }
    }

    // Navigate
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // --- Doc tat ca ---
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await apiClient.patch('/account/notifications/read-all');
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    } catch (error) {
      console.error('Mark all read failed:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // --- Xoa notification ---
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await apiClient.delete(`/account/notifications/${id}`);
      setData((prev) => {
        if (!prev) return prev;
        const deleted = prev.notifications.find((n) => n.id === id);
        return {
          ...prev,
          notifications: prev.notifications.filter((n) => n.id !== id),
          unreadCount: deleted && !deleted.isRead
            ? Math.max(0, prev.unreadCount - 1)
            : prev.unreadCount,
        };
      });
    } catch (error) {
      console.error('Delete notification failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // === LOADING ===
  if (isLoading || !data) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-h3 text-foreground">Thong bao</h2>
          {data.unreadCount > 0 && (
            <p className="text-body-sm text-muted-foreground">
              {data.unreadCount} thong bao chua doc
            </p>
          )}
        </div>

        {data.unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="gap-2"
          >
            {isMarkingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Doc tat ca
          </Button>
        )}
      </motion.div>

      {/* --- Danh sach thong bao --- */}
      {data.notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg border border-border p-12 text-center"
        >
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-body text-muted-foreground">
            Khong co thong bao moi
          </p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-lg border border-border divide-y divide-surface-200 overflow-hidden">
          <AnimatePresence>
            {data.notifications.map((notification, index) => {
              const iconConfig = notificationIconMap[notification.type] ||
                notificationIconMap.system;
              const IconComponent = iconConfig.icon;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0, padding: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    'flex items-start gap-4 p-4 cursor-pointer transition-colors duration-200',
                    'hover:bg-surface-50 group',
                    !notification.isRead && 'bg-primary-50/30'
                  )}
                >
                  {/* Unread dot */}
                  <div className="flex items-center pt-1">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0 transition-opacity',
                        notification.isRead
                          ? 'opacity-0'
                          : 'bg-info-500 opacity-100'
                      )}
                    />
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                      iconConfig.bg
                    )}
                  >
                    <IconComponent className={cn('w-5 h-5', iconConfig.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-body-sm text-foreground line-clamp-1',
                        !notification.isRead && 'font-semibold'
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-body-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-caption text-muted-foreground mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(notification.id, e)}
                    disabled={deletingId === notification.id}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-md
                               text-muted-foreground hover:text-danger-500 hover:bg-danger-50
                               transition-all duration-200 shrink-0"
                    aria-label="Xoa thong bao"
                  >
                    {deletingId === notification.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- Pagination --- */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  'w-9 h-9 rounded-md text-body-sm font-medium transition-colors',
                  pageNum === data.currentPage
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 text-muted-foreground hover:bg-surface-200'
                )}
              >
                {pageNum}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ======================== SKELETON ========================

function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-7 w-32 bg-surface-200 rounded" />
        <div className="h-9 w-28 bg-surface-200 rounded-md" />
      </div>
      <div className="bg-white rounded-lg border border-border divide-y divide-surface-200">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4">
            <div className="w-2 h-2 rounded-full bg-surface-200 mt-2" />
            <div className="w-10 h-10 rounded-full bg-surface-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-surface-200 rounded" />
              <div className="h-3 w-full bg-surface-200 rounded" />
              <div className="h-3 w-20 bg-surface-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### useSocket hook (tham khao)

```typescript
// apps/fe/src/hooks/useSocket.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Ngat ket noi khi logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Tao ket noi Socket.IO
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);

  return { socket };
}
```

---

## 7. Responsive Design

### Bang tom tat responsive cho Account pages

| Page | Desktop (>= lg) | Tablet (md) | Mobile (< md) |
|------|-----------------|-------------|----------------|
| Layout | Sidebar trai 64w + content | Sidebar trai + content | Horizontal scroll tabs + full-width content |
| Overview stats | 4 cols | 2 cols | 2 cols |
| Overview orders | List voi flex-row | Flex-row | Stack (flex-col) |
| Profile form | Max width md | Full width | Full width |
| Addresses | 2 cols grid | 2 cols | 1 col |
| Loyalty history | Full row | Full row | Row, text clamp |
| Notifications | Full row, hover actions | Full row | Full row, swipe (tuong lai) |

---

## 8. Tong ket cau truc file

```
apps/fe/src/
├── app/(customer)/account/
│   ├── layout.tsx                    # AccountLayout (sidebar / mobile tabs)
│   ├── page.tsx                      # AccountOverviewPage
│   ├── profile/
│   │   └── page.tsx                  # ProfileEditPage + ChangePasswordForm
│   ├── addresses/
│   │   └── page.tsx                  # AddressesPage + AddressFormDialog
│   ├── loyalty/
│   │   └── page.tsx                  # LoyaltyPointsPage
│   └── notifications/
│       └── page.tsx                  # NotificationsPage (Socket.IO real-time)
│
├── components/account/
│   └── (cac sub-components neu can tach)
│
└── hooks/
    └── useSocket.ts                  # Socket.IO hook (shared)
```
