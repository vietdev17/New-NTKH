import api from '@/lib/api';
import type { Shift, QueryParams } from '@/types';

export const shiftService = {
  openShift: async (payload: number | { openingBalance: number }): Promise<Shift> => {
    const openingBalance = typeof payload === 'number' ? payload : payload.openingBalance;
    const { data } = await api.post('/shifts/open', { openingBalance });
    return data;
  },
  closeShift: async (id: string, payload: number | { closingBalance: number; note?: string }): Promise<Shift> => {
    const body = typeof payload === 'number' ? { closingBalance: payload } : payload;
    const { data } = await api.patch(`/shifts/${id}/close`, body);
    return data;
  },
  getMyShifts: async (params?: QueryParams): Promise<{ data: Shift[]; meta: any }> => {
    const response = await api.get('/shifts/my-shifts', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getCurrentShift: async (): Promise<Shift | null> => {
    try {
      const { data } = await api.get('/shifts/current');
      return data;
    } catch {
      return null;
    }
  },
  getShifts: async (params?: QueryParams): Promise<{ data: Shift[]; meta: any }> => {
    const response = await api.get('/shifts', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getShiftById: async (id: string): Promise<Shift> => {
    const { data } = await api.get(`/shifts/${id}`);
    return data;
  },
};
