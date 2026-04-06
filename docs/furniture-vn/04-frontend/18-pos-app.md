# POS APP - BAN HANG TAI QUAY

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/pos/`, `apps/fe/src/components/pos/`
> Bao gom: POSLayout, POSMainPage, CustomerLookup, VariantSelectorModal, PaymentModal, Receipt, ShiftManagement, POSOrders, POSReturn
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Zustand + react-hook-form + zod
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [POSLayout](#1-poslayout)
2. [POSMainPage](#2-posmainpage)
3. [CustomerLookup](#3-customerlookup)
4. [VariantSelectorModal](#4-variantselectormodal)
5. [PaymentModal](#5-paymentmodal)
6. [Receipt](#6-receipt)
7. [ShiftManagementPage](#7-shiftmanagementpage)
8. [POSOrdersPage](#8-posorderspage)
9. [POSReturnPage](#9-posreturnpage)

---

## 1. POSLayout

> File: `apps/fe/src/app/pos/layout.tsx`
> Auth guard cho staff/manager/admin. Yeu cau co ca lam viec dang hoat dong.
> Layout toi gian: top bar (ten cua hang, nhan vien, ca lam viec, dong ho) + noi dung chinh.

### 1.1 Cau truc trang

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar (h-14, bg-slate-900, text-white)                   │
│  [StoreName]  [StaffName - Role]  [Shift: #12]  [14:35:22] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Main Content (children)                  │
│                    height: calc(100vh - 56px)               │
│                    overflow: hidden                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Code

```tsx
// ============================================================
// apps/fe/src/app/pos/layout.tsx
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, User, Clock, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/use-auth-store';
import { usePOSStore } from '@/stores/use-pos-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// ---- Allowed roles cho POS ----
const POS_ROLES = ['staff', 'manager', 'admin'];

interface POSLayoutProps {
  children: React.ReactNode;
}

export default function POSLayout({ children }: POSLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activeShift } = usePOSStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // ----- Auth guard -----
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/pos');
      return;
    }

    if (!user || !POS_ROLES.includes(user.role)) {
      router.replace('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, router]);

  // ----- Clock update moi giay -----
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ----- Redirect neu chua co shift (tru trang shift management) -----
  useEffect(() => {
    if (
      !activeShift &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/pos/shifts')
    ) {
      router.replace('/pos/shifts');
    }
  }, [activeShift, router]);

  // ----- Format time -----
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ----- Handle logout -----
  const handleLogout = () => {
    if (activeShift) {
      // Canh bao neu con ca dang mo
      const confirmed = window.confirm(
        'Ban dang co ca lam viec. Vui long dong ca truoc khi dang xuat.'
      );
      if (!confirmed) return;
    }
    logout();
    router.replace('/login');
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ===== TOP BAR ===== */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
        {/* Left: Store info */}
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-amber-400" />
          <span className="font-bold text-lg hidden sm:inline">
            Noi That Viet Nam
          </span>
          <span className="font-bold text-lg sm:hidden">NTVN</span>
        </div>

        {/* Center: Shift info */}
        <div className="flex items-center gap-4">
          {activeShift ? (
            <Badge
              variant="outline"
              className="border-green-400 text-green-400"
            >
              Ca #{activeShift.shiftNumber} - Dang hoat dong
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-yellow-400 text-yellow-400"
            >
              Chua mo ca
            </Badge>
          )}
        </div>

        {/* Right: Staff info + Clock + Menu */}
        <div className="flex items-center gap-4">
          {/* Clock */}
          <div className="hidden md:flex flex-col items-end text-xs">
            <span className="font-mono text-base tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-gray-400">{formatDate(currentTime)}</span>
          </div>

          {/* Staff dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-slate-800 gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.fullName}</span>
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/pos/shifts')}>
                <Clock className="h-4 w-4 mr-2" />
                Quan ly ca
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/pos/orders')}>
                <Settings className="h-4 w-4 mr-2" />
                Don hang hom nay
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Dang xuat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
```

### 1.3 POS Store (Zustand)

```typescript
// ============================================================
// apps/fe/src/stores/use-pos-store.ts
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ---- Types ----
export interface POSCartItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string; // e.g. "Go soi - 180x200cm"
  sku: string;
  price: number;
  quantity: number;
  maxStock: number;
  image?: string;
}

export interface POSCustomer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
}

export interface POSShift {
  id: string;
  shiftNumber: number;
  staffId: string;
  staffName: string;
  openedAt: string;
  openingCash: number;
}

export interface POSDiscount {
  type: 'amount' | 'percent';
  value: number;
  couponCode?: string;
}

// ---- Store ----
interface POSState {
  // Cart
  cartItems: POSCartItem[];
  customer: POSCustomer | null;
  discount: POSDiscount | null;

  // Shift
  activeShift: POSShift | null;

  // Cart actions
  addToCart: (item: POSCartItem) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateCartQuantity: (
    productId: string,
    variantId: string,
    quantity: number
  ) => void;
  clearCart: () => void;

  // Customer actions
  setCustomer: (customer: POSCustomer | null) => void;

  // Discount actions
  setDiscount: (discount: POSDiscount | null) => void;

  // Shift actions
  setActiveShift: (shift: POSShift | null) => void;

  // Computed
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      customer: null,
      discount: null,
      activeShift: null,

      addToCart: (newItem) =>
        set((state) => {
          const existingIndex = state.cartItems.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.variantId === newItem.variantId
          );

          if (existingIndex > -1) {
            const updated = [...state.cartItems];
            const newQty =
              updated[existingIndex].quantity + newItem.quantity;
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: Math.min(newQty, updated[existingIndex].maxStock),
            };
            return { cartItems: updated };
          }

          return { cartItems: [...state.cartItems, newItem] };
        }),

      removeFromCart: (productId, variantId) =>
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.variantId === variantId
              )
          ),
        })),

      updateCartQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity: Math.min(quantity, item.maxStock) }
              : item
          ),
        })),

      clearCart: () => set({ cartItems: [], customer: null, discount: null }),

      setCustomer: (customer) => set({ customer }),
      setDiscount: (discount) => set({ discount }),
      setActiveShift: (shift) => set({ activeShift: shift }),

      getSubtotal: () =>
        get().cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      getDiscountAmount: () => {
        const { discount } = get();
        if (!discount) return 0;
        const subtotal = get().getSubtotal();
        if (discount.type === 'amount') return discount.value;
        return Math.round((subtotal * discount.value) / 100);
      },

      getTotal: () => get().getSubtotal() - get().getDiscountAmount(),
      getItemCount: () =>
        get().cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'pos-store',
      storage: createJSONStorage(() => sessionStorage), // session only
      partialize: (state) => ({
        cartItems: state.cartItems,
        customer: state.customer,
        discount: state.discount,
        activeShift: state.activeShift,
      }),
    }
  )
);
```

---

## 2. POSMainPage

> File: `apps/fe/src/app/pos/page.tsx`
> Trang chinh POS: split layout trai 60% (san pham) + phai 40% (gio hang).
> Tim kiem, loc danh muc, chon san pham, quan ly gio hang, thanh toan.

### 2.1 Cau truc trang

```
┌──────────────────────────────────┬────────────────────────┐
│  LEFT PANEL (60%)                │  RIGHT PANEL (40%)     │
│                                  │                        │
│  ┌────────────────────────────┐  │  ┌──────────────────┐  │
│  │ Search [___________] [🔍]  │  │  │ Ca #12 | 14:35   │  │
│  └────────────────────────────┘  │  ├──────────────────┤  │
│                                  │  │ KH: Khach le     │  │
│  [Tat ca] [Sofa] [Ban] [Tu]..→  │  │ [Tim KH: ____]   │  │
│                                  │  ├──────────────────┤  │
│  ┌──────┐ ┌──────┐ ┌──────┐     │  │ Cart Items:      │  │
│  │ IMG  │ │ IMG  │ │ IMG  │     │  │ Sofa Boras x1    │  │
│  │ Name │ │ Name │ │ Name │     │  │  5,990,000  [-+] │  │
│  │ Price│ │ Price│ │ Price│     │  │ Ban Mino x2      │  │
│  │ Stk:5│ │ Stk:3│ │ Stk:0│     │  │  3,490,000  [-+] │  │
│  └──────┘ └──────┘ └──────┘     │  ├──────────────────┤  │
│                                  │  │ Giam gia: [____] │  │
│  ┌──────┐ ┌──────┐ ┌──────┐     │  ├──────────────────┤  │
│  │ ...  │ │ ...  │ │ ...  │     │  │ Tam tinh: 12.97M │  │
│  └──────┘ └──────┘ └──────┘     │  │ Giam:    -500K   │  │
│                                  │  │ TONG:   12.47M   │  │
│  [1] [2] [3] ... [10]           │  ├──────────────────┤  │
│                                  │  │[TIEN MAT][CK]    │  │
│                                  │  └──────────────────┘  │
└──────────────────────────────────┴────────────────────────┘
```

### 2.2 Code

```tsx
// ============================================================
// apps/fe/src/app/pos/page.tsx
// ============================================================
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Tag,
  Package,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePOSStore, POSCartItem } from '@/stores/use-pos-store';
import { productService } from '@/services/product-service';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';
import { CustomerLookup } from '@/components/pos/customer-lookup';
import { VariantSelectorModal } from '@/components/pos/variant-selector-modal';
import { PaymentModal } from '@/components/pos/payment-modal';

// ---- Types ----
interface ProductGridItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: string[];
  category: { id: string; name: string };
  variants: Array<{
    id: string;
    sku: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
  totalStock: number;
}

export default function POSMainPage() {
  // ----- State -----
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [variantModalProduct, setVariantModalProduct] =
    useState<ProductGridItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>(
    'cash'
  );
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>(
    'amount'
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // ----- POS Store -----
  const {
    cartItems,
    customer,
    discount,
    activeShift,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    setDiscount,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    getItemCount,
  } = usePOSStore();

  // ----- Fetch categories -----
  const { data: categories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => productService.getCategories(),
  });

  // ----- Fetch products -----
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: [
      'pos-products',
      debouncedSearch,
      selectedCategoryId,
      currentPage,
    ],
    queryFn: () =>
      productService.getProducts({
        search: debouncedSearch || undefined,
        categoryId: selectedCategoryId || undefined,
        page: currentPage,
        limit: 12,
        inStock: true, // Chi hien san pham con hang
      }),
  });

  // ----- Keyboard shortcut: focus search -----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ----- Handle add product to cart -----
  const handleProductClick = useCallback(
    (product: ProductGridItem) => {
      if (product.totalStock === 0) return;

      // Neu chi co 1 variant -> them thang vao cart
      if (product.variants.length === 1) {
        const variant = product.variants[0];
        addToCart({
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantLabel: Object.values(variant.attributes).join(' - '),
          sku: variant.sku,
          price: variant.price,
          quantity: 1,
          maxStock: variant.stock,
          image: product.images[0],
        });
      } else {
        // Nhieu variant -> mo modal chon
        setVariantModalProduct(product);
      }
    },
    [addToCart]
  );

  // ----- Handle discount -----
  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (isNaN(value) || value <= 0) return;

    if (discountType === 'percent' && value > 100) return;

    setDiscount({ type: discountType, value });
  };

  const handleRemoveDiscount = () => {
    setDiscount(null);
    setDiscountInput('');
  };

  // ----- Open payment -----
  const handlePayment = (method: 'cash' | 'bank_transfer') => {
    if (cartItems.length === 0) return;
    setPaymentMethod(method);
    setShowPaymentModal(true);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* ===== LEFT PANEL - PRODUCT SELECTION (60%) ===== */}
      <div className="lg:w-[60%] flex flex-col border-r border-gray-200 bg-white">
        {/* Search bar */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Tim san pham (ten, SKU, barcode)... [F2]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-11 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category quick filter */}
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Button
              size="sm"
              variant={selectedCategoryId === null ? 'default' : 'outline'}
              onClick={() => {
                setSelectedCategoryId(null);
                setCurrentPage(1);
              }}
              className="shrink-0"
            >
              Tat ca
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={
                  selectedCategoryId === cat.id ? 'default' : 'outline'
                }
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setCurrentPage(1);
                }}
                className="shrink-0"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-200 rounded-lg h-48"
                  />
                ))}
              </div>
            ) : productsData?.items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Khong tim thay san pham nao</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {productsData?.items.map((product: ProductGridItem) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    disabled={product.totalStock === 0}
                    className={`
                      text-left rounded-lg border transition-all
                      ${
                        product.totalStock === 0
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : 'hover:shadow-md hover:border-blue-300 active:scale-[0.98] bg-white cursor-pointer'
                      }
                    `}
                  >
                    {/* Product image */}
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}

                      {/* Stock badge */}
                      <Badge
                        variant={
                          product.totalStock > 0 ? 'secondary' : 'destructive'
                        }
                        className="absolute top-2 right-2 text-xs"
                      >
                        {product.totalStock > 0
                          ? `Kho: ${product.totalStock}`
                          : 'Het hang'}
                      </Badge>
                    </div>

                    {/* Product info */}
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-2 leading-tight">
                        {product.name}
                      </p>
                      <p className="text-base font-bold text-blue-600 mt-1">
                        {formatCurrency(product.basePrice)}
                      </p>
                      {product.variants.length > 1 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {product.variants.length} phien ban
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {productsData && productsData.totalPages > 1 && (
            <div className="flex justify-center gap-1 p-3 border-t">
              {Array.from({ length: productsData.totalPages }).map((_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(i + 1)}
                  className="w-9 h-9"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ===== RIGHT PANEL - POS CART (40%) ===== */}
      <div className="lg:w-[40%] flex flex-col bg-white">
        {/* Shift info bar */}
        <div className="px-4 py-2 bg-blue-50 border-b flex items-center justify-between text-sm">
          <span className="text-blue-700 font-medium">
            Ca #{activeShift?.shiftNumber} | {activeShift?.staffName}
          </span>
          <Badge variant="outline" className="text-xs">
            {getItemCount()} san pham
          </Badge>
        </div>

        {/* Customer section */}
        <div className="p-3 border-b">
          <CustomerLookup />
        </div>

        {/* Cart items */}
        <ScrollArea className="flex-1 min-h-0">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">Gio hang trong</p>
              <p className="text-xs mt-1">Chon san pham de bat dau</p>
            </div>
          ) : (
            <div className="divide-y">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="p-3 flex gap-3 hover:bg-gray-50"
                >
                  {/* Image */}
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.variantLabel}</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          item.quantity > 1
                            ? updateCartQuantity(
                                item.productId,
                                item.variantId,
                                item.quantity - 1
                              )
                            : removeFromCart(item.productId, item.variantId)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={item.quantity >= item.maxStock}
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() =>
                          removeFromCart(item.productId, item.variantId)
                        }
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Discount section */}
        <div className="p-3 border-t">
          {discount ? (
            <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Giam{' '}
                  {discount.type === 'percent'
                    ? `${discount.value}%`
                    : formatCurrency(discount.value)}
                </span>
                {discount.couponCode && (
                  <Badge variant="secondary" className="text-xs">
                    {discount.couponCode}
                  </Badge>
                )}
              </div>
              <button
                onClick={handleRemoveDiscount}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as 'amount' | 'percent')
                }
                className="border rounded-md px-2 py-1.5 text-sm bg-white w-20"
              >
                <option value="amount">VND</option>
                <option value="percent">%</option>
              </select>
              <Input
                placeholder="Giam gia..."
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="h-9"
                type="number"
              />
              <Button size="sm" onClick={handleApplyDiscount} className="h-9">
                Ap dung
              </Button>
            </div>
          )}
        </div>

        {/* Price summary */}
        <div className="p-4 border-t bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tam tinh</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          {discount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giam gia</span>
              <span>-{formatCurrency(getDiscountAmount())}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-baseline">
            <span className="text-base font-semibold">TONG CONG</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(getTotal())}
            </span>
          </div>
        </div>

        {/* Payment buttons */}
        <div className="p-3 border-t grid grid-cols-2 gap-2">
          <Button
            size="lg"
            className="h-14 text-base bg-green-600 hover:bg-green-700"
            disabled={cartItems.length === 0}
            onClick={() => handlePayment('cash')}
          >
            <Banknote className="h-5 w-5 mr-2" />
            Tien mat
          </Button>
          <Button
            size="lg"
            className="h-14 text-base bg-blue-600 hover:bg-blue-700"
            disabled={cartItems.length === 0}
            onClick={() => handlePayment('bank_transfer')}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Chuyen khoan
          </Button>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {variantModalProduct && (
        <VariantSelectorModal
          product={variantModalProduct}
          onClose={() => setVariantModalProduct(null)}
          onAdd={(item: POSCartItem) => {
            addToCart(item);
            setVariantModalProduct(null);
          }}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          method={paymentMethod}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
```

---

## 3. CustomerLookup

> File: `apps/fe/src/components/pos/customer-lookup.tsx`
> Tim khach hang theo so dien thoai. Hien thi thong tin khach hang hoac tao moi.
> Mac dinh la "Khach le" (khach vang lai).

### 3.1 Code

```tsx
// ============================================================
// apps/fe/src/components/pos/customer-lookup.tsx
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import { Search, User, Phone, Star, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePOSStore } from '@/stores/use-pos-store';
import { customerService } from '@/services/customer-service';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function CustomerLookup() {
  const { customer, setCustomer } = usePOSStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [phoneInput, setPhoneInput] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedPhone = useDebounce(phoneInput, 500);

  // ----- Tim khach hang theo phone -----
  const { data: searchResult, isLoading: searchLoading } = useQuery({
    queryKey: ['pos-customer-search', debouncedPhone],
    queryFn: () => customerService.findByPhone(debouncedPhone),
    enabled: debouncedPhone.length >= 9 && isSearching,
  });

  // ----- Tao khach hang moi -----
  const createMutation = useMutation({
    mutationFn: (data: { phone: string; fullName?: string }) =>
      customerService.quickCreate(data),
    onSuccess: (newCustomer) => {
      setCustomer({
        id: newCustomer.id,
        fullName: newCustomer.fullName || 'Khach hang moi',
        phone: newCustomer.phone,
        loyaltyPoints: 0,
      });
      setShowCreateDialog(false);
      setIsSearching(false);
      setPhoneInput('');
      toast({
        title: 'Tao khach hang thanh cong',
        description: `Da them ${newCustomer.phone}`,
      });
    },
    onError: () => {
      toast({
        title: 'Loi',
        description: 'Khong the tao khach hang. Vui long thu lai.',
        variant: 'destructive',
      });
    },
  });

  // ----- Chon khach hang tu ket qua tim kiem -----
  const handleSelectCustomer = useCallback(
    (found: typeof searchResult) => {
      if (!found) return;
      setCustomer({
        id: found.id,
        fullName: found.fullName,
        phone: found.phone,
        email: found.email,
        loyaltyPoints: found.loyaltyPoints || 0,
      });
      setIsSearching(false);
      setPhoneInput('');
    },
    [setCustomer]
  );

  // ----- Xoa khach hang (quay ve "Khach le") -----
  const handleClearCustomer = () => {
    setCustomer(null);
    setPhoneInput('');
    setIsSearching(false);
  };

  // ----- Handle phone input -----
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setPhoneInput(cleaned);
    setIsSearching(true);
  };

  return (
    <div>
      {/* Hien thi khach hang da chon */}
      {customer ? (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {customer.fullName}
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span>{customer.phone}</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3" />
                  {customer.loyaltyPoints} diem
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearCustomer}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Input tim kiem */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="SDT khach hang..."
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="pl-10 h-9"
                maxLength={11}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs shrink-0"
              onClick={handleClearCustomer}
            >
              Khach le
            </Button>
          </div>

          {/* Ket qua tim kiem */}
          {isSearching && debouncedPhone.length >= 9 && (
            <div className="border rounded-lg overflow-hidden">
              {searchLoading ? (
                <div className="p-3 text-center text-sm text-gray-500">
                  Dang tim kiem...
                </div>
              ) : searchResult ? (
                <button
                  onClick={() => handleSelectCustomer(searchResult)}
                  className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {searchResult.fullName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{searchResult.phone}</span>
                      <Badge variant="secondary" className="text-xs">
                        {searchResult.loyaltyPoints || 0} diem
                      </Badge>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="p-3 text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    Khong tim thay khach hang
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewCustomerName('');
                      setShowCreateDialog(true);
                    }}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Tao khach hang moi
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dialog tao khach hang moi */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tao khach hang moi</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>So dien thoai *</Label>
              <Input value={phoneInput} disabled className="mt-1" />
            </div>
            <div>
              <Label>Ho va ten (tuy chon)</Label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nhap ten khach hang..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Huy
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  phone: phoneInput,
                  fullName: newCustomerName || undefined,
                })
              }
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Dang tao...' : 'Tao khach hang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 4. VariantSelectorModal

> File: `apps/fe/src/components/pos/variant-selector-modal.tsx`
> Modal chon nhanh bien the san pham trong POS. Hien thi: mau sac, kich thuoc, gia, ton kho, so luong.

### 4.1 Cau truc giao dien

```
┌───────────────────────────────────────────────┐
│  [X]  CHON PHIEN BAN - Sofa Boras             │
├───────────────────────────────────────────────┤
│                                               │
│  Mau sac:                                     │
│  [Xam dam]  [Be kem]  [Xanh navy]            │
│                                               │
│  Kich thuoc:                                  │
│  [180x80cm]  [200x90cm]  [220x95cm]          │
│                                               │
│  ┌──────────────────────────────────┐         │
│  │ Gia:        5,990,000 VND       │         │
│  │ Ton kho:    5 san pham          │         │
│  │ SKU:        SF-BORAS-GRAY-180   │         │
│  └──────────────────────────────────┘         │
│                                               │
│  So luong:  [- ] [ 1 ] [ +]                  │
│                                               │
│  [         THEM VAO GIO HANG         ]        │
└───────────────────────────────────────────────┘
```

### 4.2 Code

```tsx
// ============================================================
// apps/fe/src/components/pos/variant-selector-modal.tsx
// ============================================================
'use client';

import { useState, useMemo, useCallback } from 'react';
import { X, Plus, Minus, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { POSCartItem } from '@/stores/use-pos-store';
import { formatCurrency } from '@/lib/utils';

interface Variant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  variants: Variant[];
}

interface VariantSelectorModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (item: POSCartItem) => void;
}

export function VariantSelectorModal({
  product,
  onClose,
  onAdd,
}: VariantSelectorModalProps) {
  // ----- Extract attribute options -----
  const attributeOptions = useMemo(() => {
    const options: Record<string, string[]> = {};

    product.variants.forEach((variant) => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!options[key]) options[key] = [];
        if (!options[key].includes(value)) {
          options[key].push(value);
        }
      });
    });

    return options;
  }, [product.variants]);

  // ----- Label tieng Viet cho attribute -----
  const attributeLabels: Record<string, string> = {
    color: 'Mau sac',
    size: 'Kich thuoc',
    material: 'Chat lieu',
    dimension: 'Kich thuoc',
  };

  // ----- State -----
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >(() => {
    // Mac dinh chon attribute dau tien cua moi loai
    const defaults: Record<string, string> = {};
    Object.entries(attributeOptions).forEach(([key, values]) => {
      defaults[key] = values[0];
    });
    return defaults;
  });

  const [quantity, setQuantity] = useState(1);

  // ----- Tim variant trung khop voi cac attribute da chon -----
  const selectedVariant = useMemo(() => {
    return product.variants.find((variant) =>
      Object.entries(selectedAttributes).every(
        ([key, value]) => variant.attributes[key] === value
      )
    );
  }, [product.variants, selectedAttributes]);

  // ----- Handle attribute selection -----
  const handleSelectAttribute = useCallback((key: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [key]: value }));
    setQuantity(1); // Reset so luong khi doi variant
  }, []);

  // ----- Handle add to cart -----
  const handleAdd = () => {
    if (!selectedVariant || selectedVariant.stock === 0) return;

    onAdd({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variantLabel: Object.values(selectedVariant.attributes).join(' - '),
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      quantity,
      maxStock: selectedVariant.stock,
      image: product.images[0],
    });
  };

  // ----- Check xem attribute co hop le ko (co variant tuong ung) -----
  const isAttributeAvailable = (key: string, value: string) => {
    const testAttrs = { ...selectedAttributes, [key]: value };
    return product.variants.some(
      (v) =>
        Object.entries(testAttrs).every(
          ([k, val]) => v.attributes[k] === val
        ) && v.stock > 0
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-bold">Chon phien ban</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product name */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <p className="font-semibold text-base">{product.name}</p>
        </div>

        {/* Attribute selectors */}
        <div className="px-6 py-4 space-y-4">
          {Object.entries(attributeOptions).map(([key, values]) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {attributeLabels[key] || key}
              </label>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const isSelected = selectedAttributes[key] === value;
                  const isAvailable = isAttributeAvailable(key, value);

                  return (
                    <button
                      key={value}
                      onClick={() => handleSelectAttribute(key, value)}
                      disabled={!isAvailable}
                      className={`
                        px-4 py-2 rounded-lg border text-sm font-medium transition-all
                        ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isAvailable
                              ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                        }
                      `}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Variant info */}
        <div className="px-6 py-3 mx-6 mb-4 bg-gray-50 rounded-lg">
          {selectedVariant ? (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gia:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(selectedVariant.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ton kho:</span>
                <span
                  className={`text-sm font-medium ${
                    selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {selectedVariant.stock > 0
                    ? `${selectedVariant.stock} san pham`
                    : 'Het hang'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">SKU:</span>
                <span className="text-sm font-mono text-gray-700">
                  {selectedVariant.sku}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Khong co phien ban phu hop</span>
            </div>
          )}
        </div>

        {/* Quantity selector */}
        <div className="px-6 pb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            So luong
          </label>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold w-12 text-center">
              {quantity}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10"
              disabled={
                !selectedVariant || quantity >= selectedVariant.stock
              }
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add button */}
        <div className="px-6 pb-6">
          <Button
            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
            disabled={!selectedVariant || selectedVariant.stock === 0}
            onClick={handleAdd}
          >
            <Plus className="h-5 w-5 mr-2" />
            Them vao gio hang
            {selectedVariant && (
              <span className="ml-2">
                ({formatCurrency(selectedVariant.price * quantity)})
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. PaymentModal

> File: `apps/fe/src/components/pos/payment-modal.tsx`
> Modal thanh toan voi 2 tab: Tien mat / Chuyen khoan.
> Tien mat: nhap tien khach dua, tu dong tinh tien thoi.
> Chuyen khoan: hien QR code va thong tin ngan hang.
> Xac nhan -> tao don POS qua API, xoa gio hang, option in hoa don.

### 5.1 Cau truc giao dien

```
┌───────────────────────────────────────────┐
│  THANH TOAN                           [X] │
├───────────────────────────────────────────┤
│  [  TIEN MAT  ]  [  CHUYEN KHOAN  ]      │
├───────────────────────────────────────────┤
│                                           │
│  === Tab Tien mat ===                     │
│                                           │
│          TONG TIEN                        │
│        12,470,000 VND                     │
│                                           │
│  Tien khach dua:                          │
│  ┌─────────────────────────────┐          │
│  │      13,000,000             │          │
│  └─────────────────────────────┘          │
│  [50K] [100K] [200K] [500K] [Du tien]    │
│                                           │
│  Tien thoi:    530,000 VND               │
│                                           │
│  [ ===== XAC NHAN THANH TOAN ===== ]     │
│                                           │
│  === Tab Chuyen khoan ===                 │
│                                           │
│  ┌──────────────────┐                     │
│  │   [QR CODE IMG]  │                     │
│  └──────────────────┘                     │
│  Ngan hang: Vietcombank                   │
│  So TK:     1234567890                    │
│  Chu TK:    CONG TY NOI THAT VN          │
│  Noi dung:  POS-12345                     │
│                                           │
│  [ ===== XAC NHAN THANH TOAN ===== ]     │
└───────────────────────────────────────────┘
```

### 5.2 Code

```tsx
// ============================================================
// apps/fe/src/components/pos/payment-modal.tsx
// ============================================================
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Banknote,
  CreditCard,
  CheckCircle,
  Printer,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOSStore } from '@/stores/use-pos-store';
import { posOrderService } from '@/services/pos-order-service';
import { useMutation } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from '@/components/pos/receipt';

// ---- Config ngan hang ----
const BANK_CONFIG = {
  bankName: 'Vietcombank',
  accountNumber: '1234567890',
  accountHolder: 'CONG TY TNHH NOI THAT VIET NAM',
  branch: 'Ho Chi Minh',
};

// ---- Quick amounts ----
const QUICK_AMOUNTS = [
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '200K', value: 200000 },
  { label: '500K', value: 500000 },
  { label: '1M', value: 1000000 },
  { label: '2M', value: 2000000 },
  { label: '5M', value: 5000000 },
];

interface PaymentModalProps {
  method: 'cash' | 'bank_transfer';
  onClose: () => void;
}

export function PaymentModal({ method, onClose }: PaymentModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    cartItems,
    customer,
    discount,
    activeShift,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    clearCart,
  } = usePOSStore();

  const [activeTab, setActiveTab] = useState<'cash' | 'bank_transfer'>(method);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [orderCreated, setOrderCreated] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const total = getTotal();
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;

  // ----- Tao don POS -----
  const createOrderMutation = useMutation({
    mutationFn: () =>
      posOrderService.createPOSOrder({
        shiftId: activeShift!.id,
        customerId: customer?.id || null,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        subtotal: getSubtotal(),
        discount: discount
          ? {
              type: discount.type,
              value: discount.value,
              couponCode: discount.couponCode,
            }
          : null,
        discountAmount: getDiscountAmount(),
        total: getTotal(),
        paymentMethod: activeTab,
        cashReceived: activeTab === 'cash' ? cashAmount : undefined,
        cashChange: activeTab === 'cash' ? Math.max(0, change) : undefined,
      }),
    onSuccess: (order) => {
      setOrderCreated(order);
      clearCart();
      toast({
        title: 'Thanh toan thanh cong!',
        description: `Don hang #${order.orderNumber} da duoc tao.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Loi thanh toan',
        description: error.message || 'Khong the tao don hang. Vui long thu lai.',
        variant: 'destructive',
      });
    },
  });

  // ----- Handle xac nhan thanh toan -----
  const handleConfirmPayment = () => {
    if (activeTab === 'cash' && cashAmount < total) {
      toast({
        title: 'Tien khach dua chua du',
        description: 'Vui long nhap so tien lon hon hoac bang tong tien.',
        variant: 'destructive',
      });
      return;
    }
    createOrderMutation.mutate();
  };

  // ----- Handle in hoa don -----
  const handlePrintReceipt = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // ----- QR URL (VietQR standard) -----
  const qrUrl = useMemo(() => {
    const content = orderCreated
      ? `POS-${orderCreated.orderNumber}`
      : `POS-${Date.now()}`;
    return `https://img.vietqr.io/image/${BANK_CONFIG.bankName}-${BANK_CONFIG.accountNumber}-compact.png?amount=${total}&addInfo=${content}`;
  }, [total, orderCreated]);

  // ===== TRANG THANH CONG =====
  if (orderCreated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Thanh toan thanh cong!
          </h2>
          <p className="text-gray-600 mb-1">
            Don hang #{orderCreated.orderNumber}
          </p>
          <p className="text-3xl font-bold text-blue-600 mb-6">
            {formatCurrency(orderCreated.total)}
          </p>

          {activeTab === 'cash' && change > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-700">Tien thoi lai</p>
              <p className="text-xl font-bold text-amber-800">
                {formatCurrency(change)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={handlePrintReceipt}
            >
              <Printer className="h-4 w-4 mr-2" />
              In hoa don
            </Button>
            <Button className="flex-1 h-12" onClick={onClose}>
              Don moi
            </Button>
          </div>
        </div>

        {/* Receipt for printing (an, chi hien khi print) */}
        {showReceipt && (
          <div className="hidden print:block">
            <Receipt
              order={orderCreated}
              cashReceived={cashAmount}
              cashChange={Math.max(0, change)}
              paymentMethod={activeTab}
              cashierName={activeShift?.staffName || ''}
            />
          </div>
        )}
      </div>
    );
  }

  // ===== MODAL THANH TOAN =====
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="text-lg font-bold">Thanh toan</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b">
          <button
            onClick={() => setActiveTab('cash')}
            className={`
              py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
              ${
                activeTab === 'cash'
                  ? 'border-green-600 text-green-700 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Banknote className="h-4 w-4" />
            Tien mat
          </button>
          <button
            onClick={() => setActiveTab('bank_transfer')}
            className={`
              py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
              ${
                activeTab === 'bank_transfer'
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <CreditCard className="h-4 w-4" />
            Chuyen khoan
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tong tien */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">Tong tien</p>
            <p className="text-4xl font-bold text-blue-600">
              {formatCurrency(total)}
            </p>
          </div>

          {/* ===== Tab Tien mat ===== */}
          {activeTab === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tien khach dua
                </label>
                <Input
                  type="number"
                  placeholder="Nhap so tien..."
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="h-14 text-2xl text-center font-bold"
                  autoFocus
                />
              </div>

              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt.value}
                    size="sm"
                    variant="outline"
                    onClick={() => setCashReceived(amt.value.toString())}
                    className="flex-1 min-w-[70px]"
                  >
                    {amt.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCashReceived(total.toString())}
                  className="flex-1 min-w-[70px] bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Du tien
                </Button>
              </div>

              {/* Tien thoi */}
              {cashAmount > 0 && (
                <div
                  className={`rounded-lg p-4 text-center ${
                    change >= 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      change >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {change >= 0 ? 'Tien thoi lai' : 'Con thieu'}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      change >= 0 ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {formatCurrency(Math.abs(change))}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===== Tab Chuyen khoan ===== */}
          {activeTab === 'bank_transfer' && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <img
                    src={qrUrl}
                    alt="Bank QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              {/* Bank info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ngan hang:</span>
                  <span className="font-medium">{BANK_CONFIG.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">So tai khoan:</span>
                  <span className="font-mono font-medium">
                    {BANK_CONFIG.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Chu tai khoan:</span>
                  <span className="font-medium">
                    {BANK_CONFIG.accountHolder}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Noi dung CK:</span>
                  <span className="font-mono font-medium text-blue-600">
                    POS-{Date.now().toString().slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm button */}
        <div className="p-6 pt-0">
          <Button
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            disabled={
              createOrderMutation.isPending ||
              (activeTab === 'cash' && cashAmount < total)
            }
            onClick={handleConfirmPayment}
          >
            {createOrderMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Dang xu ly...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Xac nhan thanh toan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Receipt

> File: `apps/fe/src/components/pos/receipt.tsx`
> Component hoa don toi uu cho may in nhiet 80mm.
> Su dung window.print() voi CSS dac biet cho in.

### 6.1 Cau truc hoa don

```
┌─────────────────────────────────┐
│       NOI THAT VIET NAM         │  (ten cua hang, in dam)
│  123 Nguyen Hue, Q1, TP.HCM    │  (dia chi)
│  SDT: 028 1234 5678             │
│─────────────────────────────────│
│  HOA DON BAN HANG               │
│  So: POS-240402-001             │
│  Ngay: 02/04/2026 14:35        │
│  Thu ngan: Nguyen Van A         │
│─────────────────────────────────│
│  San pham          SL   T.Tien  │
│  Sofa Boras         1  5,990K  │
│   (Xam dam-180cm)              │
│  Ban Mino           2  6,980K  │
│   (Go soi-120cm)               │
│─────────────────────────────────│
│  Tam tinh:            12,970K  │
│  Giam gia:              -500K  │
│  TONG CONG:          12,470K   │  (in dam, co lon)
│─────────────────────────────────│
│  Tien mat:           13,000K   │
│  Tien thoi:             530K   │
│─────────────────────────────────│
│                                 │
│    Cam on quy khach!            │
│    Hen gap lai!                 │
│                                 │
└─────────────────────────────────┘
```

### 6.2 Code

```tsx
// ============================================================
// apps/fe/src/components/pos/receipt.tsx
// ============================================================
'use client';

import { forwardRef } from 'react';
import { formatCurrency } from '@/lib/utils';

// ---- Config cua hang ----
const STORE_CONFIG = {
  name: 'NOI THAT VIET NAM',
  address: '123 Nguyen Hue, Quan 1, TP. Ho Chi Minh',
  phone: '028 1234 5678',
  taxId: '0123456789',
};

interface ReceiptItem {
  name: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptOrder {
  orderNumber: string;
  createdAt: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  customer?: { fullName: string; phone: string } | null;
}

interface ReceiptProps {
  order: ReceiptOrder;
  cashReceived?: number;
  cashChange?: number;
  paymentMethod: 'cash' | 'bank_transfer';
  cashierName: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ order, cashReceived, cashChange, paymentMethod, cashierName }, ref) => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <>
        {/* Print-specific CSS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                /* An tat ca noi dung khac tru receipt */
                body * {
                  visibility: hidden;
                }
                .pos-receipt,
                .pos-receipt * {
                  visibility: visible;
                }
                .pos-receipt {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 80mm;
                }

                /* Typography cho may in nhiet */
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            `,
          }}
        />

        <div
          ref={ref}
          className="pos-receipt"
          style={{
            width: '80mm',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '12px',
            lineHeight: '1.4',
            padding: '4mm',
            color: '#000',
            background: '#fff',
          }}
        >
          {/* Header - Ten cua hang */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '4px',
              }}
            >
              {STORE_CONFIG.name}
            </div>
            <div style={{ fontSize: '10px' }}>{STORE_CONFIG.address}</div>
            <div style={{ fontSize: '10px' }}>SDT: {STORE_CONFIG.phone}</div>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px dashed #000',
              margin: '6px 0',
            }}
          />

          {/* Order info */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
              HOA DON BAN HANG
            </div>
            <div>So: {order.orderNumber}</div>
            <div>Ngay: {formatDate(order.createdAt)}</div>
            <div>Thu ngan: {cashierName}</div>
            {order.customer && (
              <div>
                KH: {order.customer.fullName} - {order.customer.phone}
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px dashed #000',
              margin: '6px 0',
            }}
          />

          {/* Items table */}
          <div style={{ marginBottom: '6px' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ flex: 1 }}>{item.name}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingLeft: '8px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: '#666' }}>
                    ({item.variantLabel})
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingLeft: '8px',
                  }}
                >
                  <span>
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px dashed #000',
              margin: '6px 0',
            }}
          />

          {/* Summary */}
          <div style={{ marginBottom: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Tam tinh:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Giam gia:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '16px',
                marginTop: '4px',
              }}
            >
              <span>TONG CONG:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px dashed #000',
              margin: '6px 0',
            }}
          />

          {/* Payment info */}
          <div style={{ marginBottom: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Thanh toan:</span>
              <span>
                {paymentMethod === 'cash' ? 'Tien mat' : 'Chuyen khoan'}
              </span>
            </div>

            {paymentMethod === 'cash' && cashReceived !== undefined && (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Tien nhan:</span>
                  <span>{formatCurrency(cashReceived)}</span>
                </div>
                {cashChange !== undefined && cashChange > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Tien thoi:</span>
                    <span>{formatCurrency(cashChange)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px dashed #000',
              margin: '6px 0',
            }}
          />

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '11px',
            }}
          >
            <div>Cam on quy khach!</div>
            <div>Hen gap lai!</div>
            <div style={{ marginTop: '8px', fontSize: '9px', color: '#999' }}>
              MST: {STORE_CONFIG.taxId}
            </div>
          </div>
        </div>
      </>
    );
  }
);

Receipt.displayName = 'Receipt';
```

### 6.3 Nut In Hoa Don (su dung trong cac trang khac)

```tsx
// ============================================================
// apps/fe/src/components/pos/print-receipt-button.tsx
// ============================================================
'use client';

import { useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Receipt, type ReceiptProps } from '@/components/pos/receipt';

interface PrintReceiptButtonProps {
  receiptData: ReceiptProps;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function PrintReceiptButton({
  receiptData,
  variant = 'outline',
  size = 'default',
}: PrintReceiptButtonProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const handlePrint = () => {
    setShowReceipt(true);

    // Cho render xong roi in
    setTimeout(() => {
      window.print();
      // An receipt sau khi in
      setTimeout(() => setShowReceipt(false), 500);
    }, 300);
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />
        In hoa don
      </Button>

      {/* Hidden receipt - chi hien khi print */}
      {showReceipt && (
        <div className="fixed left-[-9999px] top-0 print:left-0 print:top-0">
          <Receipt ref={receiptRef} {...receiptData} />
        </div>
      )}
    </>
  );
}
```

---

## 7. ShiftManagementPage

> File: `apps/fe/src/app/pos/shifts/page.tsx`
> Quan ly ca lam viec: mo ca, dong ca, lich su ca.

### 7.1 Cau truc trang

```
┌─────────────────────────────────────────────────────────────┐
│  QUAN LY CA LAM VIEC                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  === Neu chua co ca: ===                                    │
│  ┌───────────────────────────────┐                          │
│  │  CHUA CO CA LAM VIEC          │                          │
│  │                               │                          │
│  │  Tien dau ca: [____________]  │                          │
│  │                               │                          │
│  │  [      MO CA LAM VIEC     ]  │                          │
│  └───────────────────────────────┘                          │
│                                                             │
│  === Neu dang co ca: ===                                    │
│  ┌───────────────────────────────┐                          │
│  │  CA #12 - DANG HOAT DONG     │                          │
│  │  Mo luc: 08:00 02/04/2026    │                          │
│  │  Tien dau ca: 2,000,000      │                          │
│  │  So don: 15                   │                          │
│  │  Doanh thu: 45,600,000       │                          │
│  │                               │                          │
│  │  [      DONG CA             ]  │                          │
│  └───────────────────────────────┘                          │
│                                                             │
│  === Lich su ca ===                                         │
│  ┌─────┬──────┬─────────┬─────────┬─────────┬──────┐       │
│  │ Ca  │ NV   │ Mo      │ Dong    │ DT      │ Don  │       │
│  ├─────┼──────┼─────────┼─────────┼─────────┼──────┤       │
│  │ #11 │ A    │ 2M      │ 15.2M   │ 35.6M   │ 12   │       │
│  │ #10 │ B    │ 1.5M    │ 8.7M    │ 22.1M   │ 8    │       │
│  └─────┴──────┴─────────┴─────────┴─────────┴──────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Code

```tsx
// ============================================================
// apps/fe/src/app/pos/shifts/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  DoorOpen,
  DoorClosed,
  Banknote,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePOSStore } from '@/stores/use-pos-store';
import { shiftService } from '@/services/shift-service';
import { useAuthStore } from '@/stores/use-auth-store';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ShiftManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { activeShift, setActiveShift } = usePOSStore();

  const [openingCash, setOpeningCash] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [closeNote, setCloseNote] = useState('');

  // ----- Fetch lich su ca -----
  const { data: shiftHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['shift-history'],
    queryFn: () => shiftService.getShiftHistory({ limit: 20 }),
  });

  // ----- Fetch thong tin ca hien tai -----
  const { data: currentShiftData } = useQuery({
    queryKey: ['current-shift', activeShift?.id],
    queryFn: () => shiftService.getShiftSummary(activeShift!.id),
    enabled: !!activeShift,
    refetchInterval: 30000, // Refresh moi 30 giay
  });

  // ----- Mo ca -----
  const openShiftMutation = useMutation({
    mutationFn: (data: { openingCash: number }) =>
      shiftService.openShift(data),
    onSuccess: (shift) => {
      setActiveShift({
        id: shift.id,
        shiftNumber: shift.shiftNumber,
        staffId: shift.staffId,
        staffName: user?.fullName || '',
        openedAt: shift.openedAt,
        openingCash: shift.openingCash,
      });
      setOpeningCash('');
      queryClient.invalidateQueries({ queryKey: ['shift-history'] });
      toast({
        title: 'Mo ca thanh cong',
        description: `Ca #${shift.shiftNumber} da duoc mo.`,
      });
    },
    onError: () => {
      toast({
        title: 'Loi',
        description: 'Khong the mo ca. Vui long thu lai.',
        variant: 'destructive',
      });
    },
  });

  // ----- Dong ca -----
  const closeShiftMutation = useMutation({
    mutationFn: (data: { closingCash: number; note?: string }) =>
      shiftService.closeShift(activeShift!.id, data),
    onSuccess: () => {
      setActiveShift(null);
      setShowCloseDialog(false);
      setClosingCash('');
      setCloseNote('');
      queryClient.invalidateQueries({ queryKey: ['shift-history'] });
      toast({
        title: 'Dong ca thanh cong',
        description: 'Ca lam viec da duoc dong.',
      });
    },
    onError: () => {
      toast({
        title: 'Loi',
        description: 'Khong the dong ca. Vui long thu lai.',
        variant: 'destructive',
      });
    },
  });

  // ----- Handle mo ca -----
  const handleOpenShift = () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Loi',
        description: 'Vui long nhap so tien dau ca hop le.',
        variant: 'destructive',
      });
      return;
    }
    openShiftMutation.mutate({ openingCash: amount });
  };

  // ----- Handle dong ca -----
  const handleCloseShift = () => {
    const amount = parseFloat(closingCash);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Loi',
        description: 'Vui long nhap so tien cuoi ca hop le.',
        variant: 'destructive',
      });
      return;
    }
    closeShiftMutation.mutate({
      closingCash: amount,
      note: closeNote || undefined,
    });
  };

  // ----- Tinh chenh lech tien -----
  const cashDifference =
    currentShiftData && closingCash
      ? parseFloat(closingCash) -
        (activeShift!.openingCash + (currentShiftData.cashSales || 0))
      : 0;

  // ----- Format date -----
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Clock className="h-6 w-6" />
        Quan ly ca lam viec
      </h1>

      {/* ===== TRANG THAI CA HIEN TAI ===== */}
      {!activeShift ? (
        /* ----- Chua co ca: Form mo ca ----- */
        <Card className="mb-8 max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-blue-600" />
              Mo ca lam viec
            </CardTitle>
            <CardDescription>
              Nhap so tien mat dau ca de bat dau ban hang.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tien mat dau ca (VND)</Label>
              <Input
                type="number"
                placeholder="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="mt-1 h-12 text-xl"
                autoFocus
              />
            </div>
            <Button
              className="w-full h-12 text-base"
              onClick={handleOpenShift}
              disabled={openShiftMutation.isPending}
            >
              {openShiftMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <DoorOpen className="h-5 w-5 mr-2" />
              )}
              Mo ca lam viec
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* ----- Dang co ca: Thong tin ca ----- */
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ca #{activeShift.shiftNumber} - Dang hoat dong
              </CardTitle>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Active
              </Badge>
            </div>
            <CardDescription>
              Mo luc: {formatDateTime(activeShift.openedAt)} | Thu ngan:{' '}
              {activeShift.staffName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                  <Banknote className="h-4 w-4" />
                  Tien dau ca
                </div>
                <p className="text-lg font-bold">
                  {formatCurrency(activeShift.openingCash)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Doanh thu
                </div>
                <p className="text-lg font-bold">
                  {formatCurrency(currentShiftData?.totalSales || 0)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                  <ShoppingBag className="h-4 w-4" />
                  So don hang
                </div>
                <p className="text-lg font-bold">
                  {currentShiftData?.ordersCount || 0}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
                  <CreditCard className="h-4 w-4" />
                  Chuyen khoan
                </div>
                <p className="text-lg font-bold">
                  {formatCurrency(currentShiftData?.bankSales || 0)}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              className="h-12"
              onClick={() => setShowCloseDialog(true)}
            >
              <DoorClosed className="h-5 w-5 mr-2" />
              Dong ca lam viec
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ===== LICH SU CA ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Lich su ca lam viec</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
              Dang tai...
            </div>
          ) : !shiftHistory || shiftHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chua co lich su ca lam viec
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ca</TableHead>
                    <TableHead>Nhan vien</TableHead>
                    <TableHead>Thoi gian</TableHead>
                    <TableHead className="text-right">Tien dau ca</TableHead>
                    <TableHead className="text-right">Tien cuoi ca</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead className="text-right">So don</TableHead>
                    <TableHead className="text-right">Chenh lech</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftHistory.map((shift: any) => {
                    const expectedCash =
                      shift.openingCash + (shift.cashSales || 0);
                    const diff =
                      shift.closingCash !== null
                        ? shift.closingCash - expectedCash
                        : null;

                    return (
                      <TableRow key={shift.id}>
                        <TableCell>
                          <Badge variant="outline">#{shift.shiftNumber}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {shift.staffName}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{formatDateTime(shift.openedAt)}</div>
                          {shift.closedAt && (
                            <div className="text-gray-500">
                              {formatDateTime(shift.closedAt)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(shift.openingCash)}
                        </TableCell>
                        <TableCell className="text-right">
                          {shift.closingCash !== null
                            ? formatCurrency(shift.closingCash)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(shift.totalSales || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {shift.ordersCount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {diff !== null ? (
                            <span
                              className={
                                diff > 0
                                  ? 'text-blue-600'
                                  : diff < 0
                                    ? 'text-red-600'
                                    : 'text-green-600'
                              }
                            >
                              {diff > 0 ? '+' : ''}
                              {formatCurrency(diff)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== DIALOG DONG CA ===== */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorClosed className="h-5 w-5" />
              Dong ca lam viec
            </DialogTitle>
            <DialogDescription>
              Kiem tra va nhap so tien mat thuc te trong ket truoc khi dong ca.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Thong tin ca */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tien dau ca:</span>
                <span className="font-medium">
                  {formatCurrency(activeShift?.openingCash || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Doanh thu tien mat:</span>
                <span className="font-medium">
                  {formatCurrency(currentShiftData?.cashSales || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Doanh thu chuyen khoan:</span>
                <span className="font-medium">
                  {formatCurrency(currentShiftData?.bankSales || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Tong doanh thu:</span>
                <span>{formatCurrency(currentShiftData?.totalSales || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-blue-700 border-t pt-2">
                <span>Tien mat ky vong trong ket:</span>
                <span className="font-bold">
                  {formatCurrency(
                    (activeShift?.openingCash || 0) +
                      (currentShiftData?.cashSales || 0)
                  )}
                </span>
              </div>
            </div>

            {/* Nhap tien cuoi ca */}
            <div>
              <Label>Tien mat thuc te trong ket (VND)</Label>
              <Input
                type="number"
                placeholder="Nhap so tien mat thuc te..."
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="mt-1 h-12 text-xl"
              />
            </div>

            {/* Chenh lech */}
            {closingCash && (
              <div
                className={`rounded-lg p-3 text-center ${
                  cashDifference > 0
                    ? 'bg-blue-50'
                    : cashDifference < 0
                      ? 'bg-red-50'
                      : 'bg-green-50'
                }`}
              >
                <p
                  className={`text-sm ${
                    cashDifference > 0
                      ? 'text-blue-700'
                      : cashDifference < 0
                        ? 'text-red-700'
                        : 'text-green-700'
                  }`}
                >
                  {cashDifference > 0
                    ? 'Thua tien'
                    : cashDifference < 0
                      ? 'Thieu tien'
                      : 'Khop'}
                </p>
                <p
                  className={`text-xl font-bold ${
                    cashDifference > 0
                      ? 'text-blue-800'
                      : cashDifference < 0
                        ? 'text-red-800'
                        : 'text-green-800'
                  }`}
                >
                  {cashDifference !== 0
                    ? `${cashDifference > 0 ? '+' : ''}${formatCurrency(cashDifference)}`
                    : 'Chinh xac'}
                </p>
              </div>
            )}

            {/* Ghi chu */}
            <div>
              <Label>Ghi chu (tuy chon)</Label>
              <Textarea
                placeholder="Ghi chu them..."
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
            >
              Huy
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseShift}
              disabled={closeShiftMutation.isPending || !closingCash}
            >
              {closeShiftMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DoorClosed className="h-4 w-4 mr-2" />
              )}
              Xac nhan dong ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 8. POSOrdersPage

> File: `apps/fe/src/app/pos/orders/page.tsx`
> Danh sach don hang POS hom nay. Loc tu dong theo ngay hien tai.
> Xem nhanh chi tiet don hang.

### 8.1 Code

```tsx
// ============================================================
// apps/fe/src/app/pos/orders/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Eye,
  X,
  Clock,
  User,
  Banknote,
  CreditCard,
  Printer,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { posOrderService } from '@/services/pos-order-service';
import { usePOSStore } from '@/stores/use-pos-store';
import { formatCurrency } from '@/lib/utils';
import { PrintReceiptButton } from '@/components/pos/print-receipt-button';

interface POSOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer?: { fullName: string; phone: string };
  items: Array<{
    name: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'cash' | 'bank_transfer';
  cashReceived?: number;
  cashChange?: number;
  cashierName: string;
}

export default function POSOrdersPage() {
  const { activeShift } = usePOSStore();
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ----- Fetch don hang hom nay -----
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: orders, isLoading } = useQuery({
    queryKey: ['pos-orders-today', today],
    queryFn: () =>
      posOrderService.getOrders({
        dateFrom: today,
        dateTo: today,
        shiftId: activeShift?.id,
      }),
  });

  // ----- Filter orders by search -----
  const filteredOrders = orders?.filter(
    (order: POSOrder) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.customer?.phone.includes(searchQuery)
  );

  // ----- Format time -----
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Don hang hom nay
          </h1>
          <Badge variant="outline" className="text-base px-3 py-1">
            {filteredOrders?.length || 0} don
          </Badge>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Tim don hang (ma don, ten KH, SDT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            Dang tai don hang...
          </div>
        ) : !filteredOrders || filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Chua co don hang nao hom nay</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ma don</TableHead>
                  <TableHead>Thoi gian</TableHead>
                  <TableHead>Khach hang</TableHead>
                  <TableHead>SP</TableHead>
                  <TableHead className="text-right">Tong tien</TableHead>
                  <TableHead>Thanh toan</TableHead>
                  <TableHead className="text-right">Thao tac</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: POSOrder) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.customer ? (
                        <div>
                          <p className="text-sm font-medium">
                            {order.customer.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.customer.phone}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Khach le</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.paymentMethod === 'cash'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="gap-1"
                      >
                        {order.paymentMethod === 'cash' ? (
                          <>
                            <Banknote className="h-3 w-3" />
                            TM
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3 w-3" />
                            CK
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ===== ORDER DETAIL DIALOG ===== */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Don hang #{selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Order info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Thoi gian:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString(
                        'vi-VN'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Thu ngan:</span>
                    <span className="ml-2 font-medium">
                      {selectedOrder.cashierName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Khach hang:</span>
                    <span className="ml-2 font-medium">
                      {selectedOrder.customer?.fullName || 'Khach le'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>San pham</TableHead>
                        <TableHead className="text-center">SL</TableHead>
                        <TableHead className="text-right">Don gia</TableHead>
                        <TableHead className="text-right">T.Tien</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.variantLabel}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Tam tinh:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giam gia:</span>
                      <span>
                        -{formatCurrency(selectedOrder.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Tong cong:</span>
                    <span className="text-blue-600">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>

                {/* Print button */}
                <div className="flex justify-end">
                  <PrintReceiptButton
                    receiptData={{
                      order: selectedOrder,
                      cashReceived: selectedOrder.cashReceived,
                      cashChange: selectedOrder.cashChange,
                      paymentMethod: selectedOrder.paymentMethod,
                      cashierName: selectedOrder.cashierName,
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 9. POSReturnPage

> File: `apps/fe/src/app/pos/returns/page.tsx`
> Tra hang tai quay: tim don hang, chon san pham tra, nhap ly do, tinh tien hoan, xu ly tra hang.

### 9.1 Cau truc giao dien

```
┌─────────────────────────────────────────────────────────────┐
│  TRA HANG TAI QUAY                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tim don hang: [____________] [Tim]                         │
│  (Nhap ma don hoac SDT khach hang)                          │
│                                                             │
│  === Thong tin don hang ===                                 │
│  Don: POS-240402-001 | KH: Nguyen Van A | 02/04/2026       │
│                                                             │
│  ┌────────────────────┬────┬────────┬───────┬──────────┐    │
│  │ San pham           │ Da │ Tra    │ Ly do │ Hoan     │    │
│  │                    │ mua│ (chon) │       │          │    │
│  ├────────────────────┼────┼────────┼───────┼──────────┤    │
│  │ Sofa Boras         │ 1  │ [v] 1  │ [___] │ 5,990K   │    │
│  │ Ban Mino           │ 2  │ [ ] 0  │       │ 0        │    │
│  └────────────────────┴────┴────────┴───────┴──────────┘    │
│                                                             │
│  Tong hoan tra:                5,990,000 VND               │
│                                                             │
│  [          XU LY TRA HANG          ]                       │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Code

```tsx
// ============================================================
// apps/fe/src/app/pos/returns/page.tsx
// ============================================================
'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  RotateCcw,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { posOrderService } from '@/services/pos-order-service';
import { usePOSStore } from '@/stores/use-pos-store';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ---- Ly do tra hang ----
const RETURN_REASONS = [
  { value: 'defective', label: 'Loi san pham' },
  { value: 'wrong_item', label: 'Giao sai hang' },
  { value: 'not_as_described', label: 'Khong dung mo ta' },
  { value: 'customer_changed_mind', label: 'Khach doi y' },
  { value: 'damaged', label: 'San pham hu hong' },
  { value: 'other', label: 'Ly do khac' },
];

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReturnItem {
  orderItemId: string;
  returnQuantity: number;
  reason: string;
  refundAmount: number;
}

export default function POSReturnPage() {
  const { toast } = useToast();
  const { activeShift } = usePOSStore();

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [returnItems, setReturnItems] = useState<Record<string, ReturnItem>>(
    {}
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ----- Tim don hang -----
  const {
    data: foundOrder,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ['pos-return-order', searchQuery],
    queryFn: () => posOrderService.findForReturn(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // ----- Handle search -----
  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setSearchQuery(searchInput.trim());
    setReturnItems({});
  };

  // ----- Toggle return item -----
  const handleToggleReturn = (item: OrderItem, checked: boolean) => {
    if (checked) {
      setReturnItems((prev) => ({
        ...prev,
        [item.id]: {
          orderItemId: item.id,
          returnQuantity: 1,
          reason: '',
          refundAmount: item.unitPrice,
        },
      }));
    } else {
      setReturnItems((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  // ----- Update return quantity -----
  const handleQuantityChange = (itemId: string, quantity: number, unitPrice: number) => {
    setReturnItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        returnQuantity: quantity,
        refundAmount: quantity * unitPrice,
      },
    }));
  };

  // ----- Update reason -----
  const handleReasonChange = (itemId: string, reason: string) => {
    setReturnItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason },
    }));
  };

  // ----- Tinh tong tien hoan -----
  const totalRefund = useMemo(
    () =>
      Object.values(returnItems).reduce(
        (sum, item) => sum + item.refundAmount,
        0
      ),
    [returnItems]
  );

  // ----- Validation -----
  const isValid = useMemo(() => {
    const items = Object.values(returnItems);
    if (items.length === 0) return false;
    return items.every(
      (item) => item.returnQuantity > 0 && item.reason !== ''
    );
  }, [returnItems]);

  // ----- Xu ly tra hang -----
  const returnMutation = useMutation({
    mutationFn: () =>
      posOrderService.processReturn({
        orderId: foundOrder!.id,
        shiftId: activeShift!.id,
        items: Object.values(returnItems),
        totalRefund,
      }),
    onSuccess: (result) => {
      toast({
        title: 'Tra hang thanh cong',
        description: `Da hoan tra ${formatCurrency(totalRefund)}.`,
      });
      // Reset form
      setSearchInput('');
      setSearchQuery('');
      setReturnItems({});
    },
    onError: (error: any) => {
      toast({
        title: 'Loi tra hang',
        description: error.message || 'Khong the xu ly tra hang.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <RotateCcw className="h-6 w-6" />
          Tra hang tai quay
        </h1>

        {/* ===== TIM DON HANG ===== */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label className="mb-2 block">Tim don hang</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhap ma don hang hoac SDT khach hang..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===== KET QUA TIM KIEM ===== */}
        {searchQuery && !searchLoading && !foundOrder && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-gray-500">
              <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Khong tim thay don hang</p>
            </CardContent>
          </Card>
        )}

        {/* ===== THONG TIN DON HANG ===== */}
        {foundOrder && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Don hang #{foundOrder.orderNumber}</span>
                  <Badge>{foundOrder.status}</Badge>
                </CardTitle>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>
                    KH:{' '}
                    {foundOrder.customer?.fullName || 'Khach le'}
                  </span>
                  <span>
                    Ngay:{' '}
                    {new Date(foundOrder.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span>
                    Tong: {formatCurrency(foundOrder.total)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">Tra</TableHead>
                        <TableHead>San pham</TableHead>
                        <TableHead className="text-center">Da mua</TableHead>
                        <TableHead className="text-center">SL tra</TableHead>
                        <TableHead>Ly do</TableHead>
                        <TableHead className="text-right">Hoan tra</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {foundOrder.items.map((item: OrderItem) => {
                        const isReturning = !!returnItems[item.id];
                        const returnData = returnItems[item.id];

                        return (
                          <TableRow key={item.id}>
                            {/* Checkbox tra */}
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={isReturning}
                                onChange={(e) =>
                                  handleToggleReturn(item, e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableCell>

                            {/* San pham */}
                            <TableCell>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.variantLabel}
                              </p>
                            </TableCell>

                            {/* Da mua */}
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>

                            {/* So luong tra */}
                            <TableCell className="text-center">
                              {isReturning ? (
                                <select
                                  value={returnData.returnQuantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      parseInt(e.target.value),
                                      item.unitPrice
                                    )
                                  }
                                  className="border rounded px-2 py-1 text-sm w-16 text-center"
                                >
                                  {Array.from(
                                    { length: item.quantity },
                                    (_, i) => i + 1
                                  ).map((n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* Ly do */}
                            <TableCell>
                              {isReturning ? (
                                <Select
                                  value={returnData.reason}
                                  onValueChange={(val) =>
                                    handleReasonChange(item.id, val)
                                  }
                                >
                                  <SelectTrigger className="w-44 h-8 text-xs">
                                    <SelectValue placeholder="Chon ly do..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RETURN_REASONS.map((r) => (
                                      <SelectItem
                                        key={r.value}
                                        value={r.value}
                                      >
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* Hoan tra */}
                            <TableCell className="text-right font-medium">
                              {isReturning
                                ? formatCurrency(returnData.refundAmount)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Tong hoan tra */}
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="text-lg font-semibold">
                    Tong tien hoan tra:
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalRefund)}
                  </span>
                </div>

                {/* Button xu ly */}
                <div className="mt-4">
                  <Button
                    className="w-full h-12 text-base"
                    disabled={!isValid || returnMutation.isPending}
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Xu ly tra hang
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ===== DIALOG XAC NHAN ===== */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Xac nhan tra hang
            </DialogTitle>
            <DialogDescription>
              Vui long kiem tra lai thong tin truoc khi xu ly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">
                San pham tra ({Object.keys(returnItems).length} san pham):
              </p>
              {Object.values(returnItems).map((item) => {
                const orderItem = foundOrder?.items.find(
                  (i: OrderItem) => i.id === item.orderItemId
                );
                return (
                  <div
                    key={item.orderItemId}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>
                      {orderItem?.name} x{item.returnQuantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.refundAmount)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                <span>Tong hoan tra:</span>
                <span className="text-red-600">
                  {formatCurrency(totalRefund)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Huy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                returnMutation.mutate();
                setShowConfirmDialog(false);
              }}
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Xac nhan tra hang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Tong ket File Structure

```
apps/fe/src/
├── app/pos/
│   ├── layout.tsx              # POSLayout (auth guard, top bar)
│   ├── page.tsx                # POSMainPage (split: products + cart)
│   ├── shifts/
│   │   └── page.tsx            # ShiftManagementPage
│   ├── orders/
│   │   └── page.tsx            # POSOrdersPage
│   └── returns/
│       └── page.tsx            # POSReturnPage
├── components/pos/
│   ├── customer-lookup.tsx     # CustomerLookup
│   ├── variant-selector-modal.tsx # VariantSelectorModal
│   ├── payment-modal.tsx       # PaymentModal
│   ├── receipt.tsx             # Receipt (thermal 80mm)
│   └── print-receipt-button.tsx # PrintReceiptButton
└── stores/
    └── use-pos-store.ts        # POS Zustand store
```
