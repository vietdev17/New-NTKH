import api from '@/lib/api';
import type { ReturnRequest, QueryParams } from '@/types';

export const returnService = {
  createReturn: async (payload: {
    orderId: string;
    items: { productName: string; quantity: number; price: number; reason: string }[];
    reason: string;
    description: string;
    images?: string[];
  }): Promise<ReturnRequest> => {
    const { data } = await api.post('/returns', payload);
    return data;
  },
  getMyReturns: async (params?: QueryParams): Promise<{ data: ReturnRequest[]; meta: any }> => {
    const response = await api.get('/returns/my-returns', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  // Admin
  getAllReturns: async (params?: QueryParams): Promise<{ data: ReturnRequest[]; meta: any }> => {
    const response = await api.get('/returns', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getReturnById: async (id: string): Promise<ReturnRequest> => {
    const { data } = await api.get(`/returns/${id}`);
    return data;
  },
  processReturn: async (id: string, payload: { status: 'approved' | 'rejected'; adminNote?: string; refundAmount?: number }): Promise<ReturnRequest> => {
    const { data } = await api.patch(`/returns/${id}/process`, payload);
    return data;
  },
};
