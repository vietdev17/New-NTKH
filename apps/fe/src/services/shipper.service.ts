import api from '@/lib/api';
import type { Shipper, QueryParams, Order } from '@/types';

export const shipperService = {
  getMyDeliveries: async (params?: QueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/shipper/orders/my-orders', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  updateDeliveryStatus: async (orderId: string, status: string, proofPhoto?: string, note?: string): Promise<Order> => {
    const { data } = await api.post(`/shipper/orders/${orderId}/deliver`, { proofImage: proofPhoto, note });
    return data;
  },
  updateLocation: async (lat: number, lng: number): Promise<void> => {
    await api.post('/shipper/location', { lat, lng });
  },
  getEarnings: async (period?: 'day' | 'week' | 'month'): Promise<any> => {
    const { data } = await api.get('/shipper/earnings', { params: { period } });
    return data;
  },
  getDeliveryHistory: async (params?: QueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/shipper/orders/my-orders', { params: { ...params, status: 'delivered' } });
    return { data: response.data, meta: (response as any).meta };
  },
  updateAvailability: async (isAvailable: boolean): Promise<void> => {
    await api.patch('/shipper/status', { status: isAvailable ? 'available' : 'offline' });
  },
  getMyDashboard: async (): Promise<any> => {
    const { data } = await api.get('/shipper/dashboard');
    // Dashboard also wraps in { success, data }
    const d = (data as any);
    return d?.data ?? d;
  },
  getMyOrders: async (params?: QueryParams): Promise<{ data: Order[]; meta: any }> => {
    const response = await api.get('/shipper/orders/my-orders', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getMyEarnings: async (): Promise<any> => {
    const { data } = await api.get('/shipper/earnings');
    return data;
  },
  getMyStats: async (): Promise<any> => {
    const { data } = await api.get('/shipper/stats');
    return data;
  },
  markDelivered: async (orderId: string): Promise<void> => {
    await api.post(`/shipper/orders/${orderId}/deliver`);
  },
  // Shipper: available orders + accept/reject
  getAvailableOrders: async (): Promise<Order[]> => {
    const { data } = await api.get('/shipper/orders/available');
    // Backend returns { success: true, data: [...] }, interceptor returns { data: [...] }
    // But interceptor line 96 unwraps to response.data = array directly
    return Array.isArray(data) ? data : (data as any)?.data ?? [];
  },
  acceptOrder: async (orderId: string): Promise<void> => {
    const { data } = await api.post(`/shipper/orders/${orderId}/accept`);
    return (data as any)?.data ?? data;
  },
  rejectOrder: async (orderId: string): Promise<void> => {
    await api.post(`/shipper/orders/${orderId}/reject`);
  },
  deliverOrder: async (orderId: string, proofImage?: string): Promise<void> => {
    await api.post(`/shipper/orders/${orderId}/deliver`, { proofImage });
  },
  // Admin
  getShippers: async (params?: QueryParams): Promise<{ data: Shipper[]; meta: any }> => {
    const response = await api.get('/admin/shippers', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getAllShippers: async (params?: QueryParams): Promise<{ data: Shipper[]; meta: any }> => {
    const response = await api.get('/admin/shippers', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getShipperById: async (id: string): Promise<Shipper> => {
    const { data } = await api.get(`/admin/shippers/${id}`);
    return data;
  },
  getShipperLocations: async (): Promise<any[]> => {
    const { data } = await api.get('/admin/shippers/locations');
    return data;
  },
  adminAssignOrder: async (shipperId: string, orderId: string): Promise<void> => {
    await api.post(`/admin/shippers/${shipperId}/assign-order/${orderId}`);
  },
};
