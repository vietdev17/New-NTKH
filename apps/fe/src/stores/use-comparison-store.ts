import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ComparisonState {
  productIds: string[];
  addProduct: (id: string) => boolean;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  clear: () => void;
  isComparing: (productId: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      productIds: [],
      addProduct: (id) => {
        if (get().productIds.length >= 4) return false;
        if (get().productIds.includes(id)) return false;
        set((state) => ({ productIds: [...state.productIds, id] }));
        return true;
      },
      removeProduct: (productId) =>
        set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),
      clearAll: () => set({ productIds: [] }),
      clear: () => set({ productIds: [] }),
      isComparing: (productId) => get().productIds.includes(productId),
    }),
    { name: 'furniture-comparison-storage', storage: createJSONStorage(() => sessionStorage) }
  )
);
