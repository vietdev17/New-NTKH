import api from '@/lib/api';
import type { Coupon, CouponValidation, QueryParams } from '@/types';

export const couponService = {
  validateCoupon: async (code: string, orderTotal: number): Promise<CouponValidation> => {
    const { data } = await api.post('/coupons/validate', { code, orderTotal });
    return data;
  },
  // Admin
  getCoupons: async (params?: QueryParams): Promise<{ data: Coupon[]; meta: any }> => {
    const response = await api.get('/coupons', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getAllCoupons: async (params?: QueryParams): Promise<{ data: Coupon[]; meta: any }> => {
    const response = await api.get('/coupons', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getCouponById: async (id: string): Promise<Coupon> => {
    const { data } = await api.get(`/coupons/${id}`);
    return data;
  },
  createCoupon: async (payload: any): Promise<Coupon> => {
    const { data } = await api.post('/coupons', payload);
    return data;
  },
  updateCoupon: async (id: string, payload: any): Promise<Coupon> => {
    const { data } = await api.patch(`/coupons/${id}`, payload);
    return data;
  },
  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/coupons/${id}`);
  },
};
