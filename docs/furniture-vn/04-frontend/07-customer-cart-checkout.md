# CUSTOMER - GIO HANG & THANH TOAN

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/cart/`, `apps/fe/src/app/(customer)/checkout/`
> Trang gio hang, nhap coupon, thanh toan multi-step, bank transfer, trang thanh cong
> Tech stack: Next.js 14 + TailwindCSS + Framer Motion + react-hook-form + zod + Zustand
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [CartPage - Trang gio hang](#1-cartpage---trang-gio-hang)
2. [CouponInput - Nhap ma giam gia](#2-couponinput---nhap-ma-giam-gia)
3. [CheckoutPage - Trang thanh toan](#3-checkoutpage---trang-thanh-toan)
4. [BankTransferInfo - Thong tin chuyen khoan](#4-banktransferinfo---thong-tin-chuyen-khoan)
5. [CheckoutSuccessPage - Dat hang thanh cong](#5-checkoutsuccesspage---dat-hang-thanh-cong)

---

## 1. CartPage - Trang gio hang

> File: `apps/fe/src/app/(customer)/cart/page.tsx`
> Hien thi danh sach san pham trong gio hang, cho phep chinh so luong, xoa san pham,
> nhap coupon, tinh tong tien va chuyen sang thanh toan.
> Desktop: bang (table), Mobile: card layout.
> AnimatePresence cho hieu ung xoa san pham.

### 1.1 Cart Store (Zustand)

```typescript
// apps/fe/src/stores/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CouponValidation } from '@/types';

interface CartState {
  items: CartItem[];
  coupon: CouponValidation | null;
  shippingFee: number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: CouponValidation) => void;
  removeCoupon: () => void;
  setShippingFee: (fee: number) => void;

  // Computed
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      shippingFee: 0,

      addItem: (newItem) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.variantId === newItem.variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + newItem.quantity,
            };
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.productId === productId && item.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
              : item
          ),
        })),

      clearCart: () => set({ items: [], coupon: null, shippingFee: 0 }),

      applyCoupon: (coupon) => set({ coupon }),

      removeCoupon: () => set({ coupon: null }),

      setShippingFee: (fee) => set({ shippingFee: fee }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      getDiscount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        const subtotal = get().getSubtotal();
        if (coupon.discountType === 'PERCENTAGE') {
          const discount = (subtotal * coupon.discountValue) / 100;
          return coupon.maxDiscount
            ? Math.min(discount, coupon.maxDiscount)
            : discount;
        }
        return coupon.discountValue;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().shippingFee;
        return Math.max(0, subtotal - discount + shipping);
      },

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'furniture-vn-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
      }),
    }
  )
);
```

### 1.2 CartPage Component

```tsx
// apps/fe/src/app/(customer)/cart/page.tsx
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { CouponInput } from '@/components/cart/CouponInput';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { Button } from '@/components/ui/Button';
import { QuantityInput } from '@/components/ui/QuantityInput';

export default function CartPage() {
  const {
    items,
    coupon,
    shippingFee,
    removeItem,
    updateQuantity,
    getSubtotal,
    getDiscount,
    getTotal,
  } = useCartStore();

  const subtotal = useMemo(() => getSubtotal(), [items]);
  const discount = useMemo(() => getDiscount(), [items, coupon]);
  const total = useMemo(() => getTotal(), [items, coupon, shippingFee]);

  // -- Trang thai gio hang rong --
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary-50
                          flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-primary-300" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Gio hang cua ban dang trong
          </h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Hay kham pha cac san pham noi that dep va chat luong cua chung toi
          </p>

          <Link href="/products">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="w-5 h-5" />
              Kham pha san pham
            </Button>
          </Link>
        </motion.div>

        {/* Goi y san pham */}
        <div className="w-full max-w-7xl mx-auto mt-16">
          <RelatedProducts title="San pham noi bat" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-500">Trang chu</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">Gio hang</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
        Gio hang ({items.length} san pham)
      </h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* === COT TRAI: DANH SACH SAN PHAM === */}
        <div className="lg:col-span-2">

          {/* --- Desktop Table (hidden on mobile) --- */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left text-sm
                               font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="pb-3 pr-4">San pham</th>
                  <th className="pb-3 px-4 text-center">Don gia</th>
                  <th className="pb-3 px-4 text-center">So luong</th>
                  <th className="pb-3 px-4 text-right">Thanh tien</th>
                  <th className="pb-3 pl-4 w-12"></th>
                </tr>
              </thead>

              <AnimatePresence mode="popLayout">
                <tbody>
                  {items.map((item) => (
                    <motion.tr
                      key={`${item.productId}-${item.variantId}`}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        x: -50,
                        height: 0,
                        transition: { duration: 0.3 },
                      }}
                      className="border-b border-gray-100 group"
                    >
                      {/* San pham: anh + ten + variant */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden
                                          bg-gray-100 flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.slug}`}
                              className="font-medium text-gray-800 hover:text-primary-500
                                         line-clamp-2 transition-colors"
                            >
                              {item.name}
                            </Link>
                            {item.variantName && (
                              <p className="text-sm text-gray-500 mt-1">
                                {item.variantName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Don gia */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-medium text-gray-700">
                          {formatCurrency(item.price)}
                        </span>
                      </td>

                      {/* So luong */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <QuantityInput
                            value={item.quantity}
                            min={1}
                            max={item.stock}
                            onChange={(qty) =>
                              updateQuantity(item.productId, item.variantId, qty)
                            }
                          />
                        </div>
                      </td>

                      {/* Thanh tien */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="font-semibold text-primary-600">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </td>

                      {/* Xoa */}
                      <td className="py-4 pl-4">
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-2 text-gray-400 hover:text-red-500
                                     hover:bg-red-50 rounded-lg transition-colors
                                     opacity-0 group-hover:opacity-100"
                          aria-label={`Xoa ${item.name} khoi gio hang`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </AnimatePresence>
            </table>
          </div>

          {/* --- Mobile Card Layout (hidden on desktop) --- */}
          <div className="md:hidden space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={`mobile-${item.productId}-${item.variantId}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    marginBottom: 0,
                    transition: { duration: 0.3 },
                  }}
                  className="bg-white rounded-xl border border-gray-200
                             shadow-sm p-4"
                >
                  <div className="flex gap-3">
                    {/* Anh san pham */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden
                                    bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* Thong tin */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-medium text-gray-800 line-clamp-2 pr-2"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() =>
                            removeItem(item.productId, item.variantId)
                          }
                          className="p-1 text-gray-400 hover:text-red-500
                                     flex-shrink-0"
                          aria-label={`Xoa ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.variantName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.variantName}
                        </p>
                      )}

                      <p className="text-sm font-medium text-primary-600 mt-1">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>

                  {/* So luong + Thanh tien */}
                  <div className="flex items-center justify-between mt-3 pt-3
                                  border-t border-gray-100">
                    <QuantityInput
                      value={item.quantity}
                      min={1}
                      max={item.stock}
                      onChange={(qty) =>
                        updateQuantity(item.productId, item.variantId, qty)
                      }
                      size="sm"
                    />
                    <span className="font-semibold text-primary-600">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Tiep tuc mua sam */}
          <div className="mt-6">
            <Link href="/products">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tiep tuc mua sam
              </Button>
            </Link>
          </div>
        </div>

        {/* === COT PHAI: CART SUMMARY SIDEBAR === */}
        <div className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm
                          p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Tom tat don hang
            </h2>

            {/* Tam tinh */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tam tinh</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {/* Coupon Input */}
              <CouponInput />

              {/* Giam gia coupon */}
              {coupon && discount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between text-green-600"
                >
                  <span>Giam gia ({coupon.code})</span>
                  <span className="font-medium">
                    -{formatCurrency(discount)}
                  </span>
                </motion.div>
              )}

              {/* Phi van chuyen */}
              <div className="flex justify-between">
                <span className="text-gray-600">Phi van chuyen</span>
                <span className="font-medium">
                  {shippingFee > 0
                    ? formatCurrency(shippingFee)
                    : 'Tinh khi thanh toan'}
                </span>
              </div>
            </div>

            {/* Tong cong */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Tong cong</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Nut thanh toan */}
            <Link href="/checkout" className="block mt-6">
              <Button className="w-full gap-2" size="lg">
                Thanh toan
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>

            {/* Chinh sach */}
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <p>- Mien phi van chuyen cho don hang tu 5.000.000d</p>
              <p>- Doi tra mien phi trong 7 ngay</p>
              <p>- Bao hanh chinh hang 12 thang</p>
            </div>
          </div>
        </div>
      </div>

      {/* === GOI Y SAN PHAM LIEN QUAN === */}
      <div className="mt-16">
        <RelatedProducts
          title="Co the ban cung thich"
          productIds={items.map((item) => item.productId)}
        />
      </div>
    </div>
  );
}
```

### 1.3 QuantityInput Component

```tsx
// apps/fe/src/components/ui/QuantityInput.tsx
'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityInput({
  value,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  className,
}: QuantityInputProps) {
  const isMin = value <= min;
  const isMax = value >= max;

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
  };

  const buttonSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center border border-gray-300 rounded-lg overflow-hidden',
        className
      )}
      role="group"
      aria-label="So luong san pham"
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={isMin}
        className={cn(
          buttonSize[size],
          'flex items-center justify-center text-gray-600',
          'hover:bg-gray-100 transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label="Giam so luong"
      >
        <Minus className={iconSize[size]} />
      </button>

      <input
        type="number"
        value={value}
        onChange={(e) => {
          const num = parseInt(e.target.value, 10);
          if (!isNaN(num)) {
            onChange(Math.max(min, Math.min(max, num)));
          }
        }}
        className={cn(
          sizeClasses[size],
          'w-12 text-center font-medium border-x border-gray-300',
          'focus:outline-none focus:ring-1 focus:ring-primary-500',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none',
          '[&::-webkit-inner-spin-button]:appearance-none'
        )}
        min={min}
        max={max}
        aria-label="So luong"
      />

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={isMax}
        className={cn(
          buttonSize[size],
          'flex items-center justify-center text-gray-600',
          'hover:bg-gray-100 transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-label="Tang so luong"
      >
        <Plus className={iconSize[size]} />
      </button>
    </div>
  );
}
```

---

## 2. CouponInput - Nhap ma giam gia

> File: `apps/fe/src/components/cart/CouponInput.tsx`
> Component cho phep nhap ma giam gia, validate qua API, hien thi ket qua.
> Goi couponService.validate() roi cap nhat cart store.
> Xu ly cac trang thai: loading, success, error (het han, khong du dieu kien...).

```tsx
// apps/fe/src/components/cart/CouponInput.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { couponService } from '@/services/couponService';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface CouponError {
  code: string;
  message: string;
}

const COUPON_ERROR_MESSAGES: Record<string, string> = {
  COUPON_NOT_FOUND: 'Ma giam gia khong ton tai',
  COUPON_EXPIRED: 'Ma giam gia da het han su dung',
  COUPON_USAGE_LIMIT: 'Ma giam gia da het luot su dung',
  COUPON_MIN_ORDER: 'Don hang chua dat gia tri toi thieu',
  COUPON_ALREADY_USED: 'Ban da su dung ma giam gia nay roi',
  COUPON_INACTIVE: 'Ma giam gia chua duoc kich hoat',
};

export function CouponInput() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CouponError | null>(null);

  const { coupon, applyCoupon, removeCoupon, getSubtotal } = useCartStore();

  const handleApply = async () => {
    if (!code.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      const subtotal = getSubtotal();
      const result = await couponService.validate({
        code: code.trim().toUpperCase(),
        orderTotal: subtotal,
      });

      applyCoupon(result);
      setCode('');
    } catch (err: any) {
      const errorCode = err?.response?.data?.code || 'UNKNOWN';
      setError({
        code: errorCode,
        message:
          COUPON_ERROR_MESSAGES[errorCode] ||
          err?.response?.data?.message ||
          'Khong the ap dung ma giam gia. Vui long thu lai.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setCode('');
    setError(null);
  };

  // -- Da ap dung coupon: hien thi thong tin --
  if (coupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-green-50
                   border border-green-200 rounded-lg"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">
              {coupon.code}
            </p>
            <p className="text-xs text-green-600">
              Giam {coupon.discountType === 'PERCENTAGE'
                ? `${coupon.discountValue}%`
                : formatCurrency(coupon.discountValue)}
              {coupon.maxDiscount && coupon.discountType === 'PERCENTAGE' && (
                <span> (toi da {formatCurrency(coupon.maxDiscount)})</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleRemove}
          className="p-1 text-green-600 hover:text-red-500
                     hover:bg-red-50 rounded transition-colors flex-shrink-0"
          aria-label="Xoa ma giam gia"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  // -- Chua ap dung: form nhap --
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                          text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply();
            }}
            placeholder="Nhap ma giam gia"
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300
                       rounded-lg focus:outline-none focus:ring-2
                       focus:ring-primary-500 focus:border-primary-500
                       placeholder:text-gray-400 uppercase"
            disabled={isLoading}
            aria-label="Ma giam gia"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={!code.trim() || isLoading}
          className="whitespace-nowrap px-4"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Ap dung'
          )}
        </Button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 text-red-600"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">{error.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 3. CheckoutPage - Trang thanh toan

> File: `apps/fe/src/app/(customer)/checkout/page.tsx`
> Protected route (phai dang nhap).
> Multi-step form: Dia chi giao hang -> Phuong thuc thanh toan -> Xac nhan don hang.
> Sidebar hien thi tong quan don hang (luon hien thi tren desktop).
> Validation: react-hook-form + zod.

### 3.1 Checkout Schema (Zod)

```typescript
// apps/fe/src/lib/validations/checkout.ts
import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Ho ten phai co it nhat 2 ky tu')
    .max(100, 'Ho ten khong duoc qua 100 ky tu'),
  phone: z
    .string()
    .regex(/^(0[3-9])\d{8}$/, 'So dien thoai khong hop le (VD: 0912345678)'),
  provinceId: z.string().min(1, 'Vui long chon Tinh/Thanh pho'),
  districtId: z.string().min(1, 'Vui long chon Quan/Huyen'),
  wardId: z.string().min(1, 'Vui long chon Phuong/Xa'),
  street: z
    .string()
    .min(5, 'Dia chi cu the phai co it nhat 5 ky tu')
    .max(200, 'Dia chi khong duoc qua 200 ky tu'),
  note: z.string().max(500, 'Ghi chu khong duoc qua 500 ky tu').optional(),
});

export const paymentSchema = z.object({
  method: z.enum(['COD', 'BANK_TRANSFER'], {
    required_error: 'Vui long chon phuong thuc thanh toan',
  }),
});

export const checkoutSchema = z.object({
  address: addressSchema,
  payment: paymentSchema,
  useExistingAddress: z.boolean().default(false),
  existingAddressId: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
```

### 3.2 Hooks: useProvinces, useDistricts, useWards

```typescript
// apps/fe/src/hooks/useAddress.ts
import { useQuery } from '@tanstack/react-query';
import { addressService } from '@/services/addressService';

export function useProvinces() {
  return useQuery({
    queryKey: ['provinces'],
    queryFn: () => addressService.getProvinces(),
    staleTime: Infinity, // Tinh thanh khong thay doi
  });
}

export function useDistricts(provinceId: string | undefined) {
  return useQuery({
    queryKey: ['districts', provinceId],
    queryFn: () => addressService.getDistricts(provinceId!),
    enabled: !!provinceId,
    staleTime: Infinity,
  });
}

export function useWards(districtId: string | undefined) {
  return useQuery({
    queryKey: ['wards', districtId],
    queryFn: () => addressService.getWards(districtId!),
    enabled: !!districtId,
    staleTime: Infinity,
  });
}

export function useSavedAddresses() {
  return useQuery({
    queryKey: ['savedAddresses'],
    queryFn: () => addressService.getSavedAddresses(),
  });
}

export function useShippingFee(provinceId: string | undefined) {
  return useQuery({
    queryKey: ['shippingFee', provinceId],
    queryFn: () => addressService.calculateShippingFee(provinceId!),
    enabled: !!provinceId,
  });
}
```

### 3.3 CheckoutPage Component

```tsx
// apps/fe/src/app/(customer)/checkout/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CreditCard, ClipboardCheck, ChevronRight,
  ChevronLeft, Loader2, Check, AlertCircle,
} from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore } from '@/stores/useCartStore';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orderService';
import { formatCurrency } from '@/lib/utils';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations/checkout';
import { CheckoutAddressStep } from '@/components/checkout/CheckoutAddressStep';
import { CheckoutPaymentStep } from '@/components/checkout/CheckoutPaymentStep';
import { CheckoutConfirmStep } from '@/components/checkout/CheckoutConfirmStep';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const STEPS = [
  { id: 1, label: 'Dia chi giao hang', icon: MapPin },
  { id: 2, label: 'Thanh toan', icon: CreditCard },
  { id: 3, label: 'Xac nhan', icon: ClipboardCheck },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    items, coupon, shippingFee, setShippingFee, clearCart,
    getSubtotal, getDiscount, getTotal,
  } = useCartStore();

  // Redirect neu chua dang nhap
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/checkout`);
    }
  }, [user, authLoading, router]);

  // Redirect neu gio hang trong
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  const methods = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: {
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        provinceId: '',
        districtId: '',
        wardId: '',
        street: '',
        note: '',
      },
      payment: { method: 'COD' },
      useExistingAddress: false,
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, watch } = methods;

  // Tinh phi van chuyen khi chon tinh
  const provinceId = watch('address.provinceId');
  useEffect(() => {
    if (provinceId) {
      import('@/services/addressService').then(({ addressService }) => {
        addressService.calculateShippingFee(provinceId).then((fee) => {
          setShippingFee(fee);
        });
      });
    }
  }, [provinceId, setShippingFee]);

  // Chuyen buoc tiep theo (validate truoc khi chuyen)
  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger('address');
    } else if (currentStep === 2) {
      isValid = await trigger('payment');
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dat hang
  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: data.address,
        paymentMethod: data.payment.method,
        couponCode: coupon?.code || undefined,
        note: data.address.note || undefined,
      };

      const order = await orderService.create(orderData);

      clearCart();

      router.push(
        `/checkout/success?orderNumber=${order.orderNumber}&paymentMethod=${data.payment.method}`
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Dat hang that bai. Vui long thu lai.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* === STEP INDICATOR === */}
      <nav className="mb-8" aria-label="Checkout steps">
        <ol className="flex items-center justify-center gap-2 sm:gap-4">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    className={`hidden sm:block w-12 lg:w-24 h-0.5 transition-colors
                      ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}`}
                  />
                )}
                <li className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300 ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                          : isCompleted
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-600'
                        : isCompleted
                        ? 'text-gray-800'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* === COT TRAI: FORM STEPS === */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckoutAddressStep />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckoutPaymentStep />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckoutConfirmStep />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Quay lai
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="gap-2"
                  >
                    Tiep tuc
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 min-w-[160px]"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Dang xu ly...
                      </>
                    ) : (
                      'Dat hang'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* === COT PHAI: ORDER SUMMARY SIDEBAR === */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white rounded-xl border border-gray-200
                              shadow-sm p-6 lg:sticky lg:top-24">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Don hang cua ban
                </h3>

                {/* Danh sach san pham */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className="flex gap-3"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden
                                      bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500
                                         text-white rounded-full text-xs flex items-center
                                         justify-center font-medium">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-gray-500">{item.variantName}</p>
                        )}
                      </div>

                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Phan chia tien */}
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tam tinh</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>

                  {coupon && getDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giam gia ({coupon.code})</span>
                      <span>-{formatCurrency(getDiscount())}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Phi van chuyen</span>
                    <span>
                      {shippingFee > 0
                        ? formatCurrency(shippingFee)
                        : 'Mien phi'}
                    </span>
                  </div>
                </div>

                {/* Tong cong */}
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold">Tong cong</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(getTotal())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
```

### 3.4 CheckoutAddressStep - Buoc 1: Dia chi giao hang

```tsx
// apps/fe/src/components/checkout/CheckoutAddressStep.tsx
'use client';

import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MapPin, Plus, Check } from 'lucide-react';
import { CheckoutFormData } from '@/lib/validations/checkout';
import { useSavedAddresses, useProvinces, useDistricts, useWards } from '@/hooks/useAddress';
import { Button } from '@/components/ui/Button';

export function CheckoutAddressStep() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutFormData>();

  const useExisting = watch('useExistingAddress');
  const existingAddressId = watch('existingAddressId');
  const provinceId = watch('address.provinceId');
  const districtId = watch('address.districtId');

  const { data: savedAddresses = [] } = useSavedAddresses();
  const { data: provinces = [] } = useProvinces();
  const { data: districts = [] } = useDistricts(provinceId);
  const { data: wards = [] } = useWards(districtId);

  // Reset district/ward khi doi tinh
  useEffect(() => {
    setValue('address.districtId', '');
    setValue('address.wardId', '');
  }, [provinceId, setValue]);

  // Reset ward khi doi quan
  useEffect(() => {
    setValue('address.wardId', '');
  }, [districtId, setValue]);

  // Dien form tu dia chi da luu
  const handleSelectSavedAddress = (addressId: string) => {
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (addr) {
      setValue('existingAddressId', addressId);
      setValue('address.fullName', addr.fullName);
      setValue('address.phone', addr.phone);
      setValue('address.provinceId', addr.provinceId);
      // districtId va wardId set sau khi data load xong
      setTimeout(() => {
        setValue('address.districtId', addr.districtId);
        setTimeout(() => {
          setValue('address.wardId', addr.wardId);
        }, 100);
      }, 100);
      setValue('address.street', addr.street);
      setValue('address.note', addr.note || '');
    }
  };

  const addressErrors = errors.address;
  const inputClass = (fieldError?: any) =>
    `w-full px-4 py-3 border rounded-lg text-sm transition-colors
     focus:outline-none focus:ring-2 focus:ring-primary-500
     ${fieldError
       ? 'border-red-400 focus:ring-red-500'
       : 'border-gray-300 focus:border-primary-500'}`;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-primary-500" />
        Dia chi giao hang
      </h2>

      {/* === DIA CHI DA LUU === */}
      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Chon dia chi da luu:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => {
                  setValue('useExistingAddress', true);
                  handleSelectSavedAddress(addr.id);
                }}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  existingAddressId === addr.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{addr.fullName}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {addr.street}, {addr.wardName}, {addr.districtName},{' '}
                      {addr.provinceName}
                    </p>
                  </div>
                  {existingAddressId === addr.id && (
                    <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}

            {/* Nut them dia chi moi */}
            <button
              type="button"
              onClick={() => {
                setValue('useExistingAddress', false);
                setValue('existingAddressId', '');
                setValue('address.fullName', '');
                setValue('address.phone', '');
                setValue('address.provinceId', '');
                setValue('address.districtId', '');
                setValue('address.wardId', '');
                setValue('address.street', '');
                setValue('address.note', '');
              }}
              className={`p-4 rounded-lg border-2 border-dashed transition-all
                flex items-center justify-center gap-2 ${
                  !useExisting
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Dia chi moi</span>
            </button>
          </div>
        </div>
      )}

      {/* === FORM DIA CHI === */}
      <motion.div
        initial={false}
        animate={{
          opacity: useExisting && existingAddressId ? 0.6 : 1,
        }}
        className="space-y-4"
      >
        {/* Ho ten + Dien thoai */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ho va ten <span className="text-red-500">*</span>
            </label>
            <input
              {...register('address.fullName')}
              placeholder="Nguyen Van A"
              className={inputClass(addressErrors?.fullName)}
            />
            {addressErrors?.fullName && (
              <p className="mt-1 text-xs text-red-500">
                {addressErrors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              So dien thoai <span className="text-red-500">*</span>
            </label>
            <input
              {...register('address.phone')}
              placeholder="0912345678"
              type="tel"
              className={inputClass(addressErrors?.phone)}
            />
            {addressErrors?.phone && (
              <p className="mt-1 text-xs text-red-500">
                {addressErrors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Tinh/Thanh pho + Quan/Huyen */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tinh/Thanh pho <span className="text-red-500">*</span>
            </label>
            <select
              {...register('address.provinceId')}
              className={inputClass(addressErrors?.provinceId)}
              defaultValue=""
            >
              <option value="" disabled>
                -- Chon Tinh/Thanh pho --
              </option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {addressErrors?.provinceId && (
              <p className="mt-1 text-xs text-red-500">
                {addressErrors.provinceId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quan/Huyen <span className="text-red-500">*</span>
            </label>
            <select
              {...register('address.districtId')}
              className={inputClass(addressErrors?.districtId)}
              disabled={!provinceId}
              defaultValue=""
            >
              <option value="" disabled>
                -- Chon Quan/Huyen --
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {addressErrors?.districtId && (
              <p className="mt-1 text-xs text-red-500">
                {addressErrors.districtId.message}
              </p>
            )}
          </div>
        </div>

        {/* Phuong/Xa */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phuong/Xa <span className="text-red-500">*</span>
            </label>
            <select
              {...register('address.wardId')}
              className={inputClass(addressErrors?.wardId)}
              disabled={!districtId}
              defaultValue=""
            >
              <option value="" disabled>
                -- Chon Phuong/Xa --
              </option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {addressErrors?.wardId && (
              <p className="mt-1 text-xs text-red-500">
                {addressErrors.wardId.message}
              </p>
            )}
          </div>

          {/* Dia chi cu the */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dia chi cu the <span className="text-red-500">*</span>
            </label>
            <input
              {...register('address.street')}
              placeholder="So nha, ten duong, toa nha..."
              className={inputClass(addressErrors?.street)}
            />
            {addressErrors?.street && (
              <p className="mt-1 text-xs text-red-500">
                {addressErrors.street.message}
              </p>
            )}
          </div>
        </div>

        {/* Ghi chu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ghi chu (tuy chon)
          </label>
          <textarea
            {...register('address.note')}
            rows={3}
            placeholder="VD: Giao gio hanh chinh, goi truoc khi giao..."
            className={`${inputClass(addressErrors?.note)} resize-none`}
          />
        </div>
      </motion.div>
    </div>
  );
}
```

### 3.5 CheckoutPaymentStep - Buoc 2: Phuong thuc thanh toan

```tsx
// apps/fe/src/components/checkout/CheckoutPaymentStep.tsx
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  CreditCard, Banknote, Building2, QrCode, AlertCircle,
} from 'lucide-react';
import { CheckoutFormData } from '@/lib/validations/checkout';
import { BankTransferInfo } from '@/components/checkout/BankTransferInfo';
import { useCartStore } from '@/stores/useCartStore';

const PAYMENT_METHODS = [
  {
    value: 'COD' as const,
    label: 'Thanh toan khi nhan hang (COD)',
    description: 'Thanh toan bang tien mat khi nhan duoc hang',
    icon: Banknote,
  },
  {
    value: 'BANK_TRANSFER' as const,
    label: 'Chuyen khoan ngan hang',
    description: 'Chuyen khoan qua tai khoan ngan hang',
    icon: Building2,
  },
];

export function CheckoutPaymentStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutFormData>();

  const selectedMethod = watch('payment.method');
  const { getTotal } = useCartStore();
  const total = getTotal();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-primary-500" />
        Phuong thuc thanh toan
      </h2>

      {/* Danh sach phuong thuc */}
      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.value;
          const Icon = method.icon;

          return (
            <motion.button
              key={method.value}
              type="button"
              onClick={() => setValue('payment.method', method.value)}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-4 sm:p-5 rounded-xl border-2
                transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio visual */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center
                    justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'border-primary-500'
                        : 'border-gray-300'
                    }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-primary-500"
                    />
                  )}
                </div>

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center
                    flex-shrink-0 ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Thong tin */}
                <div>
                  <p
                    className={`font-medium ${
                      isSelected ? 'text-primary-700' : 'text-gray-800'
                    }`}
                  >
                    {method.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {method.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Error */}
      {errors.payment?.method && (
        <div className="flex items-center gap-2 mt-3 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{errors.payment.method.message}</p>
        </div>
      )}

      {/* Hien thi thong tin chuyen khoan neu chon Bank Transfer */}
      {selectedMethod === 'BANK_TRANSFER' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6"
        >
          <BankTransferInfo amount={total} isPreview />
        </motion.div>
      )}
    </div>
  );
}
```

### 3.6 CheckoutConfirmStep - Buoc 3: Xac nhan don hang

```tsx
// apps/fe/src/components/checkout/CheckoutConfirmStep.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import { ClipboardCheck, MapPin, CreditCard, Edit2 } from 'lucide-react';
import { CheckoutFormData } from '@/lib/validations/checkout';
import { useCartStore } from '@/stores/useCartStore';
import { useProvinces, useDistricts, useWards } from '@/hooks/useAddress';
import { formatCurrency } from '@/lib/utils';

export function CheckoutConfirmStep() {
  const { watch } = useFormContext<CheckoutFormData>();
  const formData = watch();
  const { items, coupon, shippingFee, getSubtotal, getDiscount, getTotal } =
    useCartStore();

  const { data: provinces = [] } = useProvinces();
  const { data: districts = [] } = useDistricts(formData.address.provinceId);
  const { data: wards = [] } = useWards(formData.address.districtId);

  const provinceName =
    provinces.find((p) => p.id === formData.address.provinceId)?.name || '';
  const districtName =
    districts.find((d) => d.id === formData.address.districtId)?.name || '';
  const wardName =
    wards.find((w) => w.id === formData.address.wardId)?.name || '';

  const paymentLabel =
    formData.payment.method === 'COD'
      ? 'Thanh toan khi nhan hang (COD)'
      : 'Chuyen khoan ngan hang';

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6 text-primary-500" />
        Xac nhan don hang
      </h2>

      <div className="space-y-6">
        {/* --- Dia chi giao hang --- */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" />
              Dia chi giao hang
            </h3>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">
              {formData.address.fullName} | {formData.address.phone}
            </p>
            <p>
              {formData.address.street}, {wardName}, {districtName},{' '}
              {provinceName}
            </p>
            {formData.address.note && (
              <p className="text-gray-500 italic">
                Ghi chu: {formData.address.note}
              </p>
            )}
          </div>
        </div>

        {/* --- Phuong thuc thanh toan --- */}
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary-500" />
              Phuong thuc thanh toan
            </h3>
          </div>
          <p className="text-sm text-gray-600">{paymentLabel}</p>
        </div>

        {/* --- Danh sach san pham --- */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            San pham ({items.length})
          </h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden
                                bg-white flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">
                    {item.name}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-gray-500">{item.variantName}</p>
                  )}
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-gray-700
                               whitespace-nowrap self-center">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Chi tiet tien */}
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tam tinh</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            {coupon && getDiscount() > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giam gia ({coupon.code})</span>
                <span>-{formatCurrency(getDiscount())}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Phi van chuyen</span>
              <span>
                {shippingFee > 0 ? formatCurrency(shippingFee) : 'Mien phi'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2
                            border-t border-gray-200">
              <span>Tong cong</span>
              <span className="text-primary-600">
                {formatCurrency(getTotal())}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. BankTransferInfo - Thong tin chuyen khoan

> File: `apps/fe/src/components/checkout/BankTransferInfo.tsx`
> Hien thi thong tin tai khoan ngan hang, so tien, noi dung chuyen khoan, ma QR.
> Duoc su dung trong CheckoutPaymentStep (preview) va CheckoutSuccessPage (full).

```tsx
// apps/fe/src/components/checkout/BankTransferInfo.tsx
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, QrCode, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

// Config ngan hang - co the lay tu API hoac env
const BANK_CONFIG = {
  bankName: 'Ngan hang TMCP Ngoai Thuong Viet Nam (Vietcombank)',
  accountNumber: '0123456789',
  accountHolder: 'CONG TY TNHH NOI THAT FURNITURE VN',
  branch: 'Chi nhanh Ho Chi Minh',
};

interface BankTransferInfoProps {
  amount: number;
  orderNumber?: string;
  isPreview?: boolean;
}

export function BankTransferInfo({
  amount,
  orderNumber,
  isPreview = false,
}: BankTransferInfoProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const transferContent = orderNumber
    ? `FV ${orderNumber}`
    : 'FV [Ma don hang]';

  // QR code URL (su dung VietQR API)
  const qrCodeUrl = useMemo(() => {
    if (!orderNumber) return null;
    // VietQR format: https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount=X&addInfo=Y
    const bankId = 'VCB'; // Vietcombank
    return (
      `https://img.vietqr.io/image/${bankId}-${BANK_CONFIG.accountNumber}` +
      `-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}` +
      `&accountName=${encodeURIComponent(BANK_CONFIG.accountHolder)}`
    );
  }, [amount, orderNumber, transferContent]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Da sao chep!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Khong the sao chep. Vui long copy thu cong.');
    }
  };

  const InfoRow = ({
    label,
    value,
    copyable = false,
    fieldKey,
    highlight = false,
  }: {
    label: string;
    value: string;
    copyable?: boolean;
    fieldKey?: string;
    highlight?: boolean;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4
                    py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 sm:w-40 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={`text-sm font-medium break-all ${
            highlight ? 'text-primary-600 text-base' : 'text-gray-800'
          }`}
        >
          {value}
        </span>
        {copyable && fieldKey && (
          <button
            type="button"
            onClick={() => handleCopy(value, fieldKey)}
            className="p-1.5 text-gray-400 hover:text-primary-500
                       hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
            aria-label={`Sao chep ${label}`}
          >
            {copiedField === fieldKey ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${
        isPreview
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-white shadow-sm'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Thong tin chuyen khoan
        </h3>
      </div>

      <div className="p-5">
        <div className="lg:flex lg:gap-6">
          {/* Thong tin ngan hang */}
          <div className="flex-1">
            <InfoRow
              label="Ngan hang"
              value={BANK_CONFIG.bankName}
            />
            <InfoRow
              label="So tai khoan"
              value={BANK_CONFIG.accountNumber}
              copyable
              fieldKey="accountNumber"
            />
            <InfoRow
              label="Chu tai khoan"
              value={BANK_CONFIG.accountHolder}
              copyable
              fieldKey="accountHolder"
            />
            <InfoRow
              label="So tien"
              value={formatCurrency(amount)}
              copyable
              fieldKey="amount"
              highlight
            />
            <InfoRow
              label="Noi dung CK"
              value={transferContent}
              copyable
              fieldKey="transferContent"
              highlight
            />
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="mt-4 lg:mt-0 flex flex-col items-center">
              <div className="relative w-48 h-48 bg-white rounded-xl
                              border border-gray-200 overflow-hidden">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code chuyen khoan"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Quet ma QR de chuyen khoan
              </p>
            </div>
          )}
        </div>

        {/* Luu y */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg
                        flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-medium">Luu y quan trong:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                Vui long nhap chinh xac noi dung chuyen khoan:{' '}
                <strong>{transferContent}</strong>
              </li>
              <li>Don hang se duoc xu ly sau khi admin xac nhan thanh toan</li>
              <li>Thoi gian xac nhan: trong vong 1-2 gio lam viec</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 5. CheckoutSuccessPage - Dat hang thanh cong

> File: `apps/fe/src/app/(customer)/checkout/success/page.tsx`
> Hien thi thong bao dat hang thanh cong, ma don hang, tom tat don hang.
> Neu bank transfer: hien thi lai thong tin chuyen khoan.
> Animation thanh cong, cac nut dieu huong.

```tsx
// apps/fe/src/app/(customer)/checkout/success/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, Package, ArrowRight, ShoppingBag,
  CreditCard, Truck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BankTransferInfo } from '@/components/checkout/BankTransferInfo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const paymentMethod = searchParams.get('paymentMethod');

  // Lay thong tin don hang
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => orderService.getByOrderNumber(orderNumber!),
    enabled: !!orderNumber,
  });

  // Confetti effect (optional)
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!orderNumber) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Khong tim thay thong tin don hang</p>
          <Link href="/">
            <Button>Ve trang chu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* === ICON THANH CONG + ANIMATION === */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="text-center mb-8"
      >
        {/* Vong tron nen */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          {/* Pulse ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: 2,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full bg-green-400"
          />

          {/* Icon chinh */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            className="absolute inset-0 rounded-full bg-green-100
                       flex items-center justify-center"
          >
            <CheckCircle className="w-14 h-14 text-green-500" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl sm:text-3xl font-bold text-gray-800"
        >
          Dat hang thanh cong!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 mt-2"
        >
          Cam on ban da mua hang tai Furniture VN
        </motion.p>
      </motion.div>

      {/* === THONG TIN DON HANG === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        {/* Ma don hang */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5
                        text-center">
          <p className="text-sm text-primary-600 mb-1">Ma don hang</p>
          <p className="text-2xl font-bold text-primary-700 font-mono">
            {orderNumber}
          </p>
          <p className="text-xs text-primary-500 mt-2">
            Chung toi da gui email xac nhan don hang den dia chi email cua ban
          </p>
        </div>

        {/* Tom tat don hang */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : order ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm
                          divide-y divide-gray-100">
            {/* San pham */}
            <div className="p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-500" />
                San pham da dat
              </h3>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.productName}
                      {item.variantName && ` - ${item.variantName}`}
                      <span className="text-gray-400"> x{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thanh tien */}
            <div className="p-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tam tinh</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giam gia</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Phi van chuyen</span>
                <span>
                  {order.shippingFee > 0
                    ? formatCurrency(order.shippingFee)
                    : 'Mien phi'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2
                              border-t border-gray-200">
                <span>Tong cong</span>
                <span className="text-primary-600">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            {/* Dia chi + Thanh toan */}
            <div className="p-5 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="font-medium text-gray-800 mb-1 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> Giao den
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-gray-500 text-xs">
                  {order.shippingAddress.street},{' '}
                  {order.shippingAddress.wardName},{' '}
                  {order.shippingAddress.districtName},{' '}
                  {order.shippingAddress.provinceName}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" /> Thanh toan
                </p>
                <p className="text-gray-600">
                  {order.paymentMethod === 'COD'
                    ? 'Thanh toan khi nhan hang'
                    : 'Chuyen khoan ngan hang'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* === THONG TIN CHUYEN KHOAN (neu bank transfer) === */}
        {paymentMethod === 'BANK_TRANSFER' && order && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <BankTransferInfo
              amount={order.total}
              orderNumber={orderNumber}
            />
          </motion.div>
        )}

        {/* === CAC NUT DIEU HUONG === */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-3 pt-4"
        >
          <Link href={`/orders/${order?.id || ''}`} className="flex-1">
            <Button className="w-full gap-2" size="lg">
              <Package className="w-5 h-5" />
              Theo doi don hang
            </Button>
          </Link>

          <Link href="/products" className="flex-1">
            <Button variant="outline" className="w-full gap-2" size="lg">
              <ShoppingBag className="w-5 h-5" />
              Tiep tuc mua sam
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
```

---

## Tong ket cac file va component

| Component | File | Chuc nang |
|-----------|------|-----------|
| `CartPage` | `app/(customer)/cart/page.tsx` | Trang gio hang: table (desktop) / card (mobile), AnimatePresence |
| `QuantityInput` | `components/ui/QuantityInput.tsx` | Tang/giam so luong, min/max, accessible |
| `CouponInput` | `components/cart/CouponInput.tsx` | Nhap/validate/hien thi ma giam gia |
| `CheckoutPage` | `app/(customer)/checkout/page.tsx` | Multi-step checkout, protected route |
| `CheckoutAddressStep` | `components/checkout/CheckoutAddressStep.tsx` | Form dia chi, chon dia chi da luu, cascading selects |
| `CheckoutPaymentStep` | `components/checkout/CheckoutPaymentStep.tsx` | Chon COD hoac Bank Transfer |
| `CheckoutConfirmStep` | `components/checkout/CheckoutConfirmStep.tsx` | Review don hang truoc khi dat |
| `BankTransferInfo` | `components/checkout/BankTransferInfo.tsx` | Thong tin ngan hang, QR code VietQR, copy-to-clipboard |
| `CheckoutSuccessPage` | `app/(customer)/checkout/success/page.tsx` | Thanh cong animation, tom tat, huong dan chuyen khoan |
| `useCartStore` | `stores/useCartStore.ts` | Zustand store, persist localStorage |
| `useAddress` hooks | `hooks/useAddress.ts` | Provinces/districts/wards cascading, shipping fee |
| Checkout validation | `lib/validations/checkout.ts` | Zod schemas cho address + payment |

> **Luu y**: Tat ca components deu responsive (mobile-first), ho tro accessibility (aria-label, role),
> va su dung Framer Motion cho animation muot ma.
