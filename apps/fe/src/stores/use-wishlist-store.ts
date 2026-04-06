import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  isWished: (productId: string) => boolean;
  clear: () => void;
  setProductIds: (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isWished: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
      setProductIds: (ids) => set({ productIds: ids }),
    }),
    { name: 'furniture-wishlist-storage' }
  )
);
