# CUSTOMER LAYOUT - Header, Footer, Navigation

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/layout.tsx`, `apps/fe/src/components/customer/`
> Bao gom: CustomerLayout, Header (sticky + responsive), Footer, CartDrawer, SearchOverlay, MobileMenu
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + Zustand
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [CustomerLayout](#1-customerlayout)
2. [Header](#2-header)
3. [Footer](#3-footer)
4. [CartDrawer](#4-cartdrawer)
5. [SearchOverlay](#5-searchoverlay)
6. [MobileMenu](#6-mobilemenu)
7. [Responsive Behavior Summary](#7-responsive-behavior-summary)

---

## 1. CustomerLayout

> File: `apps/fe/src/app/(customer)/layout.tsx`
> Route group layout cho tat ca trang customer.
> Bao boc Header + main content + Footer.
> Quan ly state: cart drawer, search overlay, mobile menu.

### 1.1 Cau truc trang

```
┌─────────────────────────────────────────────────┐
│  Header (sticky, backdrop-blur khi scroll)      │
│  [Logo] [Nav] [Search] [Wishlist] [Cart] [User] │
├─────────────────────────────────────────────────┤
│                                                 │
│              Main Content (children)            │
│              min-height: calc(100vh - header     │
│              - footer)                          │
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer                                         │
│  [4 columns] [Newsletter] [Social] [Copyright]  │
└─────────────────────────────────────────────────┘

// Overlays (portal / absolute positioned)
┌──────────────────────┐
│  CartDrawer (right)  │ ← slide-in tu phai
│  SearchOverlay       │ ← fullscreen mobile / dropdown desktop
│  MobileMenu (left)   │ ← slide-in tu trai
└──────────────────────┘
```

### 1.2 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/layout.tsx
// ============================================================
'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/use-auth-store';
import { Header } from '@/components/customer/header';
import { Footer } from '@/components/customer/footer';
import { CartDrawer } from '@/components/customer/cart-drawer';
import { SearchOverlay } from '@/components/customer/search-overlay';
import { MobileMenu } from '@/components/customer/mobile-menu';
import { Toaster } from '@/components/ui/toaster';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  // ----- Overlay states -----
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const { isAuthenticated, fetchMe } = useAuthStore();

  // ----- Kiem tra auth state khi mount -----
  useEffect(() => {
    if (isAuthenticated) {
      fetchMe(); // Refresh user data + verify token con hop le
    }
  }, [isAuthenticated, fetchMe]);

  // ----- Dong tat ca overlays khi route thay doi -----
  useEffect(() => {
    setIsCartOpen(false);
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ----- Callback handlers (memo hoa de truyen xuong children) -----
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  // ----- Lock body scroll khi co overlay mo -----
  useEffect(() => {
    const hasOverlay = isCartOpen || isSearchOpen || isMobileMenuOpen;
    if (hasOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isSearchOpen, isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-100">
      {/* ===== HEADER ===== */}
      <Header
        onOpenCart={openCart}
        onOpenSearch={openSearch}
        onOpenMobileMenu={openMobileMenu}
      />

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />

      {/* ===== OVERLAYS (AnimatePresence de animate mount/unmount) ===== */}
      <AnimatePresence mode="wait">
        {isCartOpen && (
          <CartDrawer key="cart-drawer" onClose={closeCart} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSearchOpen && (
          <SearchOverlay key="search-overlay" onClose={closeSearch} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <MobileMenu key="mobile-menu" onClose={closeMobileMenu} />
        )}
      </AnimatePresence>

      {/* ===== TOAST NOTIFICATIONS ===== */}
      <Toaster />
    </div>
  );
}
```

### 1.3 Ket noi API / Stores

| Thanh phan | Store / Hook | Muc dich |
|---|---|---|
| Auth check | `useAuthStore` | Verify token, fetch user info khi mount |
| Cart badge | `useCartStore.getItemCount()` | Hien thi so luong item tren cart icon |
| Wishlist badge | `useWishlistStore` | Hien thi so luong item tren wishlist icon |
| Route change | `usePathname()` (Next.js) | Dong overlays khi chuyen trang |

---

## 2. Header

> File: `apps/fe/src/components/customer/header.tsx`
> Sticky header voi backdrop-blur khi scroll.
> Desktop: Logo | Nav | Search | Icons | User
> Mobile: Hamburger | Logo | Search | Cart

### 2.1 Cau truc Desktop

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]  Trang chu  San pham  Danh muc▼  Combo  │ 🔍  ♡(3)  🛒(2)  [Avatar▼] │
│                                    ┌──────────┐                              │
│                                    │ Category │ ← Dropdown (mega menu)      │
│                                    │   Tree   │                              │
│                                    └──────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Cau truc Mobile

```
┌──────────────────────────────────┐
│ [☰]   [Logo]         [🔍] [🛒(2)] │
└──────────────────────────────────┘
```

### 2.3 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/header.tsx
// ============================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import {
  Search,
  Heart,
  ShoppingCart,
  Menu,
  User,
  ChevronDown,
  LogOut,
  Package,
  Star,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCartStore } from '@/stores/use-cart-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CategoryMegaMenu } from './category-mega-menu';

// ----- Navigation links -----
const NAV_LINKS = [
  { href: '/', label: 'Trang chu' },
  { href: '/products', label: 'San pham' },
  { href: '/combo', label: 'Combo' },
] as const;

interface HeaderProps {
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenCart, onOpenSearch, onOpenMobileMenu }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const { scrollY } = useScroll();
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  // ----- Theo doi scroll de thay doi header style -----
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // ----- Category mega menu hover handlers -----
  const handleCategoryEnter = () => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
    }
    setIsCategoryOpen(true);
  };

  const handleCategoryLeave = () => {
    categoryTimeoutRef.current = setTimeout(() => {
      setIsCategoryOpen(false);
    }, 200); // Delay nho de tranh flicker khi di chuot
  };

  // ----- Dong mega menu khi route change -----
  useEffect(() => {
    setIsCategoryOpen(false);
  }, [pathname]);

  return (
    <motion.header
      className={cn(
        'sticky top-0 z-sticky w-full transition-all duration-300',
        isScrolled
          ? 'bg-white/90 shadow-md backdrop-blur-md'
          : 'bg-white shadow-sm',
      )}
      // Animate chieu cao nhe khi scroll
      animate={{
        height: isScrolled ? 64 : 72,
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* ===== LEFT: Mobile Hamburger + Logo ===== */}
        <div className="flex items-center gap-3">
          {/* Hamburger - chi hien tren mobile */}
          <button
            className="lg:hidden rounded-md p-2 text-foreground hover:bg-surface-200
                       transition-colors"
            onClick={onOpenMobileMenu}
            aria-label="Mo menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Noi That Viet"
              width={40}
              height={40}
              className="h-8 w-8 lg:h-10 lg:w-10"
              priority
            />
            <span className="hidden sm:block text-h5 font-heading font-semibold
                             text-primary-500">
              Noi That Viet
            </span>
          </Link>
        </div>

        {/* ===== CENTER: Desktop Navigation ===== */}
        <nav className="hidden lg:flex items-center gap-1" role="navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-4 py-2 text-body font-medium rounded-md transition-colors',
                'hover:bg-surface-200 hover:text-primary-500',
                pathname === link.href
                  ? 'text-primary-500'
                  : 'text-foreground',
              )}
            >
              {link.label}
              {/* Active indicator line */}
              {pathname === link.href && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}

          {/* Danh muc - voi mega menu dropdown */}
          <div
            className="relative"
            onMouseEnter={handleCategoryEnter}
            onMouseLeave={handleCategoryLeave}
          >
            <button
              className={cn(
                'flex items-center gap-1 px-4 py-2 text-body font-medium rounded-md',
                'transition-colors hover:bg-surface-200 hover:text-primary-500',
                isCategoryOpen ? 'text-primary-500 bg-surface-200' : 'text-foreground',
              )}
            >
              Danh muc
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isCategoryOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Mega Menu Dropdown */}
            {isCategoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-1 w-[600px] rounded-lg bg-white
                           shadow-xl border border-border p-6"
                onMouseEnter={handleCategoryEnter}
                onMouseLeave={handleCategoryLeave}
              >
                <CategoryMegaMenu />
              </motion.div>
            )}
          </div>
        </nav>

        {/* ===== RIGHT: Actions ===== */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search button */}
          <button
            onClick={onOpenSearch}
            className="rounded-full p-2 text-foreground hover:bg-surface-200
                       transition-colors"
            aria-label="Tim kiem"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Wishlist - an tren mobile nho */}
          <Link
            href="/wishlist"
            className="hidden sm:flex relative rounded-full p-2 text-foreground
                       hover:bg-surface-200 transition-colors"
            aria-label="Danh sach yeu thich"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full
                           px-1 text-[10px] font-bold flex items-center justify-center"
              >
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </Badge>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative rounded-full p-2 text-foreground hover:bg-surface-200
                       transition-colors"
            aria-label="Gio hang"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full
                           px-1 text-[10px] font-bold flex items-center justify-center"
              >
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </Badge>
            )}
          </button>

          {/* User Menu / Login */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1.5
                                   hover:bg-surface-200 transition-colors">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full
                                    bg-primary-100 text-primary-600 text-body-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {/* User info */}
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-body-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-caption text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Ho so ca nhan
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/orders" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Don hang cua toi
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Yeu thich ({wishlistCount})
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/reviews" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Danh gia cua toi
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="text-danger-600 focus:text-danger-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Dang xuat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dang-nhap">Dang nhap</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dang-ky">Dang ky</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
```

### 2.4 CategoryMegaMenu

> File: `apps/fe/src/components/customer/category-mega-menu.tsx`
> Mega menu dropdown hien thi cay danh muc.
> Fetch categories tu API (React Query, cached).

```tsx
// ============================================================
// apps/fe/src/components/customer/category-mega-menu.tsx
// ============================================================
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/category-service';
import { Skeleton } from '@/components/ui/skeleton';
import type { Category } from '@/types';

export function CategoryMegaMenu() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 5 * 60 * 1000, // Cache 5 phut
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {categories?.map((cat: Category) => (
        <div key={cat._id}>
          {/* Parent category */}
          <Link
            href={`/categories/${cat.slug}`}
            className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-200
                       transition-colors group"
          >
            {cat.image && (
              <Image
                src={cat.image}
                alt={cat.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-md object-cover"
              />
            )}
            <div>
              <p className="text-body-sm font-semibold text-foreground
                            group-hover:text-primary-500 transition-colors">
                {cat.name}
              </p>
              <p className="text-caption text-muted-foreground">
                {cat.productCount} san pham
              </p>
            </div>
          </Link>

          {/* Sub-categories */}
          {cat.children && cat.children.length > 0 && (
            <ul className="mt-1 ml-14 space-y-0.5">
              {cat.children.slice(0, 4).map((sub: Category) => (
                <li key={sub._id}>
                  <Link
                    href={`/categories/${sub.slug}`}
                    className="text-body-sm text-muted-foreground hover:text-primary-500
                               transition-colors"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
              {cat.children.length > 4 && (
                <li>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="text-body-sm text-primary-500 font-medium hover:underline"
                  >
                    Xem tat ca →
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2.5 Ket noi API / Stores

| Thanh phan | Store / API | Muc dich |
|---|---|---|
| Nav active state | `usePathname()` | Highlight link dang active |
| Scroll detection | `useScroll()` (Framer Motion) | Sticky header style change |
| Cart count | `useCartStore.getItemCount()` | Badge tren cart icon |
| Wishlist count | `useWishlistStore.items.length` | Badge tren wishlist icon |
| User info | `useAuthStore.user` | Avatar, name, dropdown menu |
| Logout | `useAuthStore.logout()` | Goi API logout + clear state |
| Categories | `categoryService.getCategoryTree()` + React Query | Mega menu data |

---

## 3. Footer

> File: `apps/fe/src/components/customer/footer.tsx`
> 4 cot: Ve chung toi, Chinh sach, Ho tro, Lien he
> Newsletter signup, social links, copyright
> Responsive: 4 cols → 2 cols → 1 col

### 3.1 Cau truc

```
Desktop (lg+):
┌──────────────────────────────────────────────────────────────────┐
│  Ve chung toi    │  Chinh sach       │  Ho tro         │  Lien he       │
│  - Gioi thieu    │  - Doi tra hang   │  - Huong dan    │  - Dia chi     │
│  - Tuyen dung    │  - Bao hanh       │  - Cau hoi      │  - Hotline     │
│  - Lien he       │  - Van chuyen     │  - Lien he      │  - Email       │
│  - Blog          │  - Bao mat        │  - Khieu nai    │  - Gio lam viec│
├──────────────────────────────────────────────────────────────────┤
│  [Newsletter signup form]                    [Facebook] [Insta] [YouTube] │
├──────────────────────────────────────────────────────────────────┤
│  © 2026 Noi That Viet. Moi quyen duoc bao luu.                          │
└──────────────────────────────────────────────────────────────────┘

Tablet (md): 2 cot (2x2 grid)
Mobile (sm): 1 cot (stacked)
```

### 3.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/footer.tsx
// ============================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { FadeInWhenVisible } from '@/components/ui/animations';

// ----- Du lieu tinh cho footer -----
const FOOTER_SECTIONS = [
  {
    title: 'Ve chung toi',
    links: [
      { label: 'Gioi thieu', href: '/about' },
      { label: 'Tuyen dung', href: '/careers' },
      { label: 'Tin tuc & Blog', href: '/blog' },
      { label: 'He thong cua hang', href: '/stores' },
    ],
  },
  {
    title: 'Chinh sach',
    links: [
      { label: 'Chinh sach doi tra', href: '/policies/returns' },
      { label: 'Chinh sach bao hanh', href: '/policies/warranty' },
      { label: 'Chinh sach van chuyen', href: '/policies/shipping' },
      { label: 'Chinh sach bao mat', href: '/policies/privacy' },
      { label: 'Dieu khoan su dung', href: '/policies/terms' },
    ],
  },
  {
    title: 'Ho tro khach hang',
    links: [
      { label: 'Huong dan mua hang', href: '/support/how-to-buy' },
      { label: 'Huong dan thanh toan', href: '/support/payment' },
      { label: 'Cau hoi thuong gap', href: '/support/faq' },
      { label: 'Khieu nai & Gop y', href: '/support/feedback' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/noithatviet', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/noithatviet', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/noithatviet', label: 'YouTube' },
] as const;

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // ----- Newsletter subscribe -----
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email: email.trim() });
      toast({
        title: 'Dang ky thanh cong!',
        description: 'Cam on ban da dang ky nhan tin tu chung toi.',
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: 'Co loi xay ra',
        description: error.message || 'Vui long thu lai sau.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-primary-900 text-white">
      <FadeInWhenVisible>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          {/* ===== MAIN FOOTER GRID ===== */}
          <div className="grid grid-cols-1 gap-8 py-12
                          md:grid-cols-2
                          lg:grid-cols-4">
            {/* --- 3 cot link --- */}
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 text-h5 font-semibold text-accent-300">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-body-sm text-primary-200 hover:text-white
                                   transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* --- Cot Lien he --- */}
            <div>
              <h3 className="mb-4 text-h5 font-semibold text-accent-300">
                Lien he
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-body-sm text-primary-200">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                  <span>123 Nguyen Van Linh, Quan 7, TP. Ho Chi Minh</span>
                </li>
                <li className="flex items-center gap-2 text-body-sm text-primary-200">
                  <Phone className="h-4 w-4 flex-shrink-0 text-accent-300" />
                  <a href="tel:1900xxxx" className="hover:text-white transition-colors">
                    1900 xxxx (8h-21h)
                  </a>
                </li>
                <li className="flex items-center gap-2 text-body-sm text-primary-200">
                  <Mail className="h-4 w-4 flex-shrink-0 text-accent-300" />
                  <a href="mailto:info@noithatviet.vn" className="hover:text-white transition-colors">
                    info@noithatviet.vn
                  </a>
                </li>
                <li className="flex items-center gap-2 text-body-sm text-primary-200">
                  <Clock className="h-4 w-4 flex-shrink-0 text-accent-300" />
                  <span>T2 - CN: 8:00 - 21:00</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ===== NEWSLETTER + SOCIAL ===== */}
          <div className="flex flex-col items-center justify-between gap-6 border-t
                          border-primary-700 py-8
                          md:flex-row">
            {/* Newsletter form */}
            <div className="w-full max-w-md">
              <p className="mb-2 text-body-sm font-medium text-primary-200">
                Dang ky nhan tin khuyen mai
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email cua ban..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-primary-800 border-primary-600 text-white
                             placeholder:text-primary-400 focus:border-accent-300
                             focus:ring-accent-300"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent-300 text-primary-900 hover:bg-accent-200
                             font-semibold"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Dang ky
                </Button>
              </form>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full
                             bg-primary-800 text-primary-200 hover:bg-accent-300
                             hover:text-primary-900 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* ===== COPYRIGHT ===== */}
          <div className="border-t border-primary-700 py-6 text-center">
            <p className="text-caption text-primary-400">
              &copy; {new Date().getFullYear()} Noi That Viet. Moi quyen duoc bao luu.
            </p>
          </div>
        </div>
      </FadeInWhenVisible>
    </footer>
  );
}
```

### 3.3 Responsive Behavior

| Breakpoint | Cot | Chi tiet |
|---|---|---|
| `lg` (1024px+) | 4 cot | Grid 4 columns deu |
| `md` (768px) | 2 cot | Grid 2x2 |
| Default (<768px) | 1 cot | Stacked, center-aligned |

---

## 4. CartDrawer

> File: `apps/fe/src/components/customer/cart-drawer.tsx`
> Slide-in panel tu phia phai, hien thi gio hang.
> Dung Framer Motion cho animation slide + overlay.
> Ket noi truc tiep voi `useCartStore`.

### 4.1 Cau truc

```
┌───────────────────────────────────┐
│ [Backdrop overlay (click to close)]│
│          ┌────────────────────────┤
│          │  Gio hang (3)    [X]   │
│          ├────────────────────────┤
│          │  [Img] Ten SP 1        │
│          │        Mau: Nau        │
│          │        [-] 2 [+]       │
│          │        1.200.000₫      │
│          ├────────────────────────┤
│          │  [Img] Ten SP 2        │
│          │        Mau: Xam        │
│          │        [-] 1 [+]       │
│          │        850.000₫        │
│          ├────────────────────────┤
│          │                        │
│          │  (scrollable list)     │
│          │                        │
│          ├────────────────────────┤
│          │  Tam tinh: 3.250.000₫  │
│          │  [Xem gio hang]        │
│          │  [Thanh toan]          │
│          └────────────────────────┤
└───────────────────────────────────┘
```

### 4.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/cart-drawer.tsx
// ============================================================
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, type CartItem } from '@/stores/use-cart-store';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface CartDrawerProps {
  onClose: () => void;
}

export function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getSubtotal, getItemCount } =
    useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  return (
    <>
      {/* ===== BACKDROP ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-overlay bg-black/50"
        onClick={onClose}
        aria-label="Dong gio hang"
      />

      {/* ===== DRAWER PANEL ===== */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-modal flex h-full w-full flex-col
                   bg-white shadow-xl
                   sm:w-[420px]"
      >
        {/* ----- Header ----- */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary-500" />
            <h2 className="text-h4 font-semibold">
              Gio hang
              {itemCount > 0 && (
                <span className="ml-1 text-body text-muted-foreground">
                  ({itemCount})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-surface-200 transition-colors"
            aria-label="Dong"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ----- Cart Items (scrollable) ----- */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            // === Empty state ===
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full
                              bg-surface-200 mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-h5 font-medium text-foreground mb-1">
                Gio hang trong
              </p>
              <p className="text-body-sm text-muted-foreground mb-6">
                Hay them san pham vao gio hang de bat dau mua sam!
              </p>
              <Button asChild onClick={onClose}>
                <Link href="/products">Kham pha san pham</Link>
              </Button>
            </div>
          ) : (
            // === Cart items list ===
            <ul className="space-y-4">
              {items.map((item: CartItem) => (
                <motion.li
                  key={item.variant.sku}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="flex gap-3 rounded-lg border border-border p-3"
                >
                  {/* Product image */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={onClose}
                    className="flex-shrink-0"
                  >
                    <Image
                      src={item.product.thumbnail}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  </Link>

                  {/* Product info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={onClose}
                        className="text-body-sm font-medium text-foreground
                                   line-clamp-2 hover:text-primary-500 transition-colors"
                      >
                        {item.product.name}
                      </Link>

                      {/* Variant info */}
                      <div className="mt-1 flex flex-wrap gap-2 text-caption text-muted-foreground">
                        {item.variant.color && (
                          <span className="flex items-center gap-1">
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border"
                              style={{ backgroundColor: item.variant.color.code }}
                            />
                            {item.variant.color.name}
                          </span>
                        )}
                        {item.variant.dimensions && (
                          <span>{item.variant.dimensions.label}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center rounded-md border border-border">
                        <button
                          onClick={() =>
                            updateQuantity(item.variant.sku, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center
                                     text-muted-foreground hover:text-foreground
                                     disabled:opacity-30 transition-colors"
                          aria-label="Giam so luong"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-8 w-8 items-center justify-center
                                         text-body-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variant.sku, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.variant.stock}
                          className="flex h-8 w-8 items-center justify-center
                                     text-muted-foreground hover:text-foreground
                                     disabled:opacity-30 transition-colors"
                          aria-label="Tang so luong"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price + Remove */}
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-semibold text-primary-500">
                          {formatCurrency(item.variant.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.variant.sku)}
                          className="rounded-full p-1 text-muted-foreground
                                     hover:text-danger-500 transition-colors"
                          aria-label="Xoa san pham"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* ----- Footer (chi hien khi co items) ----- */}
        {items.length > 0 && (
          <div className="border-t border-border px-4 py-4 space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-body text-muted-foreground">Tam tinh:</span>
              <span className="text-h4 font-bold text-primary-500">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="text-caption text-muted-foreground">
              Phi van chuyen se duoc tinh tai trang thanh toan.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full" onClick={onClose}>
                <Link href="/cart">Xem gio hang</Link>
              </Button>
              <Button asChild className="w-full" onClick={onClose}>
                <Link href="/checkout">Thanh toan</Link>
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
```

### 4.3 Ket noi API / Stores

| Thanh phan | Store | Muc dich |
|---|---|---|
| Items | `useCartStore.items` | Danh sach san pham trong gio |
| Quantity | `useCartStore.updateQuantity()` | Tang/giam so luong |
| Remove | `useCartStore.removeItem()` | Xoa san pham khoi gio |
| Subtotal | `useCartStore.getSubtotal()` | Tinh tong tam tinh |
| Count | `useCartStore.getItemCount()` | Hien thi so item tren header |

### 4.4 Animation Config

```typescript
// Drawer slide animation
const drawerVariants = {
  initial: { x: '100%' },       // Bat dau tu ngoai man hinh (ben phai)
  animate: { x: 0 },            // Slide vao vi tri
  exit: { x: '100%' },          // Slide ra lai
};

// Transition: spring de co cam giac tu nhien
const drawerTransition = {
  type: 'spring',
  damping: 30,       // Do giam chan (cao = it bounce)
  stiffness: 300,    // Do cung lo xo (cao = nhanh)
};

// Backdrop fade
const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
```

---

## 5. SearchOverlay

> File: `apps/fe/src/components/customer/search-overlay.tsx`
> Fullscreen overlay (mobile) / dropdown (desktop).
> Tim kiem debounced voi auto-complete va recent searches.

### 5.1 Cau truc

```
Desktop:
┌──────────────────────────────────┐
│         [Backdrop]               │
│  ┌────────────────────────────┐  │
│  │ 🔍 [________________] [X] │  │
│  ├────────────────────────────┤  │
│  │ Tim kiem gan day:          │  │ ← Khi chua nhap gi
│  │  - sofa go                 │  │
│  │  - ban an                  │  │
│  ├────────────────────────────┤  │
│  │ Ket qua:                   │  │ ← Khi dang nhap
│  │  [Img] Sofa go oc cho..   │  │
│  │  [Img] Ban an go soi...   │  │
│  │  [Img] ...                 │  │
│  │  Xem tat ca (24 ket qua)  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Mobile: fullscreen overlay
```

### 5.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/search-overlay.tsx
// ============================================================
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { productService } from '@/services/product-service';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

// ----- Local Storage key cho recent searches -----
const RECENT_SEARCHES_KEY = 'furniture-recent-searches';
const MAX_RECENT_SEARCHES = 6;

interface SearchOverlayProps {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1); // Keyboard navigation

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  // ----- Auto-focus input khi mo -----
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ----- Load recent searches tu localStorage -----
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ----- Luu recent search -----
  const saveRecentSearch = useCallback((searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ----- Xoa mot recent search -----
  const removeRecentSearch = useCallback((searchTerm: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== searchTerm);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ----- Fetch ket qua khi debounced query thay doi -----
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const { data, meta } = await productService.search({
          q: debouncedQuery.trim(),
          limit: 5, // Chi lay 5 ket qua preview
        });
        setResults(data);
        setTotalResults(meta.total);
      } catch {
        setResults([]);
        setTotalResults(0);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // ----- Keyboard navigation -----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && results[activeIndex]) {
            // Navigate to product
            saveRecentSearch(query);
            router.push(`/products/${results[activeIndex].slug}`);
            onClose();
          } else if (query.trim()) {
            // Navigate to search page
            saveRecentSearch(query);
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            onClose();
          }
          break;
      }
    },
    [onClose, activeIndex, results, query, router, saveRecentSearch],
  );

  // ----- Submit form (Enter khi khong chon item) -----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  // ----- Click recent search -----
  const handleRecentClick = (searchTerm: string) => {
    setQuery(searchTerm);
    saveRecentSearch(searchTerm);
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    onClose();
  };

  return (
    <>
      {/* ===== BACKDROP ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-overlay bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ===== SEARCH PANEL ===== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-0 top-0 z-modal
                   bg-white shadow-xl
                   md:inset-x-auto md:left-1/2 md:top-20 md:-translate-x-1/2
                   md:w-[640px] md:rounded-xl
                   max-h-[90vh] md:max-h-[70vh] overflow-hidden
                   flex flex-col"
      >
        {/* ----- Search Input ----- */}
        <form onSubmit={handleSubmit} className="border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tim kiem san pham, danh muc..."
              className="flex-1 text-body bg-transparent outline-none
                         placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-surface-200 transition-colors"
              aria-label="Dong tim kiem"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* ----- Results Area (scrollable) ----- */}
        <div className="flex-1 overflow-y-auto">
          {/* Recent searches - hien khi chua nhap gi */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-body-sm font-medium text-muted-foreground">
                  Tim kiem gan day
                </p>
              </div>
              <ul className="space-y-1">
                {recentSearches.map((term) => (
                  <li key={term}>
                    <button
                      onClick={() => handleRecentClick(term)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2
                                 hover:bg-surface-200 transition-colors group"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left text-body-sm text-foreground">
                        {term}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded-full p-1
                                   hover:bg-surface-300 transition-all"
                        aria-label={`Xoa "${term}" khoi lich su`}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Search results preview */}
          {query.trim() && results.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-body-sm text-muted-foreground mb-2">
                Tim thay {totalResults} ket qua
              </p>
              <ul className="space-y-1">
                {results.map((product, index) => (
                  <li key={product._id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => {
                        saveRecentSearch(query);
                        onClose();
                      }}
                      className={`flex items-center gap-3 rounded-md px-2 py-2
                                  transition-colors
                                  ${
                                    index === activeIndex
                                      ? 'bg-primary-50 ring-1 ring-primary-200'
                                      : 'hover:bg-surface-200'
                                  }`}
                    >
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-foreground truncate">
                          {product.name}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {product.category?.name}
                        </p>
                      </div>
                      <span className="text-body-sm font-semibold text-primary-500 flex-shrink-0">
                        {formatCurrency(product.minPrice)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Xem tat ca */}
              {totalResults > 5 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => {
                    saveRecentSearch(query);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 mt-3 py-2
                             text-body-sm font-medium text-primary-500
                             hover:text-primary-600 transition-colors"
                >
                  Xem tat ca {totalResults} ket qua
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {/* No results */}
          {query.trim() && !isSearching && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-body text-muted-foreground">
                Khong tim thay ket qua cho "{query}"
              </p>
              <p className="text-body-sm text-muted-foreground mt-1">
                Thu tim kiem voi tu khoa khac
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
```

### 5.3 Ket noi API / Stores

| Thanh phan | API / Store | Muc dich |
|---|---|---|
| Search | `productService.search({ q, limit })` | Tim kiem san pham auto-complete |
| Debounce | `useDebounce(query, 300)` | Delay 300ms tranh goi API lien tuc |
| Recent searches | `localStorage` | Luu/doc lich su tim kiem |
| Navigation | `useRouter()` | Chuyen trang khi submit hoac chon ket qua |

### 5.4 Keyboard Shortcuts

| Phim | Hanh dong |
|---|---|
| `Esc` | Dong search overlay |
| `Arrow Down` | Di chuyen xuong ket qua tiep theo |
| `Arrow Up` | Di chuyen len ket qua truoc |
| `Enter` (khi chon ket qua) | Chuyen den trang san pham |
| `Enter` (khi khong chon) | Chuyen den trang search |

---

## 6. MobileMenu

> File: `apps/fe/src/components/customer/mobile-menu.tsx`
> Slide-in tu trai, hien thi tren man hinh nho (<1024px).
> Bao gom: user info, navigation, categories accordion, quick links.

### 6.1 Cau truc

```
┌────────────────────────┬──────────┐
│ ┌────────────────────┐ │          │
│ │ [Avatar] Xin chao  │ │ Backdrop │
│ │ Ten nguoi dung     │ │ (click   │
│ ├────────────────────┤ │  to      │
│ │ Trang chu          │ │  close)  │
│ │ San pham           │ │          │
│ │ Danh muc    ▼      │ │          │
│ │  ├─ Phong ngu      │ │          │
│ │  ├─ Phong khach    │ │          │
│ │  ├─ Phong bep      │ │          │
│ │  └─ Van phong      │ │          │
│ │ Combo              │ │          │
│ │ Yeu thich (3)      │ │          │
│ ├────────────────────┤ │          │
│ │ Don hang cua toi   │ │          │
│ │ Ho so              │ │          │
│ │ Danh gia           │ │          │
│ ├────────────────────┤ │          │
│ │ [Dang xuat]        │ │          │
│ └────────────────────┘ │          │
└────────────────────────┴──────────┘
```

### 6.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/mobile-menu.tsx
// ============================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  Package,
  Grid3X3,
  Layers,
  Heart,
  ShoppingCart,
  User,
  Star,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/use-auth-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import { categoryService } from '@/services/category-service';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';

interface MobileMenuProps {
  onClose: () => void;
}

// ----- Nav links -----
const MAIN_LINKS = [
  { href: '/', label: 'Trang chu', icon: Home },
  { href: '/products', label: 'San pham', icon: Package },
  { href: '/combo', label: 'Combo', icon: Layers },
] as const;

export function MobileMenu({ onClose }: MobileMenuProps) {
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const { data: categories } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* ===== BACKDROP ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-overlay bg-black/50"
        onClick={onClose}
      />

      {/* ===== MENU PANEL (slide tu trai) ===== */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed left-0 top-0 z-modal flex h-full w-[300px] max-w-[80vw]
                   flex-col bg-white shadow-xl"
      >
        {/* ----- Header ----- */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 min-w-0">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full
                                bg-primary-100 text-primary-600 font-semibold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-foreground truncate">
                  Xin chao!
                </p>
                <p className="text-caption text-muted-foreground truncate">
                  {user.name}
                </p>
              </div>
            </div>
          ) : (
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              <Image src="/images/logo.svg" alt="Logo" width={32} height={32} />
              <span className="text-h5 font-semibold text-primary-500">
                Noi That Viet
              </span>
            </Link>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-surface-200 transition-colors"
            aria-label="Dong menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ----- Navigation (scrollable) ----- */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Main links */}
          <ul className="px-2">
            {MAIN_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm',
                    'transition-colors',
                    pathname === link.href
                      ? 'bg-primary-50 text-primary-500 font-medium'
                      : 'text-foreground hover:bg-surface-200',
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Danh muc - accordion */}
            <li>
              <button
                onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2.5',
                  'text-body-sm text-foreground hover:bg-surface-200 transition-colors',
                )}
              >
                <span className="flex items-center gap-3">
                  <Grid3X3 className="h-5 w-5" />
                  Danh muc
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isCategoryExpanded && 'rotate-180',
                  )}
                />
              </button>

              <AnimatePresence>
                {isCategoryExpanded && categories && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-8 border-l-2 border-surface-300 pl-3"
                  >
                    {categories.map((cat: Category) => (
                      <li key={cat._id}>
                        <Link
                          href={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-md px-2 py-2
                                     text-body-sm text-muted-foreground
                                     hover:text-primary-500 transition-colors"
                        >
                          {cat.image && (
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              width={24}
                              height={24}
                              className="h-6 w-6 rounded object-cover"
                            />
                          )}
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>

            {/* Wishlist */}
            <li>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="flex items-center justify-between rounded-md px-3 py-2.5
                           text-body-sm text-foreground hover:bg-surface-200 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Heart className="h-5 w-5" />
                  Yeu thich
                </span>
                {wishlistCount > 0 && (
                  <span className="rounded-full bg-danger-50 px-2 py-0.5 text-caption
                                   font-medium text-danger-600">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>

          {/* Divider */}
          <div className="my-2 border-t border-border" />

          {/* Account links (chi hien khi da dang nhap) */}
          {isAuthenticated && (
            <ul className="px-2">
              <li>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5
                             text-body-sm text-foreground hover:bg-surface-200 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Don hang cua toi
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5
                             text-body-sm text-foreground hover:bg-surface-200 transition-colors"
                >
                  <User className="h-5 w-5" />
                  Ho so ca nhan
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5
                             text-body-sm text-foreground hover:bg-surface-200 transition-colors"
                >
                  <Star className="h-5 w-5" />
                  Danh gia cua toi
                </Link>
              </li>
            </ul>
          )}
        </nav>

        {/* ----- Footer: Login/Logout ----- */}
        <div className="border-t border-border px-4 py-4">
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="w-full text-danger-600 border-danger-200 hover:bg-danger-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Dang xuat
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full" onClick={onClose}>
                <Link href="/dang-nhap">Dang nhap</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" onClick={onClose}>
                <Link href="/dang-ky">Dang ky tai khoan</Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
```

### 6.3 Ket noi API / Stores

| Thanh phan | Store / API | Muc dich |
|---|---|---|
| User info | `useAuthStore.user` | Hien thi avatar, ten |
| Auth state | `useAuthStore.isAuthenticated` | An/hien account links |
| Logout | `useAuthStore.logout()` | Dang xuat |
| Categories | `categoryService.getCategoryTree()` + React Query | Danh sach danh muc accordion |
| Wishlist count | `useWishlistStore.items.length` | Badge so luong yeu thich |
| Active route | `usePathname()` | Highlight link dang active |

---

## 7. Responsive Behavior Summary

### 7.1 Breakpoint Matrix

| Component | Mobile (<768px) | Tablet (768-1023px) | Desktop (1024px+) |
|---|---|---|---|
| **Header** | Hamburger + Logo + Search + Cart | Hamburger + Logo + Search + Icons | Full nav + all icons + user menu |
| **Navigation** | MobileMenu (slide-in) | MobileMenu (slide-in) | Inline nav bar |
| **Category Menu** | Accordion trong MobileMenu | Accordion trong MobileMenu | Mega menu dropdown (hover) |
| **Search** | Fullscreen overlay | Fullscreen overlay | Centered dropdown (640px) |
| **CartDrawer** | Full-width slide-in | 420px slide-in tu phai | 420px slide-in tu phai |
| **Footer** | 1 column stacked | 2 columns (2x2) | 4 columns |
| **User Menu** | Trong MobileMenu | Trong MobileMenu | Dropdown menu (header) |

### 7.2 Animation Summary

| Component | Animation | Framer Motion Config |
|---|---|---|
| Header scroll | Height change + backdrop blur | `animate={{ height }}` + CSS `transition-all` |
| Nav indicator | Shared layout animation | `layoutId="nav-indicator"` |
| Category dropdown | Fade + slide down | `initial/animate/exit` opacity + y |
| CartDrawer | Slide from right | `x: '100%' → 0`, spring transition |
| MobileMenu | Slide from left | `x: '-100%' → 0`, spring transition |
| SearchOverlay | Fade + slide down | `opacity + y: -20 → 0` |
| Category accordion | Height expand/collapse | `height: 0 → auto` |
| Cart items | Layout + fade | `layout`, `initial/animate/exit` |
| Backdrop | Fade in/out | `opacity: 0 → 1` |

### 7.3 Z-Index Layers

```
z-sticky (100)   → Header (sticky)
z-overlay (200)  → Backdrop cua tat ca overlays
z-modal (300)    → CartDrawer, SearchOverlay, MobileMenu panels
z-popover (400)  → Dropdown menus (category mega menu, user menu)
z-tooltip (500)  → Tooltips
```

---

> **Lien ket tai lieu:**
> - Types: `04-frontend/01-shared-types.md`
> - API Client & Stores: `04-frontend/02-shared-api-client.md`
> - UI Components: `04-frontend/03-shared-ui-components.md`
> - Tiep theo: `04-frontend/05-customer-home.md` (Home Page)
