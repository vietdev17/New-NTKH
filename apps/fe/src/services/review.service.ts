import api from '@/lib/api';
import type { Review, ReviewSummary, QueryParams } from '@/types';

export const reviewService = {
  getProductReviews: async (productId: string, params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get(`/reviews/product/${productId}`, { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getProductReviewStats: async (productId: string): Promise<ReviewSummary> => {
    const { data } = await api.get(`/reviews/product/${productId}/stats`);
    return data;
  },
  canReview: async (productId: string) => {
    const { data } = await api.get(`/reviews/can-review/${productId}`);
    return data;
  },
  getMyReviews: async (params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get('/reviews/my-reviews', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  createReview: async (payload: { productId: string; orderId: string; rating: number; title?: string; comment?: string; images?: string[] }): Promise<Review> => {
    const { data } = await api.post('/reviews', payload);
    return data;
  },
  updateReview: async (id: string, payload: { rating?: number; title?: string; comment?: string; images?: string[] }): Promise<Review> => {
    const { data } = await api.patch(`/reviews/${id}`, payload);
    return data;
  },
  deleteReview: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
  voteHelpful: async (id: string, isHelpful: boolean): Promise<Review> => {
    const { data } = await api.post(`/reviews/${id}/helpful`, { isHelpful });
    return data;
  },
  // Admin
  getReviews: async (params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get('/reviews', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  moderateReview: async (id: string, status: 'approved' | 'rejected' | 'flagged', adminNote?: string): Promise<Review> => {
    const { data } = await api.patch(`/reviews/${id}/moderate`, { status, adminNote });
    return data;
  },
};
