import api from '@/lib/api';
import type { Review, ReviewSummary, QueryParams } from '@/types';

export const reviewService = {
  getProductReviews: async (productId: string, params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get(`/reviews/product/${productId}`, { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getProductReviewSummary: async (productId: string): Promise<ReviewSummary> => {
    const { data } = await api.get(`/reviews/product/${productId}/summary`);
    return data;
  },
  getMyReviews: async (params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get('/reviews/my-reviews', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  createReview: async (payload: { productId: string; orderId: string; rating: number; comment: string; images?: string[] }): Promise<Review> => {
    const { data } = await api.post('/reviews', payload);
    return data;
  },
  updateReview: async (id: string, payload: { rating?: number; comment?: string; images?: string[] }): Promise<Review> => {
    const { data } = await api.patch(`/reviews/${id}`, payload);
    return data;
  },
  deleteReview: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
  // Admin
  getReviews: async (params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get('/reviews', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getAllReviews: async (params?: QueryParams): Promise<{ data: Review[]; meta: any }> => {
    const response = await api.get('/reviews', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  approveReview: async (id: string): Promise<Review> => {
    const { data } = await api.patch(`/reviews/${id}/moderate`, { status: 'approved' });
    return data;
  },
  rejectReview: async (id: string): Promise<Review> => {
    const { data } = await api.patch(`/reviews/${id}/moderate`, { status: 'rejected' });
    return data;
  },
  moderateReview: async (id: string, status: 'approved' | 'rejected', adminReply?: string): Promise<Review> => {
    const { data } = await api.patch(`/reviews/${id}/moderate`, { status, adminReply });
    return data;
  },
};
