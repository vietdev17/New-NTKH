import api from '@/lib/api';
import type { Notification, QueryParams } from '@/types';

export const notificationService = {
  getNotifications: async (params?: QueryParams): Promise<{ data: Notification[]; meta: any }> => {
    const response = await api.get('/notifications', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count');
    return data;
  },
};
