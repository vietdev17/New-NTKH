'use client';

import { usePathname } from 'next/navigation';
import { ShipperBottomNav } from '@/components/shipper/bottom-nav';
import { ShipperOfflineIndicator } from '@/components/shipper/offline-indicator';
import { NotificationBell } from '@/components/shared/notification-bell';

export default function ShipperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page — no bottom nav
  if (pathname === '/shipper/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b flex items-center justify-between h-14 px-4 shrink-0">
        <span className="font-bold text-primary-500">Shipper App</span>
        <NotificationBell />
      </header>
      <ShipperOfflineIndicator />
      <main>{children}</main>
      <ShipperBottomNav />
    </div>
  );
}
