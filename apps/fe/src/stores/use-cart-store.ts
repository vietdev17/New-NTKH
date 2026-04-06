import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/cart.type';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,

      addItem: (item) =>
        set((state) => {
          const key = `${item.productId}-${item.variantId || ''}`;
          const existing = state.items.find(
            (i) => `${i.productId}-${i.variantId || ''}` === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                `${i.productId}-${i.variantId || ''}` === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === (variantId || i.variantId))
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => !(i.productId === productId && i.variantId === (variantId || i.variantId)))
            : state.items.map((i) =>
                i.productId === productId && i.variantId === (variantId || i.variantId)
                  ? { ...i, quantity }
                  : i
              ),
        })),

      clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= 2000000 ? 0 : subtotal >= 500000 ? 30000 : 50000;
      },
      getTotal: () => get().getSubtotal() + get().getShippingFee() - get().couponDiscount,
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'furniture-cart-storage' }
  )
);
