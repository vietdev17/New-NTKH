'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { POS_NAV_ITEMS } from '@/lib/constants';
import { usePosStore } from '@/stores/use-pos-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { cn } from '@/lib/utils';
import { LogOut, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/shared/notification-bell';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentShift } = usePosStore();
  const { user, logout } = useAuthStore();
  const [time, setTime] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/pos/login');
  };

  // Login page — no nav
  if (pathname === '/pos/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b flex items-center justify-between h-14 px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/pos" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-primary-500 hidden sm:block">POS Terminal</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {POS_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {currentShift ? (
            <div className="flex items-center gap-1.5 text-success-600 bg-success-50 px-3 py-1 rounded-full text-xs font-medium">
              <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
              Ca dang mo
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
              Chua mo ca
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-gray-500">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">{time ? format(time, 'HH:mm:ss', { locale: vi }) : '--:--:--'}</span>
          </div>
          <span className="font-medium text-gray-700 hidden md:block">{user?.fullName}</span>
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 hover:bg-gray-100 text-gray-500 hover:text-danger-500 transition-colors"
            title="Dang xuat"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
