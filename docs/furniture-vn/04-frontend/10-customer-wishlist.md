# CUSTOMER - DANH SACH YEU THICH & SO SANH

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/wishlist/`, `apps/fe/src/components/wishlist/`
> Quan ly danh sach yeu thich, nut toggle wishlist tren ProductCard/ProductDetail, modal them vao gio tu wishlist
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + Zustand
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Wishlist Store (Zustand)](#1-wishlist-store-zustand)
2. [WishlistPage - Trang danh sach yeu thich](#2-wishlistpage---trang-danh-sach-yeu-thich)
3. [WishlistButton - Nut toggle yeu thich](#3-wishlistbutton---nut-toggle-yeu-thich)
4. [AddToCartFromWishlist - Modal them vao gio](#4-addtocartfromwishlist---modal-them-vao-gio)
5. [Loading Skeleton](#5-loading-skeleton)
6. [Responsive Design](#6-responsive-design)

---

## 1. Wishlist Store (Zustand)

> File: `apps/fe/src/stores/wishlist-store.ts`
> Quan ly state wishlist tren client, dong bo voi API backend.
> Su dung optimistic update de UX muot ma.

```typescript
// apps/fe/src/stores/wishlist-store.ts
'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ======================== TYPES ========================

export interface WishlistItem {
  id: string;                    // wishlist item ID
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;      // Gia goc (neu dang giam gia)
    thumbnail: string;
    stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
    stockQuantity: number;
    hasVariants: boolean;
    category: {
      name: string;
      slug: string;
    };
  };
  addedAt: string;               // ISO date string
}

interface WishlistState {
  // === Data ===
  items: WishlistItem[];
  itemIds: Set<string>;          // Set productId de check nhanh
  isLoading: boolean;
  isToggling: Set<string>;       // Set productId dang toggle (loading per item)

  // === Actions ===
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  removeAll: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

// ======================== STORE ========================

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  itemIds: new Set(),
  isLoading: false,
  isToggling: new Set(),

  // --- Fetch toan bo wishlist ---
  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<{ data: WishlistItem[] }>('/wishlist');
      const items = res.data.data;
      const itemIds = new Set(items.map((item) => item.productId));
      set({ items, itemIds, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Fetch wishlist failed:', error);
    }
  },

  // --- Toggle (them/xoa) wishlist voi optimistic update ---
  toggleWishlist: async (productId: string) => {
    const { itemIds, items, isToggling } = get();

    // Tranh double click
    if (isToggling.has(productId)) return;

    // Bat dau toggling
    const newToggling = new Set(isToggling);
    newToggling.add(productId);
    set({ isToggling: newToggling });

    const isCurrentlyInWishlist = itemIds.has(productId);

    if (isCurrentlyInWishlist) {
      // === OPTIMISTIC REMOVE ===
      const removedItem = items.find((i) => i.productId === productId);
      const newItems = items.filter((i) => i.productId !== productId);
      const newIds = new Set(itemIds);
      newIds.delete(productId);
      set({ items: newItems, itemIds: newIds });

      try {
        await apiClient.delete(`/wishlist/${productId}`);
        toast.success('Da xoa khoi yeu thich');
      } catch (error) {
        // Rollback
        if (removedItem) {
          set({
            items: [...newItems, removedItem],
            itemIds: new Set([...newIds, productId]),
          });
        }
        toast.error('Khong the xoa. Vui long thu lai.');
      }
    } else {
      // === OPTIMISTIC ADD ===
      const newIds = new Set(itemIds);
      newIds.add(productId);
      set({ itemIds: newIds });

      try {
        const res = await apiClient.post<{ data: WishlistItem }>('/wishlist', {
          productId,
        });
        set({ items: [...get().items, res.data.data] });
        toast.success('Da them vao yeu thich');
      } catch (error) {
        // Rollback
        const rollbackIds = new Set(get().itemIds);
        rollbackIds.delete(productId);
        set({ itemIds: rollbackIds });
        toast.error('Khong the them. Vui long thu lai.');
      }
    }

    // Ket thuc toggling
    const finalToggling = new Set(get().isToggling);
    finalToggling.delete(productId);
    set({ isToggling: finalToggling });
  },

  // --- Xoa 1 item (dung trong WishlistPage) ---
  removeFromWishlist: async (productId: string) => {
    const { items, itemIds } = get();
    const removedItem = items.find((i) => i.productId === productId);
    const newItems = items.filter((i) => i.productId !== productId);
    const newIds = new Set(itemIds);
    newIds.delete(productId);
    set({ items: newItems, itemIds: newIds });

    try {
      await apiClient.delete(`/wishlist/${productId}`);
      toast.success('Da xoa khoi yeu thich');
    } catch (error) {
      // Rollback
      if (removedItem) {
        set({
          items: [...get().items, removedItem],
          itemIds: new Set([...get().itemIds, productId]),
        });
      }
      toast.error('Xoa that bai. Vui long thu lai.');
    }
  },

  // --- Xoa tat ca ---
  removeAll: async () => {
    const { items, itemIds } = get();
    const backup = { items: [...items], itemIds: new Set(itemIds) };
    set({ items: [], itemIds: new Set() });

    try {
      await apiClient.delete('/wishlist/all');
      toast.success('Da xoa tat ca san pham yeu thich');
    } catch (error) {
      // Rollback
      set(backup);
      toast.error('Xoa that bai. Vui long thu lai.');
    }
  },

  // --- Check nhanh ---
  isInWishlist: (productId: string) => {
    return get().itemIds.has(productId);
  },
}));
```

**Giai thich:**

| Concept | Chi tiet |
|---------|---------|
| `itemIds: Set<string>` | Check `isInWishlist` voi O(1) thay vi O(n) |
| `isToggling: Set<string>` | Chong double-click, hien thi loading tren tung item |
| Optimistic update | Cap nhat UI truoc, rollback neu API fail |
| `removeAll` | Xoa tat ca voi backup de rollback |

---

## 2. WishlistPage - Trang danh sach yeu thich

> File: `apps/fe/src/app/(customer)/wishlist/page.tsx`
> Trang protected (phai dang nhap). Hien thi grid cac san pham yeu thich.
> Ho tro xoa tung item, xoa tat ca, them vao gio hang, empty state.

### 2.1 Page Component

```tsx
// apps/fe/src/app/(customer)/wishlist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { useWishlistStore, WishlistItem } from '@/stores/wishlist-store';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AddToCartFromWishlistModal } from '@/components/wishlist/AddToCartFromWishlistModal';
import { WishlistSkeleton } from '@/components/wishlist/WishlistSkeleton';
import { formatCurrency } from '@/lib/utils';
import { PageTransition } from '@/components/ui/PageTransition';

// ======================== METADATA ========================
// Metadata phai export tu file rieng vi page la 'use client'
// Xem: apps/fe/src/app/(customer)/wishlist/layout.tsx

// ======================== ANIMATION VARIANTS ========================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

// ======================== MAIN PAGE ========================

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}

function WishlistContent() {
  const router = useRouter();
  const {
    items,
    isLoading,
    fetchWishlist,
    removeFromWishlist,
    removeAll,
  } = useWishlistStore();

  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);

  // Fetch wishlist khi mount
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // --- Handler: Them vao gio ---
  const handleAddToCart = (item: WishlistItem) => {
    if (item.product.hasVariants) {
      // Mo modal chon variant
      setSelectedItem(item);
      setShowCartModal(true);
    } else {
      // Them truc tiep (san pham khong co variant)
      useCartStore.getState().addItem({
        productId: item.product.id,
        quantity: 1,
      });
    }
  };

  // --- Handler: Xoa tat ca ---
  const handleDeleteAll = async () => {
    await removeAll();
    setShowDeleteAllConfirm(false);
  };

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-64 bg-surface-300 rounded-md animate-pulse" />
          </div>
          <WishlistSkeleton />
        </div>
      </PageTransition>
    );
  }

  // === EMPTY STATE ===
  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center max-w-md mx-auto"
          >
            {/* Heart icon lon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6"
            >
              <Heart className="w-12 h-12 text-primary-300" strokeWidth={1.5} />
            </motion.div>

            <h1 className="text-h3 text-foreground mb-3">
              Chua co san pham yeu thich
            </h1>
            <p className="text-body text-muted-foreground mb-8">
              Hay kham pha cac san pham noi that dep va them vao danh sach yeu thich cua ban.
            </p>

            <Button
              size="lg"
              onClick={() => router.push('/products')}
              className="gap-2"
            >
              Kham pha san pham
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // === MAIN CONTENT ===
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-h2 text-foreground"
          >
            Danh sach yeu thich{' '}
            <span className="text-muted-foreground text-h4">
              ({items.length})
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="text-danger-600 border-danger-200 hover:bg-danger-50 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Xoa tat ca
            </Button>
          </motion.div>
        </div>

        {/* --- Grid san pham --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                onAddToCart={() => handleAddToCart(item)}
                onRemove={() => removeFromWishlist(item.productId)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* --- Confirm dialog xoa tat ca --- */}
        <ConfirmDialog
          open={showDeleteAllConfirm}
          onOpenChange={setShowDeleteAllConfirm}
          title="Xoa tat ca san pham yeu thich?"
          description={`Ban co chac muon xoa tat ca ${items.length} san pham khoi danh sach yeu thich? Hanh dong nay khong the hoan tac.`}
          confirmText="Xoa tat ca"
          confirmVariant="destructive"
          onConfirm={handleDeleteAll}
          icon={<AlertTriangle className="w-6 h-6 text-danger-500" />}
        />

        {/* --- Modal them vao gio (co variant) --- */}
        {selectedItem && (
          <AddToCartFromWishlistModal
            open={showCartModal}
            onOpenChange={setShowCartModal}
            item={selectedItem}
            onAddedToCart={() => {
              setShowCartModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}

// ======================== WISHLIST CARD ========================

interface WishlistCardProps {
  item: WishlistItem;
  onAddToCart: () => void;
  onRemove: () => void;
}

function WishlistCard({ item, onAddToCart, onRemove }: WishlistCardProps) {
  const { product } = item;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const isLowStock = product.stockStatus === 'low_stock';

  return (
    <motion.div
      layout
      variants={itemVariants}
      exit="exit"
      className="group relative bg-white rounded-lg border border-border overflow-hidden
                 shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      {/* --- Anh san pham --- */}
      <Link href={`/products/${product.slug}`} className="block relative">
        <div className="aspect-square relative overflow-hidden bg-surface-100">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105
                       ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Badge trang thai kho */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge
                variant="destructive"
                className="text-body-sm px-4 py-2 bg-danger-600/90 backdrop-blur-sm"
              >
                Het hang
              </Badge>
            </div>
          )}

          {isLowStock && !isOutOfStock && (
            <Badge
              variant="warning"
              className="absolute top-3 left-3 text-caption"
            >
              Con {product.stockQuantity} san pham
            </Badge>
          )}

          {/* Giam gia badge */}
          {product.originalPrice && product.originalPrice > product.price && (
            <Badge
              variant="destructive"
              className="absolute top-3 right-3 text-caption"
            >
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </Badge>
          )}
        </div>
      </Link>

      {/* --- Nut xoa (goc tren phai, hien khi hover) --- */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                   shadow-sm flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   hover:bg-danger-50"
        aria-label="Xoa khoi yeu thich"
      >
        <X className="w-4 h-4 text-danger-500" />
      </motion.button>

      {/* --- Thong tin san pham --- */}
      <div className="p-4">
        {/* Danh muc */}
        <p className="text-caption text-muted-foreground mb-1">
          {product.category.name}
        </p>

        {/* Ten san pham */}
        <Link
          href={`/products/${product.slug}`}
          className="block text-body font-medium text-foreground hover:text-primary-500
                     transition-colors line-clamp-2 mb-3 min-h-[3rem]"
        >
          {product.name}
        </Link>

        {/* Gia */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-h4 text-primary-600 font-bold">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-body-sm text-muted-foreground line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Cac nut hanh dong */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-2"
            disabled={isOutOfStock}
            onClick={onAddToCart}
          >
            <ShoppingCart className="w-4 h-4" />
            {isOutOfStock ? 'Het hang' : 'Them vao gio'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onRemove}
            className="text-danger-500 border-danger-200 hover:bg-danger-50
                       sm:hidden"   
            aria-label="Xoa"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
```

### 2.2 Layout (Metadata)

```tsx
// apps/fe/src/app/(customer)/wishlist/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh sach yeu thich | Noi That Viet',
  description: 'Xem va quan ly danh sach san pham yeu thich cua ban.',
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

---

## 3. WishlistButton - Nut toggle yeu thich

> File: `apps/fe/src/components/wishlist/WishlistButton.tsx`
> Dung tren ProductCard va ProductDetailPage.
> Toggle yeu thich voi optimistic update. Redirect login neu chua dang nhap.
> Animation scale khi click, tooltip huong dan.

```tsx
// apps/fe/src/components/wishlist/WishlistButton.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

import { useWishlistStore } from '@/stores/wishlist-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

// ======================== TYPES ========================

interface WishlistButtonProps {
  productId: string;
  /** Kich thuoc: 'sm' dung tren ProductCard, 'md' tren ProductDetailPage */
  size?: 'sm' | 'md';
  /** Hien thi dang icon trong (overlay tren anh) hay binh thuong */
  variant?: 'floating' | 'default';
  className?: string;
}

// ======================== SIZE MAP ========================

const sizeMap = {
  sm: {
    button: 'w-9 h-9',
    icon: 'w-4 h-4',
    spinner: 'w-3 h-3',
  },
  md: {
    button: 'w-11 h-11',
    icon: 'w-5 h-5',
    spinner: 'w-4 h-4',
  },
};

// ======================== COMPONENT ========================

export function WishlistButton({
  productId,
  size = 'sm',
  variant = 'floating',
  className,
}: WishlistButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated } = useAuthStore();
  const { isInWishlist, toggleWishlist, isToggling } = useWishlistStore();

  const isActive = isInWishlist(productId);
  const isLoading = isToggling.has(productId);
  const sizes = sizeMap[size];

  // --- Handler ---
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();      // Ngan Link cha navigate
    e.stopPropagation();     // Ngan event bubble len parent

    // Kiem tra dang nhap
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    await toggleWishlist(productId);
  };

  // --- Render ---
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            'rounded-full flex items-center justify-center transition-colors duration-200',
            // Variant styles
            variant === 'floating'
              ? 'bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md'
              : 'border border-border hover:border-primary-300',
            // Active state
            isActive && !isLoading
              ? 'text-danger-500 hover:text-danger-600'
              : 'text-muted-foreground hover:text-foreground',
            // Size
            sizes.button,
            // Disabled
            isLoading && 'cursor-not-allowed opacity-70',
            className,
          )}
          aria-label={isActive ? 'Xoa khoi yeu thich' : 'Them vao yeu thich'}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              /* === Loading spinner === */
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { repeat: Infinity, duration: 0.8, ease: 'linear' } }}
              >
                <Loader2 className={cn(sizes.spinner, 'text-primary-400')} />
              </motion.div>
            ) : isActive ? (
              /* === Heart filled (da yeu thich) === */
              <motion.div
                key="active"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Heart
                  className={cn(sizes.icon, 'fill-danger-500 text-danger-500')}
                />
              </motion.div>
            ) : (
              /* === Heart outline (chua yeu thich) === */
              <motion.div
                key="inactive"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Heart className={cn(sizes.icon)} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TooltipTrigger>

      <TooltipContent side="bottom" className="text-caption">
        {isActive ? 'Xoa khoi yeu thich' : 'Them vao yeu thich'}
      </TooltipContent>
    </Tooltip>
  );
}
```

**Su dung WishlistButton tren ProductCard:**

```tsx
// Vi du: apps/fe/src/components/product/ProductCard.tsx (phan lien quan)

import { WishlistButton } from '@/components/wishlist/WishlistButton';

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative ...">
      {/* Anh san pham */}
      <div className="relative aspect-square overflow-hidden">
        <Image src={product.thumbnail} alt={product.name} fill />

        {/* WishlistButton: goc tren phai, overlay tren anh */}
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton
            productId={product.id}
            size="sm"
            variant="floating"
          />
        </div>
      </div>

      {/* Thong tin san pham */}
      <div className="p-4">
        {/* ... */}
      </div>
    </div>
  );
}
```

**Su dung tren ProductDetailPage:**

```tsx
// Vi du: apps/fe/src/app/(customer)/products/[slug]/page.tsx (phan lien quan)

<div className="flex items-center gap-4">
  <Button size="lg" onClick={handleAddToCart}>
    Them vao gio hang
  </Button>

  {/* WishlistButton: variant default, size md */}
  <WishlistButton
    productId={product.id}
    size="md"
    variant="default"
  />
</div>
```

---

## 4. AddToCartFromWishlist - Modal them vao gio

> File: `apps/fe/src/components/wishlist/AddToCartFromWishlistModal.tsx`
> Khi click "Them vao gio" tren WishlistCard, neu san pham co variants:
> Mo modal chon mau sac + kich thuoc, hien thi gia theo variant, nhap so luong.
> Sau khi them: option xoa khoi wishlist.

```tsx
// apps/fe/src/components/wishlist/AddToCartFromWishlistModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Minus, Plus, Loader2, X } from 'lucide-react';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore, WishlistItem } from '@/stores/wishlist-store';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, cn } from '@/lib/utils';

// ======================== TYPES ========================

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stockQuantity: number;
  attributes: {
    color?: {
      name: string;
      hex: string;       // Ma mau hex de hien thi swatch
    };
    dimension?: {
      label: string;     // VD: "180x200cm", "Lon", "Nho"
    };
  };
}

interface ProductVariantsResponse {
  variants: ProductVariant[];
  colors: Array<{ name: string; hex: string }>;
  dimensions: Array<{ label: string }>;
}

interface AddToCartFromWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishlistItem;
  onAddedToCart: () => void;
}

// ======================== COMPONENT ========================

export function AddToCartFromWishlistModal({
  open,
  onOpenChange,
  item,
  onAddedToCart,
}: AddToCartFromWishlistModalProps) {
  const { product } = item;
  const { addItem: addToCart } = useCartStore();
  const { removeFromWishlist } = useWishlistStore();

  // --- State ---
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([]);
  const [dimensions, setDimensions] = useState<Array<{ label: string }>>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- Fetch variants khi modal mo ---
  useEffect(() => {
    if (!open) return;

    const fetchVariants = async () => {
      setIsLoadingVariants(true);
      try {
        const res = await apiClient.get<{ data: ProductVariantsResponse }>(
          `/products/${product.id}/variants`
        );
        const { variants, colors, dimensions } = res.data.data;
        setVariants(variants);
        setColors(colors);
        setDimensions(dimensions);

        // Auto-select neu chi co 1 option
        if (colors.length === 1) setSelectedColor(colors[0].name);
        if (dimensions.length === 1) setSelectedDimension(dimensions[0].label);
      } catch (error) {
        console.error('Fetch variants failed:', error);
      } finally {
        setIsLoadingVariants(false);
      }
    };

    fetchVariants();

    // Reset state khi dong
    return () => {
      setSelectedColor(null);
      setSelectedDimension(null);
      setQuantity(1);
      setShowSuccess(false);
    };
  }, [open, product.id]);

  // --- Tim variant dua tren selection ---
  const selectedVariant = variants.find(
    (v) =>
      v.attributes.color?.name === selectedColor &&
      v.attributes.dimension?.label === selectedDimension
  );

  // Gia hien thi: tu variant hoac gia goc
  const displayPrice = selectedVariant?.price ?? product.price;
  const maxQuantity = selectedVariant?.stockQuantity ?? 10;
  const isVariantOutOfStock = selectedVariant && selectedVariant.stockQuantity === 0;

  // Can chon du variant moi cho them vao gio
  const canAddToCart =
    !isAdding &&
    !isVariantOutOfStock &&
    (colors.length === 0 || selectedColor !== null) &&
    (dimensions.length === 0 || selectedDimension !== null);

  // --- Handler: Them vao gio ---
  const handleAddToCart = async () => {
    if (!canAddToCart) return;
    setIsAdding(true);

    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
      });

      setShowSuccess(true);
    } catch (error) {
      console.error('Add to cart failed:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // --- Handler: Xoa khoi wishlist sau khi them vao gio ---
  const handleRemoveFromWishlist = async () => {
    await removeFromWishlist(product.id);
    onAddedToCart();
  };

  // ======================== RENDER ========================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-h4">Chon phien ban san pham</DialogTitle>
        </DialogHeader>

        {/* --- Thong tin san pham --- */}
        <div className="flex gap-4 p-4 bg-surface-100 rounded-lg">
          <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0">
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-body font-medium text-foreground line-clamp-2">
              {product.name}
            </h3>
            <p className="text-h4 text-primary-600 font-bold mt-1">
              {formatCurrency(displayPrice)}
            </p>
          </div>
        </div>

        {/* --- Loading variants --- */}
        {isLoadingVariants ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* === Chon mau sac === */}
            {colors.length > 0 && (
              <div>
                <label className="text-body-sm font-medium text-foreground mb-3 block">
                  Mau sac:{' '}
                  <span className="text-muted-foreground font-normal">
                    {selectedColor ?? 'Chua chon'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <motion.button
                      key={color.name}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all duration-200 relative',
                        selectedColor === color.name
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-border hover:border-primary-300'
                      )}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Mau ${color.name}`}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check
                            className={cn(
                              'w-5 h-5',
                              // Chon mau check icon dua tren do sang cua mau nen
                              isLightColor(color.hex)
                                ? 'text-foreground'
                                : 'text-white'
                            )}
                            strokeWidth={3}
                          />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* === Chon kich thuoc === */}
            {dimensions.length > 0 && (
              <div>
                <label className="text-body-sm font-medium text-foreground mb-3 block">
                  Kich thuoc:{' '}
                  <span className="text-muted-foreground font-normal">
                    {selectedDimension ?? 'Chua chon'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {dimensions.map((dim) => {
                    // Tim variant voi mau da chon + dimension nay de check con hang khong
                    const matchingVariant = variants.find(
                      (v) =>
                        v.attributes.color?.name === selectedColor &&
                        v.attributes.dimension?.label === dim.label
                    );
                    const isUnavailable =
                      matchingVariant && matchingVariant.stockQuantity === 0;

                    return (
                      <motion.button
                        key={dim.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => !isUnavailable && setSelectedDimension(dim.label)}
                        disabled={!!isUnavailable}
                        className={cn(
                          'px-4 py-2 rounded-md border text-body-sm font-medium transition-all duration-200',
                          selectedDimension === dim.label
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border text-foreground hover:border-primary-300',
                          isUnavailable &&
                            'opacity-40 cursor-not-allowed line-through text-muted-foreground'
                        )}
                      >
                        {dim.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === So luong === */}
            <div>
              <label className="text-body-sm font-medium text-foreground mb-3 block">
                So luong
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= maxQuantity) {
                      setQuantity(val);
                    }
                  }}
                  min={1}
                  max={maxQuantity}
                  className="w-16 text-center border border-border rounded-md py-2 text-body
                             font-medium focus:outline-none focus:ring-2 focus:ring-primary-300"
                />

                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="w-4 h-4" />
                </Button>

                {selectedVariant && (
                  <span className="text-caption text-muted-foreground">
                    Con {selectedVariant.stockQuantity} san pham
                  </span>
                )}
              </div>
            </div>

            {/* === Het hang thong bao === */}
            {isVariantOutOfStock && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-danger-50 rounded-md text-danger-700 text-body-sm"
              >
                Phien ban nay hien da het hang. Vui long chon phien ban khac.
              </motion.div>
            )}
          </div>
        )}

        {/* --- Footer: Nut them vao gio --- */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            /* === Thanh cong === */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3 pt-4 border-t border-border"
            >
              <div className="flex items-center gap-2 text-success-600 text-body-sm font-medium">
                <Check className="w-5 h-5" />
                Da them vao gio hang thanh cong!
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleRemoveFromWishlist}
                >
                  Xoa khoi yeu thich
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={onAddedToCart}
                >
                  Dong
                </Button>
              </div>
            </motion.div>
          ) : (
            /* === Nut them === */
            <motion.div
              key="add"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-4 border-t border-border"
            >
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
              >
                {isAdding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                Them vao gio hang - {formatCurrency(displayPrice * quantity)}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ======================== HELPER ========================

/** Kiem tra mau hex co sang hay khong (de chon mau icon check) */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Cong thuc luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
```

---

## 5. Loading Skeleton

> File: `apps/fe/src/components/wishlist/WishlistSkeleton.tsx`
> Skeleton loading grid khi dang fetch wishlist. Cung responsive layout voi grid chinh.

```tsx
// apps/fe/src/components/wishlist/WishlistSkeleton.tsx
'use client';

import { cn } from '@/lib/utils';

interface WishlistSkeletonProps {
  count?: number;
}

export function WishlistSkeleton({ count = 8 }: WishlistSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-border overflow-hidden shadow-card"
        >
          {/* Anh skeleton */}
          <div className="aspect-square bg-surface-200 relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent
                          animate-[shimmer_1.5s_infinite]"
            />
          </div>

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Category */}
            <div className="h-3 w-16 bg-surface-200 rounded animate-pulse" />
            {/* Name */}
            <div className="space-y-1.5">
              <div className="h-4 w-full bg-surface-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-surface-200 rounded animate-pulse" />
            </div>
            {/* Price */}
            <div className="h-6 w-28 bg-surface-200 rounded animate-pulse" />
            {/* Button */}
            <div className="h-9 w-full bg-surface-200 rounded-md animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Responsive Design

### Bang tom tat breakpoints

| Breakpoint | Grid cols | Ghi chu |
|-----------|-----------|---------|
| Mobile `< 640px` | 1 col | Nut xoa hien thi rieng (vi khong co hover) |
| Tablet `sm (640px)` | 2 cols | Compact card |
| Desktop nho `lg (1024px)` | 3 cols | Standard |
| Desktop `xl (1280px)` | 4 cols | Full grid |

### Responsive behaviors

```
// Grid chinh
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

// Nut xoa tren card:
// - Desktop: hien khi hover (opacity-0 group-hover:opacity-100)
// - Mobile: hien nut xoa rieng trong phan actions (sm:hidden tren nut trong actions)

// Header:
// - Desktop: flex-row, align center, space-between
// - Mobile: flex-col, stack
className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
```

### Mobile-specific notes

- Tren mobile (khong co hover), nut X tren card luon an. Thay vao do, nut Trash icon hien thi ke ben "Them vao gio" button.
- Tren desktop (co hover), nut X hien khi hover va nut Trash trong actions bi an (`sm:hidden`).

---

## Tong ket cau truc file

```
apps/fe/src/
├── app/(customer)/wishlist/
│   ├── layout.tsx                           # Metadata
│   └── page.tsx                             # WishlistPage (AuthGuard wrapped)
│
├── components/wishlist/
│   ├── WishlistButton.tsx                   # Toggle wishlist (dung tren ProductCard, ProductDetail)
│   ├── AddToCartFromWishlistModal.tsx        # Modal chon variant + them vao gio
│   └── WishlistSkeleton.tsx                 # Loading skeleton grid
│
└── stores/
    └── wishlist-store.ts                    # Zustand store voi optimistic update
```
