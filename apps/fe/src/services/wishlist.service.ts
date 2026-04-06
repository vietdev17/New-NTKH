import api from '@/lib/api';
import type { Product } from '@/types';

export const wishlistService = {
  getWishlist: async (): Promise<Product[]> => {
    const { data } = await api.get('/wishlist');
    return data;
  },
  addToWishlist: async (productId: string): Promise<void> => {
    await api.post(`/wishlist/${productId}`);
  },
  removeFromWishlist: async (productId: string): Promise<void> => {
    await api.delete(`/wishlist/${productId}`);
  },
};
