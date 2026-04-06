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
