'use client';

import { usePathname } from 'next/navigation';
import { ShipperBottomNav } from '@/components/shipper/bottom-nav';
import { ShipperOfflineIndicator } from '@/components/shipper/offline-indicator';

export default function ShipperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page — no bottom nav
  if (pathname === '/shipper/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <ShipperOfflineIndicator />
      <main>{children}</main>
      <ShipperBottomNav />
    </div>
  );
}
