'use client';

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { useNotificationStore } from '@/stores/use-notification-store';
import { useSocketEvent } from './use-socket';
import { useAuthStore } from '@/stores/use-auth-store';
import toast from 'react-hot-toast';

export function useNotification() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { notifications, unreadCount, addNotification, setNotifications, setUnreadCount, markAsRead, markAllAsRead: storeMarkAllAsRead } = useNotificationStore();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 20 }),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const items = Array.isArray(data?.data) ? data.data : (data as any)?.data?.items || [];
    if (items.length > 0) setNotifications(items);
  }, [data, setNotifications]);

  const handleNewNotification = useCallback((notification: any) => {
    addNotification(notification);
    toast(notification.title, { icon: '🔔' });
  }, [addNotification]);

  useSocketEvent('notification:new', handleNewNotification);

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    await notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    storeMarkAllAsRead();
    await notificationService.markAllAsRead();
  };

  return { notifications, unreadCount, markAsRead: handleMarkAsRead, markAllAsRead: handleMarkAllAsRead };
}

// Alias with additional isLoading and normalized names for pages
export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const { notifications, unreadCount, addNotification, setNotifications, markAsRead, markAllAsRead: storeMarkAllAsRead } = useNotificationStore();

  const { isLoading, data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 50 }),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const items = Array.isArray(data?.data) ? data.data : (data as any)?.data?.items || [];
    if (items.length > 0) setNotifications(items);
  }, [data, setNotifications]);

  const markRead = async (id: string) => {
    markAsRead(id);
    await notificationService.markAsRead(id);
  };

  const markAllRead = async () => {
    storeMarkAllAsRead();
    await notificationService.markAllAsRead();
  };

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}
