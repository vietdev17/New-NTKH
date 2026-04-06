import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Shift } from '@/types/shift.type';

interface PosCartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantLabel?: string;
}

interface PosCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

interface SelectedCustomer {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

interface PosState {
  currentShift: Shift | null;
  cart: PosCartItem[];
  coupon: PosCoupon | null;
  selectedCustomerId: string | null;
  selectedCustomer: SelectedCustomer | null;
  paymentMethod: 'cash' | 'bank_transfer';
  // Shift
  setCurrentShift: (shift: Shift | null) => void;
  setShift: (shift: Shift | null) => void;
  // Cart
  addToCart: (item: PosCartItem) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  // Coupon
  applyCoupon: (coupon: PosCoupon) => void;
  removeCoupon: () => void;
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getCartTotal: () => number;
  // Customer
  setCustomer: (customerId: string | null) => void;
  setSelectedCustomer: (customer: SelectedCustomer | null) => void;
  setPaymentMethod: (method: 'cash' | 'bank_transfer') => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      currentShift: null,
      cart: [],
      coupon: null,
      selectedCustomerId: null,
      selectedCustomer: null,
      paymentMethod: 'cash',

      setCurrentShift: (shift) => set({ currentShift: shift }),
      setShift: (shift) => set({ currentShift: shift }),

      addToCart: (item) =>
        set((state) => {
          const key = `${item.productId}-${item.variantId || ''}`;
          const existing = state.cart.find((i) => `${i.productId}-${i.variantId || ''}` === key);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                `${i.productId}-${i.variantId || ''}` === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),

      removeFromCart: (productId, variantId) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((i) => !(i.productId === productId && i.variantId === variantId))
            : state.cart.map((i) =>
                i.productId === productId && i.variantId === variantId
                  ? { ...i, quantity }
                  : i
              ),
        })),

      updateCartQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((i) => !(i.productId === productId && i.variantId === variantId))
            : state.cart.map((i) =>
                i.productId === productId && i.variantId === variantId
                  ? { ...i, quantity }
                  : i
              ),
        })),

      clearCart: () => set({ cart: [], coupon: null, selectedCustomerId: null, selectedCustomer: null }),

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getSubtotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getTotal: () => {
        const subtotal = get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const coupon = get().coupon;
        if (!coupon) return subtotal;
        const discount = coupon.type === 'percentage'
          ? subtotal * (coupon.value / 100)
          : coupon.value;
        return Math.max(0, subtotal - discount);
      },
      getCartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

      setCustomer: (customerId) => set({ selectedCustomerId: customerId, selectedCustomer: null }),
      setSelectedCustomer: (customer: SelectedCustomer | null) => set({
        selectedCustomerId: customer?._id || null,
        selectedCustomer: customer,
      }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
    }),
    { name: 'furniture-pos-storage', storage: createJSONStorage(() => sessionStorage) }
  )
);
