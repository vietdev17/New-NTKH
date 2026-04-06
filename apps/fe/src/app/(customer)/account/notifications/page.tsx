'use client';
import { motion } from 'framer-motion';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useNotifications } from '@/hooks/use-notification';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, isLoading, markAllRead, markRead, unreadCount } = useNotifications();

  return (
    <div className="container-custom py-6 lg:py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold">Thông Báo</h1>
          {unreadCount > 0 && (
            <span className="bg-primary-100 text-primary-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={markAllRead}>
            <Check className="h-4 w-4" />
            Đọc tất cả
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any, i: number) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => !n.isRead && markRead(n._id)}
              className={cn(
                'bg-white rounded-xl border p-4 shadow-card cursor-pointer hover:border-primary-200 transition-colors',
                n.isRead ? 'border-gray-100' : 'border-primary-200 bg-primary-50/30'
              )}
            >
              <div className="flex gap-3">
                <div className={cn(
                  'h-2 w-2 rounded-full mt-2 shrink-0',
                  n.isRead ? 'bg-gray-200' : 'bg-primary-500'
                )} />
                <div className="flex-1">
                  <p className={cn('text-sm', n.isRead ? 'text-gray-700' : 'text-gray-900 font-medium')}>
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
