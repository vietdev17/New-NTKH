'use client';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotification } from '@/hooks/use-notification';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white animate-bounce-subtle">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thong bao</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-500 hover:underline font-normal"
            >
              Doc tat ca
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Khong co thong bao
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <DropdownMenuItem
              key={notif._id}
              className={cn(
                'flex flex-col items-start gap-1 p-3 cursor-pointer',
                !notif.isRead && 'bg-primary-50/50'
              )}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <span className="text-sm font-medium line-clamp-1">{notif.title}</span>
                {!notif.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                )}
              </div>
              <span className="text-xs text-gray-500 line-clamp-2">{notif.message}</span>
              <span className="text-xs text-gray-400">{formatRelativeTime(notif.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
