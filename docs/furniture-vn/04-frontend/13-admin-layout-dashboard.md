# ADMIN - LAYOUT & DASHBOARD

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(admin)/`, `apps/fe/src/components/admin/`
> Bao gom: AdminLayout, AdminSidebar, DashboardPage, NotificationDropdown
> Charts: Recharts (LineChart, PieChart), Stats cards voi AnimatedCounter
> Real-time: Socket.IO cho don hang moi, thong bao
> Tech stack: Next.js 14 + TailwindCSS + Recharts + Socket.IO + Framer Motion + Zustand
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [AdminLayout - Auth Guard & Shell](#1-adminlayout---auth-guard--shell)
2. [AdminSidebar - Thanh dieu huong](#2-adminsidebar---thanh-dieu-huong)
3. [AdminTopBar - Thanh tren cung](#3-admintopbar---thanh-tren-cung)
4. [NotificationDropdown - Thong bao](#4-notificationdropdown---thong-bao)
5. [DashboardPage - Trang tong quan](#5-dashboardpage---trang-tong-quan)
6. [StatsCards - The thong ke](#6-statscards---the-thong-ke)
7. [AnimatedCounter - Dem so dong](#7-animatedcounter---dem-so-dong)
8. [RevenueChart - Bieu do doanh thu](#8-revenuechart---bieu-do-doanh-thu)
9. [OrderStatusChart - Bieu do trang thai don hang](#9-orderstatuschart---bieu-do-trang-thai-don-hang)
10. [RecentOrders - Don hang gan day](#10-recentorders---don-hang-gan-day)
11. [TopProducts - San pham ban chay](#11-topproducts---san-pham-ban-chay)
12. [LowStockAlert - Canh bao ton kho](#12-lowstockalert---canh-bao-ton-kho)
13. [Responsive Behavior Summary](#13-responsive-behavior-summary)

---

## 1. AdminLayout - Auth Guard & Shell

> File: `apps/fe/src/app/(admin)/layout.tsx`
> Route group layout cho tat ca trang admin.
> Chi cho phep admin va manager truy cap.
> Bao boc Sidebar + TopBar + main content voi breadcrumb.
> Collapsible sidebar tren desktop, drawer/bottom nav tren mobile.

### 1.1 Cau truc trang

```
Desktop:
┌──────────┬─────────────────────────────────────────┐
│          │  TopBar                                  │
│          │  [Breadcrumb] ... [Notification] [User]  │
│ Sidebar  ├─────────────────────────────────────────┤
│ (240px   │                                         │
│  or      │         Main Content (children)         │
│  64px    │         padding: 24px                   │
│  icon    │                                         │
│  only)   │                                         │
│          │                                         │
└──────────┴─────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────────────────────┐
│  TopBar [Hamburger] [Title] ... [Notification]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Main Content (children)                │
│              padding: 16px                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  BottomNav (optional - hien thi 5 icon chinh)       │
└─────────────────────────────────────────────────────┘

// Overlay: Mobile Drawer (slide tu trai)
```

### 1.2 Sidebar State Store

```typescript
// ============================================================
// apps/fe/src/stores/use-sidebar-store.ts
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  /** Sidebar dang mo rong (true) hay thu gon icon-only (false) */
  isExpanded: boolean;

  /** Drawer mobile dang mo */
  isMobileOpen: boolean;

  /** Toggle mo rong / thu gon (desktop) */
  toggleExpanded: () => void;

  /** Dong / mo drawer mobile */
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: true,
      isMobileOpen: false,

      toggleExpanded: () =>
        set((state) => ({ isExpanded: !state.isExpanded })),

      setMobileOpen: (open) =>
        set({ isMobileOpen: open }),
    }),
    {
      name: 'admin-sidebar',
      partialize: (state) => ({ isExpanded: state.isExpanded }),
    }
  )
);
```

### 1.3 AdminLayout Code

```tsx
// ============================================================
// apps/fe/src/app/(admin)/layout.tsx
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/stores/use-auth-store';
import { useSidebarStore } from '@/stores/use-sidebar-store';
import { useSocketStore } from '@/stores/use-socket-store';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopBar } from '@/components/admin/admin-top-bar';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { UserRole, NotificationType } from '@/types';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // ----- Auth check -----
  const { user, isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const { isExpanded, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { socket, connect, disconnect } = useSocketStore();

  // ----- Kiem tra quyen admin/manager -----
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        router.replace('/login?redirect=' + encodeURIComponent(pathname));
        return;
      }

      // Fetch user moi nhat
      const currentUser = await fetchMe();
      if (!currentUser) {
        router.replace('/login?redirect=' + encodeURIComponent(pathname));
        return;
      }

      // Chi cho admin va manager
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.MANAGER
      ) {
        router.replace('/');
        return;
      }

      setIsAuthorized(true);
    };

    checkAuth();
  }, [isAuthenticated, router, pathname, fetchMe]);

  // ----- Ket noi Socket.IO khi authorized -----
  useEffect(() => {
    if (isAuthorized && user) {
      connect(user._id, user.role);

      return () => {
        disconnect();
      };
    }
  }, [isAuthorized, user, connect, disconnect]);

  // ----- Lang nghe don hang moi tu Socket.IO -----
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: {
      orderNumber: string;
      customerName: string;
      total: number;
    }) => {
      toast({
        title: 'Don hang moi!',
        description: `#${data.orderNumber} - ${data.customerName} - ${data.total.toLocaleString('vi-VN')}d`,
        variant: 'default',
      });
    };

    socket.on('admin:new-order', handleNewOrder);
    return () => {
      socket.off('admin:new-order', handleNewOrder);
    };
  }, [socket, toast]);

  // ----- Dong mobile drawer khi chuyen trang -----
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // ----- Loading state -----
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          <p className="text-sm text-surface-foreground/60">
            Dang tai trang quan tri...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ===== Sidebar (Desktop) ===== */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* ===== Mobile Drawer Overlay ===== */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
            >
              <AdminSidebar isMobileDrawer />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Main area ===== */}
      <div
        className={`
          flex flex-1 flex-col overflow-hidden transition-all duration-300
          ${isExpanded ? 'lg:ml-[240px]' : 'lg:ml-[64px]'}
        `}
      >
        {/* Top bar */}
        <AdminTopBar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
```

---

## 2. AdminSidebar - Thanh dieu huong

> File: `apps/fe/src/components/admin/admin-sidebar.tsx`
> Sidebar collapsible: 240px (mo rong) hoac 64px (icon-only).
> Navigation links voi Lucide icons, highlight trang hien tai.
> Responsive: an tren mobile, hien thi qua drawer.

### 2.1 Navigation Config

```typescript
// ============================================================
// apps/fe/src/lib/admin-nav.ts
// ============================================================
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  RotateCcw,
  Users,
  Truck,
  Ticket,
  Star,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hien badge count (optional) */
  badgeKey?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'San pham',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: 'Danh muc',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    label: 'Don hang',
    href: '/admin/orders',
    icon: ShoppingCart,
    badgeKey: 'pendingOrders',
  },
  {
    label: 'Doi tra',
    href: '/admin/returns',
    icon: RotateCcw,
    badgeKey: 'pendingReturns',
  },
  {
    label: 'Khach hang',
    href: '/admin/customers',
    icon: Users,
  },
  {
    label: 'Shipper',
    href: '/admin/shippers',
    icon: Truck,
  },
  {
    label: 'Coupon',
    href: '/admin/coupons',
    icon: Ticket,
  },
  {
    label: 'Danh gia',
    href: '/admin/reviews',
    icon: Star,
    badgeKey: 'pendingReviews',
  },
  {
    label: 'Bao cao',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    label: 'Nhan vien',
    href: '/admin/staff',
    icon: UserCog,
  },
  {
    label: 'Cai dat',
    href: '/admin/settings',
    icon: Settings,
  },
];
```

### 2.2 AdminSidebar Component

```tsx
// ============================================================
// apps/fe/src/components/admin/admin-sidebar.tsx
// ============================================================
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/use-sidebar-store';
import { ADMIN_NAV_ITEMS, type AdminNavItem } from '@/lib/admin-nav';
import { useAdminBadgeStore } from '@/stores/use-admin-badge-store';

interface AdminSidebarProps {
  /** Dang render trong mobile drawer? */
  isMobileDrawer?: boolean;
}

export function AdminSidebar({ isMobileDrawer = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isExpanded, toggleExpanded, setMobileOpen } = useSidebarStore();
  const badges = useAdminBadgeStore((s) => s.badges);

  // Mobile drawer luon mo rong
  const expanded = isMobileDrawer ? true : isExpanded;

  /** Kiem tra link co active khong */
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-200',
        'transition-all duration-300 ease-in-out',
        expanded ? 'w-[240px]' : 'w-[64px]',
        isMobileDrawer && 'w-[280px] shadow-xl'
      )}
    >
      {/* ===== Logo + Close (mobile) / Collapse toggle ===== */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/images/logo.svg"
            alt="Noi That VN"
            width={32}
            height={32}
            className="h-8 w-8 flex-shrink-0"
          />
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-lg font-bold text-primary-600 whitespace-nowrap overflow-hidden"
            >
              Noi That VN
            </motion.span>
          )}
        </Link>

        {/* Close button (mobile drawer) */}
        {isMobileDrawer && (
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dong menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Collapse toggle (desktop only, khong hien khi mobile drawer) */}
        {!isMobileDrawer && (
          <button
            onClick={toggleExpanded}
            className="hidden lg:flex rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={expanded ? 'Thu gon sidebar' : 'Mo rong sidebar'}
          >
            {expanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* ===== Navigation links ===== */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              expanded={expanded}
              badge={item.badgeKey ? badges[item.badgeKey] : undefined}
              onClick={() => {
                if (isMobileDrawer) setMobileOpen(false);
              }}
            />
          ))}
        </ul>
      </nav>

      {/* ===== Version ===== */}
      {expanded && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-gray-400">Admin Panel v1.0</p>
        </div>
      )}
    </aside>
  );
}

// ============================================================
// SidebarNavLink - Tung link trong sidebar
// ============================================================
interface SidebarNavLinkProps {
  item: AdminNavItem;
  isActive: boolean;
  expanded: boolean;
  badge?: number;
  onClick?: () => void;
}

function SidebarNavLink({
  item,
  isActive,
  expanded,
  badge,
  onClick,
}: SidebarNavLinkProps) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5',
          'transition-colors duration-150',
          isActive
            ? 'bg-primary-50 text-primary-600 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          !expanded && 'justify-center px-2'
        )}
        title={!expanded ? item.label : undefined}
      >
        {/* Active indicator bar */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary-500"
          />
        )}

        {/* Icon */}
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0',
            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600'
          )}
        />

        {/* Label */}
        {expanded && (
          <span className="flex-1 truncate text-sm">{item.label}</span>
        )}

        {/* Badge count */}
        {badge && badge > 0 && (
          <span
            className={cn(
              'flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
              expanded ? 'h-5 min-w-[20px] px-1.5' : 'absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1'
            )}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* Tooltip khi thu gon (icon-only mode) */}
        {!expanded && (
          <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block z-50">
            {item.label}
          </div>
        )}
      </Link>
    </li>
  );
}
```

### 2.3 Badge Store (so luong badge cho sidebar)

```typescript
// ============================================================
// apps/fe/src/stores/use-admin-badge-store.ts
// ============================================================
import { create } from 'zustand';

interface AdminBadgeState {
  badges: Record<string, number>;
  setBadge: (key: string, count: number) => void;
  setBadges: (badges: Record<string, number>) => void;
}

export const useAdminBadgeStore = create<AdminBadgeState>((set) => ({
  badges: {},

  setBadge: (key, count) =>
    set((state) => ({
      badges: { ...state.badges, [key]: count },
    })),

  setBadges: (badges) => set({ badges }),
}));
```

---

## 3. AdminTopBar - Thanh tren cung

> File: `apps/fe/src/components/admin/admin-top-bar.tsx`
> Hien thi: hamburger (mobile), page title tu breadcrumb, notification bell, user menu.

### 3.1 Breadcrumb Utils

```typescript
// ============================================================
// apps/fe/src/lib/admin-breadcrumb.ts
// ============================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Map pathname segments sang label tieng Viet */
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Quan tri',
  products: 'San pham',
  categories: 'Danh muc',
  orders: 'Don hang',
  returns: 'Doi tra',
  customers: 'Khach hang',
  shippers: 'Shipper',
  coupons: 'Coupon',
  reviews: 'Danh gia',
  reports: 'Bao cao',
  staff: 'Nhan vien',
  settings: 'Cai dat',
  new: 'Them moi',
  edit: 'Chinh sua',
};

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += '/' + segment;

    // Bo qua dynamic segments ([id], [slug]) - hien thi ma don hang, ten san pham, v.v.
    const label = SEGMENT_LABELS[segment] || segment;

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  // Item cuoi cung khong co link (trang hien tai)
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].href = undefined;
  }

  return breadcrumbs;
}

/** Lay page title tu breadcrumb cuoi cung */
export function getPageTitle(pathname: string): string {
  const breadcrumbs = buildBreadcrumbs(pathname);
  if (breadcrumbs.length === 0) return 'Dashboard';

  const last = breadcrumbs[breadcrumbs.length - 1];
  return last.label;
}
```

### 3.2 AdminTopBar Component

```tsx
// ============================================================
// apps/fe/src/components/admin/admin-top-bar.tsx
// ============================================================
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, ChevronRight, LogOut, User, Settings } from 'lucide-react';
import { useSidebarStore } from '@/stores/use-sidebar-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { buildBreadcrumbs, getPageTitle } from '@/lib/admin-breadcrumb';
import { NotificationDropdown } from '@/components/admin/notification-dropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setMobileOpen } = useSidebarStore();
  const { user, logout } = useAuthStore();

  const breadcrumbs = buildBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* ===== Left: Hamburger (mobile) + Breadcrumb ===== */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu - chi hien mobile */}
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Mo menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb - an tren mobile, hien tren desktop */}
        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-primary-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-gray-900">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Page title - chi hien mobile */}
        <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
          {pageTitle}
        </h1>
      </div>

      {/* ===== Right: Notification + User Menu ===== */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.fullName} />
                <AvatarFallback className="bg-primary-100 text-primary-600 text-xs font-medium">
                  {user?.fullName
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {user?.role === 'admin' ? 'Quan tri vien' : 'Quan ly'}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => router.push('/admin/settings/profile')}
            >
              <User className="mr-2 h-4 w-4" />
              Ho so
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/admin/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Cai dat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Dang xuat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

---

## 4. NotificationDropdown - Thong bao

> File: `apps/fe/src/components/admin/notification-dropdown.tsx`
> Bell icon voi badge so luong chua doc.
> Dropdown hien thi danh sach thong bao gan day.
> Click thong bao chuyen den trang lien quan.
> Real-time cap nhat qua Socket.IO.

### 4.1 Notification Store

```typescript
// ============================================================
// apps/fe/src/stores/use-notification-store.ts
// ============================================================
import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { INotification } from '@/types';

interface NotificationState {
  /** Danh sach thong bao gan day */
  notifications: INotification[];

  /** So luong chua doc */
  unreadCount: number;

  /** Dang tai du lieu */
  isLoading: boolean;

  /** Fetch thong bao tu API */
  fetchNotifications: () => Promise<void>;

  /** Them thong bao moi (tu Socket.IO) */
  addNotification: (notification: INotification) => void;

  /** Danh dau da doc 1 thong bao */
  markAsRead: (notificationId: string) => Promise<void>;

  /** Danh dau tat ca da doc */
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<{
        items: INotification[];
        unreadCount: number;
      }>('/api/notifications', {
        params: { limit: 20, sort: '-createdAt' },
      });
      set({
        notifications: res.data.items,
        unreadCount: res.data.unreadCount,
      });
    } catch (error) {
      console.error('Fetch notifications failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 20),
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: async (notificationId) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.patch('/api/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Mark all as read failed:', error);
    }
  },
}));
```

### 4.2 NotificationDropdown Component

```tsx
// ============================================================
// apps/fe/src/components/admin/notification-dropdown.tsx
// ============================================================
'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ShoppingCart,
  RotateCcw,
  Star,
  AlertTriangle,
  Package,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/use-notification-store';
import { useSocketStore } from '@/stores/use-socket-store';
import { NotificationType, type INotification } from '@/types';

/** Map notification type -> icon + mau */
const NOTIFICATION_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  ORDER_NEW: {
    icon: ShoppingCart,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  ORDER_STATUS: {
    icon: Package,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  RETURN_REQUEST: {
    icon: RotateCcw,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  REVIEW_NEW: {
    icon: Star,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  LOW_STOCK: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  PAYMENT_RECEIVED: {
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  color: 'text-gray-600',
  bg: 'bg-gray-50',
};

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const { socket } = useSocketStore();

  // ----- Fetch khi mount -----
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ----- Lang nghe thong bao moi tu Socket.IO -----
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: INotification) => {
      addNotification(notification);
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, addNotification]);

  // ----- Dong khi click ngoai -----
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----- Click vao thong bao -----
  const handleNotificationClick = useCallback(
    async (notification: INotification) => {
      // Danh dau da doc
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      // Chuyen den trang lien quan
      if (notification.link) {
        router.push(notification.link);
      }

      setIsOpen(false);
    },
    [markAsRead, router]
  );

  // ----- Doc tat ca -----
  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* ===== Bell Button ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label={`Thong bao - ${unreadCount} chua doc`}
      >
        <Bell className="h-5 w-5" />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* ===== Dropdown Panel ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-[360px] max-w-[calc(100vw-32px)]',
              'rounded-xl border border-gray-200 bg-white shadow-xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-gray-900">Thong bao</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Doc tat ca
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-10 w-10 text-gray-200" />
                  <p className="mt-2 text-sm text-gray-500">
                    Khong co thong bao nao
                  </p>
                </div>
              ) : (
                <ul>
                  {notifications.map((notification) => {
                    const config =
                      NOTIFICATION_CONFIG[notification.type] || DEFAULT_CONFIG;
                    const Icon = config.icon;

                    return (
                      <li key={notification._id}>
                        <button
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left',
                            'hover:bg-gray-50 transition-colors',
                            !notification.isRead && 'bg-primary-50/30'
                          )}
                        >
                          {/* Icon */}
                          <div
                            className={cn(
                              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                              config.bg
                            )}
                          >
                            <Icon className={cn('h-4 w-4', config.color)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm leading-snug',
                                !notification.isRead
                                  ? 'font-medium text-gray-900'
                                  : 'text-gray-600'
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 truncate">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true, locale: vi }
                              )}
                            </p>
                          </div>

                          {/* Unread dot */}
                          {!notification.isRead && (
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => {
                  router.push('/admin/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Xem tat ca thong bao
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 5. DashboardPage - Trang tong quan

> File: `apps/fe/src/app/(admin)/page.tsx`
> Trang chinh cua admin. Hien thi:
> - 4 stats cards (doanh thu, don moi, khach moi, canh bao ton kho)
> - Bieu do doanh thu (Recharts)
> - Bieu do trang thai don hang (Pie)
> - Don hang gan day (table)
> - San pham ban chay (list)
> - Canh bao ton kho thap
> Responsive: 2 cot tren desktop, 1 cot tren mobile.

### 5.1 Dashboard API Hooks

```typescript
// ============================================================
// apps/fe/src/hooks/admin/use-dashboard-data.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// ----- Types -----

export interface DashboardStats {
  todayRevenue: number;
  todayRevenueChange: number;       // % thay doi so voi hom qua
  newOrdersCount: number;
  newOrdersChange: number;
  newCustomersCount: number;
  newCustomersChange: number;
  lowStockCount: number;
}

export interface RevenueDataPoint {
  date: string;                     // 'YYYY-MM-DD'
  revenue: number;
  orders: number;
}

export interface OrderStatusData {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemsCount: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  image: string;
  soldCount: number;
  revenue: number;
}

export interface LowStockItem {
  _id: string;
  productName: string;
  variantLabel: string;
  sku: string;
  currentStock: number;
  minStock: number;
  image: string;
}

// ----- Hook -----

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueView, setRevenueView] = useState<'week' | 'month'>('month');

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, revenueRes, statusRes, ordersRes, productsRes, stockRes] =
        await Promise.all([
          apiClient.get<DashboardStats>('/api/admin/dashboard/stats'),
          apiClient.get<RevenueDataPoint[]>('/api/admin/dashboard/revenue', {
            params: { period: revenueView },
          }),
          apiClient.get<OrderStatusData[]>('/api/admin/dashboard/order-status'),
          apiClient.get<RecentOrder[]>('/api/admin/dashboard/recent-orders', {
            params: { limit: 10 },
          }),
          apiClient.get<TopProduct[]>('/api/admin/dashboard/top-products', {
            params: { limit: 5 },
          }),
          apiClient.get<LowStockItem[]>('/api/admin/dashboard/low-stock'),
        ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data);
      setOrderStatusData(statusRes.data);
      setRecentOrders(ordersRes.data);
      setTopProducts(productsRes.data);
      setLowStockItems(stockRes.data);
    } catch (error) {
      console.error('Dashboard fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [revenueView]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    revenueData,
    orderStatusData,
    recentOrders,
    topProducts,
    lowStockItems,
    isLoading,
    revenueView,
    setRevenueView,
    refetch: fetchDashboard,
  };
}
```

### 5.2 DashboardPage Component

```tsx
// ============================================================
// apps/fe/src/app/(admin)/page.tsx
// ============================================================
'use client';

import { useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  UserPlus,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/admin/use-dashboard-data';
import { useSocketStore } from '@/stores/use-socket-store';
import { StatsCard } from '@/components/admin/dashboard/stats-card';
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart';
import { OrderStatusChart } from '@/components/admin/dashboard/order-status-chart';
import { RecentOrders } from '@/components/admin/dashboard/recent-orders';
import { TopProducts } from '@/components/admin/dashboard/top-products';
import { LowStockAlert } from '@/components/admin/dashboard/low-stock-alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const {
    stats,
    revenueData,
    orderStatusData,
    recentOrders,
    topProducts,
    lowStockItems,
    isLoading,
    revenueView,
    setRevenueView,
    refetch,
  } = useDashboardData();

  const { socket } = useSocketStore();

  // ----- Real-time: Refresh khi co don moi -----
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = () => {
      // Refetch stats va recent orders
      refetch();
    };

    socket.on('admin:new-order', handleNewOrder);
    return () => {
      socket.off('admin:new-order', handleNewOrder);
    };
  }, [socket, refetch]);

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tong quan hoat dong kinh doanh
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Lam moi</span>
        </button>
      </div>

      {/* ===== Stats Cards (4 cot) ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[130px] rounded-xl" />
          ))
        ) : stats ? (
          <>
            <StatsCard
              title="Doanh thu hom nay"
              value={stats.todayRevenue}
              format="currency"
              change={stats.todayRevenueChange}
              icon={DollarSign}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatsCard
              title="Don hang moi"
              value={stats.newOrdersCount}
              format="number"
              change={stats.newOrdersChange}
              icon={ShoppingCart}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatsCard
              title="Khach hang moi"
              value={stats.newCustomersCount}
              format="number"
              change={stats.newCustomersChange}
              icon={UserPlus}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <StatsCard
              title="Canh bao ton kho"
              value={stats.lowStockCount}
              format="number"
              icon={AlertTriangle}
              iconColor="text-red-600"
              iconBg="bg-red-50"
              variant={stats.lowStockCount > 0 ? 'warning' : 'default'}
            />
          </>
        ) : null}
      </div>

      {/* ===== Charts Row (2 cot desktop, 1 cot mobile) ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart - 2/3 width */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <RevenueChart
              data={revenueData}
              view={revenueView}
              onViewChange={setRevenueView}
            />
          )}
        </div>

        {/* Order Status Pie - 1/3 width */}
        <div className="lg:col-span-1">
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <OrderStatusChart data={orderStatusData} />
          )}
        </div>
      </div>

      {/* ===== Bottom Row: Orders + Products/Stock ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders - 2/3 width */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[450px] rounded-xl" />
          ) : (
            <RecentOrders orders={recentOrders} />
          )}
        </div>

        {/* Right column: Top products + Low stock */}
        <div className="lg:col-span-1 space-y-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[220px] rounded-xl" />
              <Skeleton className="h-[200px] rounded-xl" />
            </>
          ) : (
            <>
              <TopProducts products={topProducts} />
              <LowStockAlert items={lowStockItems} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 6. StatsCards - The thong ke

> File: `apps/fe/src/components/admin/dashboard/stats-card.tsx`
> Card hien thi 1 chi so: title, value (AnimatedCounter), % thay doi, icon.
> Variant: default (trang), warning (nen do nhat).

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/stats-card.tsx
// ============================================================
'use client';

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/admin/dashboard/animated-counter';

interface StatsCardProps {
  title: string;
  value: number;
  format: 'currency' | 'number';
  change?: number;            // % thay doi so voi ky truoc (+ tang, - giam)
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  variant?: 'default' | 'warning';
}

export function StatsCard({
  title,
  value,
  format,
  change,
  icon: Icon,
  iconColor,
  iconBg,
  variant = 'default',
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-shadow hover:shadow-md',
        variant === 'warning'
          ? 'border-red-200 bg-red-50/50'
          : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="text-2xl font-bold text-gray-900">
            <AnimatedCounter
              value={value}
              format={format}
            />
          </div>

          {/* Change indicator */}
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400">so voi hom qua</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}
```

---

## 7. AnimatedCounter - Dem so dong

> File: `apps/fe/src/components/admin/dashboard/animated-counter.tsx`
> Hieu ung dem so tu 0 den gia tri dich, dung requestAnimationFrame.
> Ho tro format tien te (VND) va so nguyen.

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/animated-counter.tsx
// ============================================================
'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  /** Gia tri dich */
  value: number;

  /** Dinh dang hien thi */
  format: 'currency' | 'number';

  /** Thoi gian animation (ms) */
  duration?: number;
}

export function AnimatedCounter({
  value,
  format,
  duration = 1200,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    // Easing function: ease-out cubic
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  /** Format gia tri hien thi */
  const formattedValue =
    format === 'currency'
      ? displayValue.toLocaleString('vi-VN') + 'd'
      : displayValue.toLocaleString('vi-VN');

  return <span>{formattedValue}</span>;
}
```

---

## 8. RevenueChart - Bieu do doanh thu

> File: `apps/fe/src/components/admin/dashboard/revenue-chart.tsx`
> Bieu do ket hop Line + Bar (Recharts): doanh thu theo ngay.
> Toggle xem theo tuan / thang.
> Responsive: thu gon label truc X tren mobile.

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/revenue-chart.tsx
// ============================================================
'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { RevenueDataPoint } from '@/hooks/admin/use-dashboard-data';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  view: 'week' | 'month';
  onViewChange: (view: 'week' | 'month') => void;
}

/** Custom tooltip */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-900">
        {format(parseISO(label), 'dd/MM/yyyy (EEEE)', { locale: vi })}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {entry.name === 'Doanh thu'
              ? entry.value.toLocaleString('vi-VN') + 'd'
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Format truc Y: 1000000 -> 1M */
function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K';
  return value.toString();
}

export function RevenueChart({
  data,
  view,
  onViewChange,
}: RevenueChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Bieu do doanh thu
          </h3>
          <p className="text-sm text-gray-500">
            Doanh thu va so don hang theo ngay
          </p>
        </div>

        {/* Toggle week / month */}
        <div className="flex rounded-lg border border-gray-200 p-0.5">
          <button
            onClick={() => onViewChange('week')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'week'
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            7 ngay
          </button>
          <button
            onClick={() => onViewChange('month')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'month'
                ? 'bg-primary-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            30 ngay
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tickFormatter={(val) => format(parseISO(val), 'dd/MM')}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              // Tren mobile: chi hien 1 nua label
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="revenue"
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
            />

            {/* Revenue bar */}
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              name="Doanh thu"
              fill="#8B4513"
              fillOpacity={0.7}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />

            {/* Orders line */}
            <Line
              yAxisId="orders"
              dataKey="orders"
              name="So don"
              stroke="#2D5016"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2D5016' }}
              activeDot={{ r: 5 }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## 9. OrderStatusChart - Bieu do trang thai don hang

> File: `apps/fe/src/components/admin/dashboard/order-status-chart.tsx`
> Bieu do Donut (PieChart voi innerRadius) hien thi don hang theo trang thai.
> Legend ben duoi voi so luong.

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/order-status-chart.tsx
// ============================================================
'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { OrderStatusData } from '@/hooks/admin/use-dashboard-data';

interface OrderStatusChartProps {
  data: OrderStatusData[];
}

/** Custom center label hien thi tong so */
function CenterLabel({ viewBox, total }: { viewBox?: any; total: number }) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" className="fill-gray-900 text-2xl font-bold">
        {total}
      </tspan>
      <tspan x={cx} dy="22" className="fill-gray-500 text-xs">
        don hang
      </tspan>
    </text>
  );
}

/** Custom tooltip */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="text-sm font-medium text-gray-900">
          {item.payload.label}: {item.value}
        </span>
      </div>
    </div>
  );
}

/** Custom legend */
function CustomLegend({ payload }: any) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 px-2">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600 truncate">
            {entry.payload.label}
          </span>
          <span className="text-xs font-medium text-gray-900 ml-auto">
            {entry.payload.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 h-full">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Trang thai don hang
        </h3>
        <p className="text-sm text-gray-500">Phan bo theo trang thai</p>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              {/* Center label */}
              <CenterLabel total={total} />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## 10. RecentOrders - Don hang gan day

> File: `apps/fe/src/components/admin/dashboard/recent-orders.tsx`
> Bang hien thi 10 don hang moi nhat voi status badge, link den chi tiet.

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/recent-orders.tsx
// ============================================================
'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_MAP } from '@/lib/orderStatus';
import { PAYMENT_STATUS_MAP } from '@/lib/paymentStatus';
import type { RecentOrder } from '@/hooks/admin/use-dashboard-data';

interface RecentOrdersProps {
  orders: RecentOrder[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Don hang gan day
          </h3>
          <p className="text-sm text-gray-500">10 don hang moi nhat</p>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Xem tat ca
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Ma don
              </th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">
                Khach hang
              </th>
              <th className="px-5 py-3 text-right font-medium text-gray-500">
                Tong tien
              </th>
              <th className="px-5 py-3 text-center font-medium text-gray-500">
                Trang thai
              </th>
              <th className="hidden sm:table-cell px-5 py-3 text-left font-medium text-gray-500">
                Ngay dat
              </th>
              <th className="px-5 py-3 text-center font-medium text-gray-500">
                Thao tac
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              const statusConfig =
                ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP];
              const paymentConfig =
                PAYMENT_STATUS_MAP[
                  order.paymentStatus as keyof typeof PAYMENT_STATUS_MAP
                ];

              return (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {/* Ma don */}
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>

                  {/* Khach hang */}
                  <td className="px-5 py-3 text-gray-700">
                    <div className="max-w-[150px] truncate">
                      {order.customerName}
                    </div>
                  </td>

                  {/* Tong tien */}
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {order.total.toLocaleString('vi-VN')}d
                  </td>

                  {/* Trang thai */}
                  <td className="px-5 py-3 text-center">
                    {statusConfig && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusConfig.bgColor,
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </td>

                  {/* Ngay dat */}
                  <td className="hidden sm:table-cell px-5 py-3 text-gray-500">
                    {format(new Date(order.createdAt), 'dd/MM HH:mm')}
                  </td>

                  {/* Thao tac */}
                  <td className="px-5 py-3 text-center">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Xem chi tiet"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  Chua co don hang nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 11. TopProducts - San pham ban chay

> File: `apps/fe/src/components/admin/dashboard/top-products.tsx`
> Danh sach top 5 san pham ban chay nhat: anh, ten, so luong ban, doanh thu.

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/top-products.tsx
// ============================================================
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import type { TopProduct } from '@/hooks/admin/use-dashboard-data';

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold text-gray-900">
            San pham ban chay
          </h3>
        </div>
        <Link
          href="/admin/reports?tab=products"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Chi tiet
        </Link>
      </div>

      {/* List */}
      <ul className="divide-y divide-gray-100">
        {products.map((product, index) => (
          <li
            key={product._id}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors"
          >
            {/* Rank number */}
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
              {index + 1}
            </span>

            {/* Product image */}
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
              <Image
                src={product.image || '/images/placeholder.webp'}
                alt={product.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.name}
              </p>
              <p className="text-xs text-gray-500">
                Da ban: {product.soldCount}
              </p>
            </div>

            {/* Revenue */}
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {product.revenue.toLocaleString('vi-VN')}d
            </span>
          </li>
        ))}

        {products.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-gray-400">
            Chua co du lieu
          </li>
        )}
      </ul>
    </div>
  );
}
```

---

## 12. LowStockAlert - Canh bao ton kho

> File: `apps/fe/src/components/admin/dashboard/low-stock-alert.tsx`
> Danh sach san pham co ton kho duoi muc toi thieu (minStock).
> Hien thi canh bao mau do/cam.

```tsx
// ============================================================
// apps/fe/src/components/admin/dashboard/low-stock-alert.tsx
// ============================================================
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LowStockItem } from '@/hooks/admin/use-dashboard-data';

interface LowStockAlertProps {
  items: LowStockItem[];
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <span className="text-sm">OK</span>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Ton kho on dinh</p>
            <p className="text-xs text-green-600">
              Tat ca san pham deu tren muc toi thieu
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-100 bg-red-50/50 px-5 py-3 rounded-t-xl">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
          <h3 className="text-sm font-semibold text-red-800">
            Canh bao ton kho ({items.length})
          </h3>
        </div>
        <Link
          href="/admin/products?filter=low-stock"
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Xem tat ca
        </Link>
      </div>

      {/* Items */}
      <ul className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto">
        {items.map((item) => {
          const stockPercent = (item.currentStock / item.minStock) * 100;
          const isCritical = item.currentStock <= 2;

          return (
            <li
              key={item._id}
              className="flex items-center gap-3 px-5 py-3"
            >
              {/* Image */}
              <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={item.image || '/images/placeholder.webp'}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item.variantLabel} - {item.sku}
                </p>
              </div>

              {/* Stock count */}
              <div className="text-right flex-shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
                    isCritical
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  Con {item.currentStock}/{item.minStock}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

## 13. Responsive Behavior Summary

| Component | Desktop (>= 1024px) | Tablet (768-1023px) | Mobile (< 768px) |
|-----------|---------------------|---------------------|-------------------|
| Sidebar | Hien thi co dinh ben trai, collapsible 240px/64px | An, dung Drawer | An, dung Drawer |
| TopBar | Breadcrumb + Notification + UserMenu | Title + Notification + UserMenu | Hamburger + Title + Notification |
| Stats Cards | 4 cot | 2 cot | 1 cot |
| Charts | Revenue (2/3) + Pie (1/3) canh nhau | Stack 1 cot | Stack 1 cot |
| Recent Orders | Bang day du cot | An cot ngay | An cot ngay |
| Top Products | Danh sach ben phai | Stack ben duoi | Stack ben duoi |
| Low Stock | Danh sach ben phai | Stack ben duoi | Stack ben duoi |
| Notification | Dropdown 360px | Dropdown 360px | Dropdown full-width |
