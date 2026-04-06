import api from '@/lib/api';
import type { Order, CreateOrderDto, QueryParams } from '@/types';

export const orderService = {
  getMyOrders: async (params?: QueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/orders/my-orders', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },
  getMyOrderById: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/orders/my-orders/${id}`);
    return data;
  },
  createOrder: async (payload: CreateOrderDto): Promise<Order> => {
    const { data } = await api.post('/orders', payload);
    return data;
  },
  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const { data } = await api.patch(`/orders/${id}/cancel`, { reason });
    return data;
  },
  // Admin
  getAllOrders: async (params?: QueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/orders', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  updateOrderStatus: async (id: string, status: string, note?: string): Promise<Order> => {
    const { data } = await api.patch(`/orders/${id}/status`, { status, note });
    return data;
  },
  assignShipper: async (orderId: string, shipperId: string): Promise<Order> => {
    const { data } = await api.patch(`/orders/${orderId}/assign-shipper`, { shipperId });
    return data;
  },
  getOrders: async (params?: QueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/orders', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getOrderByCode: async (code: string): Promise<Order | null> => {
    try {
      const { data } = await api.get(`/orders/code/${code}`);
      return data;
    } catch {
      return null;
    }
  },
  // Shipper location
  getShipperLocation: async (orderId: string): Promise<{ lat: number; lng: number; updatedAt: string } | null> => {
    try {
      const { data } = await api.get(`/orders/${orderId}/shipper-location`);
      return data;
    } catch {
      return null;
    }
  },
  // POS
  createPosOrder: async (payload: any): Promise<Order> => {
    const { data } = await api.post('/orders/pos', payload);
    return data;
  },
};
