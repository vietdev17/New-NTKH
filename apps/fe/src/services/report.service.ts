import api from '@/lib/api';
import type { DashboardStats, RevenueReport, ProductReport, CustomerReport } from '@/types';

export const reportService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/reports/dashboard');
    return data;
  },
  getRevenueReport: async (params: { startDate: string; endDate: string; groupBy?: 'day' | 'week' | 'month' }): Promise<RevenueReport[]> => {
    const { data } = await api.get('/reports/revenue', { params });
    return data;
  },
  getProductReport: async (params?: { limit?: number; startDate?: string; endDate?: string }): Promise<ProductReport[]> => {
    const { data } = await api.get('/reports/products', { params });
    return data;
  },
  getCustomerReport: async (params?: { startDate?: string; endDate?: string }): Promise<CustomerReport> => {
    const { data } = await api.get('/reports/customers', { params });
    return data;
  },
  getDashboard: async (): Promise<any> => {
    const { data } = await api.get('/reports/dashboard');
    return data;
  },
  getPosReport: async (): Promise<any> => {
    const { data } = await api.get('/reports/pos/today');
    return data;
  },
};
