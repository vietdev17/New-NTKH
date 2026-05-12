import api from '@/lib/api';
import type { User, Address, QueryParams } from '@/types';

export const userService = {
  updateProfile: async (payload: { fullName?: string; phone?: string; avatar?: string }): Promise<User> => {
    const { data } = await api.patch('/users/profile', payload);
    return data;
  },
  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const { data } = await api.patch('/users/change-password', payload);
    return data;
  },
  addAddress: async (address: Address): Promise<User> => {
    const { data } = await api.post('/users/addresses', address);
    return data;
  },
  updateAddress: async (id: string | number, address: any): Promise<User> => {
    const { data } = await api.patch(`/users/addresses/${id}`, address);
    return data;
  },
  deleteAddress: async (id: string | number): Promise<User> => {
    const { data } = await api.delete(`/users/addresses/${id}`);
    return data;
  },
  setDefaultAddress: async (id: string | number): Promise<User> => {
    const { data } = await api.patch(`/users/addresses/${id}/default`);
    return data;
  },
  // Admin - aliases
  getCustomers: async (params?: QueryParams): Promise<{ data: User[]; meta: any }> => {
    const response = await api.get('/customers', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getStaff: async (params?: QueryParams): Promise<{ data: User[]; meta: any }> => {
    const response = await api.get('/users/staff', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getAllCustomers: async (params?: QueryParams): Promise<{ data: User[]; meta: any }> => {
    const response = await api.get('/customers', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getCustomerById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },
  findCustomerByPhone: async (phone: string): Promise<User | null> => {
    try {
      const { data } = await api.get(`/customers/phone/${phone}`);
      return data;
    } catch {
      return null;
    }
  },
  searchCustomers: async (keyword: string): Promise<User[]> => {
    try {
      const response = await api.get('/customers', { params: { search: keyword, limit: 10 } });
      return response.data || [];
    } catch {
      return [];
    }
  },
  createCustomer: async (payload: { fullName: string; phone?: string; email?: string }): Promise<User> => {
    const { data } = await api.post('/customers', payload);
    return data;
  },
  updateCustomer: async (id: string, payload: { fullName?: string; phone?: string; email?: string; isActive?: boolean }): Promise<User> => {
    const { data } = await api.patch(`/customers/${id}`, payload);
    return data;
  },
  getCustomerStats: async (id: string) => {
    const { data } = await api.get(`/customers/${id}/stats`);
    return data;
  },
  getCustomerOrders: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/customers/${id}/orders`, { params });
    return { items: response.data, meta: (response as any).meta || {} };
  },
  // Admin address management
  addCustomerAddress: async (customerId: string, address: any) => {
    const { data } = await api.post(`/customers/${customerId}/addresses`, address);
    return data;
  },
  updateCustomerAddress: async (customerId: string, index: number, address: any) => {
    const { data } = await api.patch(`/customers/${customerId}/addresses/${index}`, address);
    return data;
  },
  deleteCustomerAddress: async (customerId: string, index: number) => {
    const { data } = await api.delete(`/customers/${customerId}/addresses/${index}`);
    return data;
  },
  setCustomerDefaultAddress: async (customerId: string, index: number) => {
    const { data } = await api.patch(`/customers/${customerId}/addresses/${index}/default`);
    return data;
  },
  // Loyalty
  addLoyaltyPoints: async (customerId: string, points: number, reason: string) => {
    const { data } = await api.post(`/customers/${customerId}/loyalty/add`, { points, reason });
    return data;
  },
  deductLoyaltyPoints: async (customerId: string, points: number, reason: string) => {
    const { data } = await api.post(`/customers/${customerId}/loyalty/deduct`, { points, reason });
    return data;
  },
  // Staff
  getAllStaff: async (params?: QueryParams): Promise<{ data: User[]; meta: any }> => {
    const response = await api.get('/users/staff', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  createStaff: async (payload: any): Promise<User> => {
    const { data } = await api.post('/users/staff', payload);
    return data;
  },
  updateStaff: async (id: string, payload: any): Promise<User> => {
    const { data } = await api.patch(`/users/staff/${id}`, payload);
    return data;
  },
  deleteStaff: async (id: string): Promise<void> => {
    await api.delete(`/users/staff/${id}`);
  },
};
