# SHIPPER APP - PWA GIAO HANG

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/shipper/`, `apps/fe/src/components/shipper/`
> Bao gom: ShipperLayout, Dashboard, OrderDetail, DeliveryProof, GPS Tracking, History, Earnings, Profile, PWA Config
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Socket.IO + Zustand
> Toi uu: Mobile-first PWA, touch-friendly (min 48px), large text, minimal animations
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [ShipperLayout](#1-shipperlayout)
2. [ShipperDashboard](#2-shipperdashboard)
3. [ShipperOrderDetailPage](#3-shipperorderdetailpage)
4. [AcceptOrderFlow](#4-acceptorderflow)
5. [GPS Tracking](#5-gps-tracking)
6. [HistoryPage](#6-historypage)
7. [EarningsPage](#7-earningspage)
8. [ShipperProfilePage](#8-shipperprofilepage)
9. [PWA Configuration](#9-pwa-configuration)
10. [BottomNav](#10-bottomnav)

---

## 1. ShipperLayout

> File: `apps/fe/src/app/shipper/layout.tsx`
> Auth guard cho shipper role. Bottom navigation co dinh.
> Header voi toggle trang thai: Available / Busy / Offline.
> Mobile-first: full-width, safe area padding.

### 1.1 Cau truc trang

```
┌─────────────────────────────────────┐
│  Header (h-14)                      │
│  [Shipper App]     [●Available ▾]   │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         Main Content                │
│         (children)                  │
│         pb-20 (cho bottom nav)      │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Bottom Nav (fixed, h-16)           │
│  [🏠] [📦] [📋] [💰] [👤]          │
│  Home  Don  Lich  Thu   Ca          │
│        hang  su  nhap  nhan         │
│  (safe-area-inset-bottom)           │
└─────────────────────────────────────┘
```

### 1.2 Code

```tsx
// ============================================================
// apps/fe/src/app/shipper/layout.tsx
// ============================================================
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';
import { useAuthStore } from '@/stores/use-auth-store';
import { useShipperStore } from '@/stores/use-shipper-store';
import { useShipperSocket } from '@/hooks/use-shipper-socket';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BottomNav } from '@/components/shipper/bottom-nav';

interface ShipperLayoutProps {
  children: React.ReactNode;
}

// ---- Status config ----
const STATUS_CONFIG = {
  available: {
    label: 'San sang',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  busy: {
    label: 'Ban',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  offline: {
    label: 'Offline',
    color: 'bg-gray-400',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
};

type ShipperStatus = keyof typeof STATUS_CONFIG;

export default function ShipperLayout({ children }: ShipperLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { status, setStatus, availableOrdersCount } = useShipperStore();

  // ----- Socket.IO connection -----
  useShipperSocket();

  // ----- Auth guard -----
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/shipper');
      return;
    }
    if (!user || user.role !== 'shipper') {
      router.replace('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, router]);

  // ----- Handle status change -----
  const handleStatusChange = (newStatus: ShipperStatus) => {
    setStatus(newStatus);
  };

  if (!isAuthenticated || !user) return null;

  const currentStatus = STATUS_CONFIG[status as ShipperStatus] || STATUS_CONFIG.offline;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
        {/* Left: App name */}
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-lg">Giao hang</span>
        </div>

        {/* Right: Status toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                ${currentStatus.bgColor} ${currentStatus.textColor}
                active:opacity-70 transition-opacity
              `}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`}
              />
              {currentStatus.label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusChange(key as ShipperStatus)}
                className="flex items-center gap-2 py-3"
              >
                <span
                  className={`w-3 h-3 rounded-full ${config.color}`}
                />
                <span className="text-base">{config.label}</span>
                {status === key && (
                  <span className="ml-auto text-blue-600 font-bold">
                    ✓
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 pb-20">{children}</main>

      {/* ===== BOTTOM NAV ===== */}
      <BottomNav
        availableOrdersCount={availableOrdersCount}
      />
    </div>
  );
}
```

### 1.3 Shipper Store (Zustand)

```typescript
// ============================================================
// apps/fe/src/stores/use-shipper-store.ts
// ============================================================
import { create } from 'zustand';

interface ShipperState {
  status: 'available' | 'busy' | 'offline';
  availableOrdersCount: number;
  activeOrderIds: string[];

  setStatus: (status: 'available' | 'busy' | 'offline') => void;
  setAvailableOrdersCount: (count: number) => void;
  addActiveOrder: (orderId: string) => void;
  removeActiveOrder: (orderId: string) => void;
}

export const useShipperStore = create<ShipperState>((set) => ({
  status: 'offline',
  availableOrdersCount: 0,
  activeOrderIds: [],

  setStatus: (status) => set({ status }),
  setAvailableOrdersCount: (count) => set({ availableOrdersCount: count }),
  addActiveOrder: (orderId) =>
    set((state) => ({
      activeOrderIds: [...state.activeOrderIds, orderId],
    })),
  removeActiveOrder: (orderId) =>
    set((state) => ({
      activeOrderIds: state.activeOrderIds.filter((id) => id !== orderId),
    })),
}));
```

---

## 2. ShipperDashboard

> File: `apps/fe/src/app/shipper/page.tsx`
> Trang chinh: thong ke hom nay, don hang cho nhan, don dang giao.
> Real-time: nhan don moi qua Socket.IO.

### 2.1 Cau truc giao dien

```
┌─────────────────────────────────────┐
│  Xin chao, Nguyen Van A!           │
│  Thu 4, 02/04/2026                  │
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐ ┌────────┐             │
│  │ 12     │ │ 2.4M   │             │
│  │Don hom │ │Doanh   │             │
│  │nay     │ │thu     │             │
│  └────────┘ └────────┘             │
│  ┌────────┐ ┌────────┐             │
│  │ 1.8M   │ │ 3      │             │
│  │COD thu │ │Don cho │             │
│  │        │ │nhan    │             │
│  └────────┘ └────────┘             │
│                                     │
│  === DON CHO NHAN (3) ===          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ #ORD-240402-015             │    │
│  │ Q. Binh Thanh | 3 SP | 5km │    │
│  │ 8,500,000 VND               │    │
│  │                              │    │
│  │ [NHAN DON]   [TU CHOI]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ #ORD-240402-018             │    │
│  │ Q.7 | 1 SP | 8km           │    │
│  │ 12,990,000 VND              │    │
│  │                              │    │
│  │ [NHAN DON]   [TU CHOI]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  === DON DANG GIAO (1) ===         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ #ORD-240402-010             │    │
│  │ IN_TRANSIT | Q. Thu Duc     │    │
│  │                              │    │
│  │ [     XEM CHI TIET     ]    │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Code

```tsx
// ============================================================
// apps/fe/src/app/shipper/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Package,
  TrendingUp,
  Banknote,
  Clock,
  MapPin,
  ShoppingBag,
  Truck,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/use-auth-store';
import { useShipperStore } from '@/stores/use-shipper-store';
import { shipperService } from '@/services/shipper-service';
import { formatCurrency } from '@/lib/utils';
import { AcceptOrderDialog } from '@/components/shipper/accept-order-dialog';
import { RejectOrderDialog } from '@/components/shipper/reject-order-dialog';

interface AvailableOrder {
  id: string;
  orderNumber: string;
  customerArea: string;
  itemsCount: number;
  total: number;
  distanceKm: number;
  paymentMethod: 'cod' | 'bank_transfer' | 'paid';
  codAmount?: number;
}

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerArea: string;
  customerName: string;
}

export default function ShipperDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { status } = useShipperStore();

  const [acceptingOrder, setAcceptingOrder] = useState<AvailableOrder | null>(
    null
  );
  const [rejectingOrder, setRejectingOrder] = useState<AvailableOrder | null>(
    null
  );

  // ----- Fetch thong ke hom nay -----
  const { data: todayStats } = useQuery({
    queryKey: ['shipper-today-stats'],
    queryFn: () => shipperService.getTodayStats(),
    refetchInterval: 60000, // Refresh moi 1 phut
  });

  // ----- Fetch don cho nhan -----
  const {
    data: availableOrders,
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
  } = useQuery({
    queryKey: ['shipper-available-orders'],
    queryFn: () => shipperService.getAvailableOrders(),
    refetchInterval: 15000, // Refresh moi 15 giay
    enabled: status === 'available',
  });

  // ----- Fetch don dang giao -----
  const { data: activeOrders, isLoading: loadingActive } = useQuery({
    queryKey: ['shipper-active-orders'],
    queryFn: () => shipperService.getActiveOrders(),
    refetchInterval: 30000,
  });

  // ----- Format date -----
  const today = new Date();
  const dayNames = ['CN', 'Thu 2', 'Thu 3', 'Thu 4', 'Thu 5', 'Thu 6', 'Thu 7'];
  const todayStr = `${dayNames[today.getDay()]}, ${today.toLocaleDateString('vi-VN')}`;

  return (
    <div className="p-4 space-y-6">
      {/* ===== GREETING ===== */}
      <div>
        <h1 className="text-xl font-bold">Xin chao, {user?.fullName}!</h1>
        <p className="text-sm text-gray-500">{todayStr}</p>
      </div>

      {/* ===== THONG KE HOM NAY ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium">Don hom nay</span>
            </div>
            <p className="text-2xl font-bold">
              {todayStats?.totalOrders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Doanh thu</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(todayStats?.totalEarnings || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Banknote className="h-4 w-4" />
              <span className="text-xs font-medium">COD thu</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(todayStats?.totalCOD || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Don cho nhan</span>
            </div>
            <p className="text-2xl font-bold">
              {availableOrders?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== DON CHO NHAN ===== */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          Don cho nhan
          {availableOrders && availableOrders.length > 0 && (
            <Badge className="bg-blue-600">
              {availableOrders.length}
            </Badge>
          )}
        </h2>

        {status !== 'available' ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p className="text-base">
                Chuyen trang thai sang "San sang" de nhan don moi
              </p>
            </CardContent>
          </Card>
        ) : loadingAvailable ? (
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
          </div>
        ) : !availableOrders || availableOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-base">Chua co don hang moi</p>
              <p className="text-sm mt-1">Don moi se hien thi tai day</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableOrders.map((order: AvailableOrder) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-base">
                      #{order.orderNumber}
                    </span>
                    {order.paymentMethod === 'cod' && (
                      <Badge
                        variant="outline"
                        className="border-amber-400 text-amber-700"
                      >
                        COD: {formatCurrency(order.codAmount || 0)}
                      </Badge>
                    )}
                  </div>

                  {/* Order info */}
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {order.customerArea}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {order.itemsCount} SP
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      ~{order.distanceKm}km
                    </span>
                  </div>

                  {/* Total */}
                  <p className="text-lg font-bold text-blue-600 mb-3">
                    {formatCurrency(order.total)}
                  </p>

                  {/* Action buttons - touch-friendly min 48px */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="h-12 text-base bg-green-600 hover:bg-green-700 active:bg-green-800"
                      onClick={() => setAcceptingOrder(order)}
                    >
                      Nhan don
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 text-base"
                      onClick={() => setRejectingOrder(order)}
                    >
                      Tu choi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ===== DON DANG GIAO ===== */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-amber-600" />
          Don dang giao
          {activeOrders && activeOrders.length > 0 && (
            <Badge className="bg-amber-600">
              {activeOrders.length}
            </Badge>
          )}
        </h2>

        {loadingActive ? (
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-600" />
          </div>
        ) : !activeOrders || activeOrders.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-gray-500">
              <p className="text-base">Khong co don dang giao</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order: ActiveOrder) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold">
                      #{order.orderNumber}
                    </span>
                    <Badge
                      className={
                        order.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {order.status === 'IN_TRANSIT'
                        ? 'Dang giao'
                        : 'Da lay hang'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{order.customerArea}</span>
                    <span>|</span>
                    <span>{order.customerName}</span>
                  </div>

                  <Button
                    className="w-full h-12 text-base"
                    onClick={() =>
                      router.push(`/shipper/orders/${order.id}`)
                    }
                  >
                    Xem chi tiet
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ===== DIALOGS ===== */}
      {acceptingOrder && (
        <AcceptOrderDialog
          order={acceptingOrder}
          onClose={() => setAcceptingOrder(null)}
          onAccepted={() => {
            setAcceptingOrder(null);
            refetchAvailable();
          }}
        />
      )}

      {rejectingOrder && (
        <RejectOrderDialog
          order={rejectingOrder}
          onClose={() => setRejectingOrder(null)}
          onRejected={() => {
            setRejectingOrder(null);
            refetchAvailable();
          }}
        />
      )}
    </div>
  );
}
```

---

## 3. ShipperOrderDetailPage

> File: `apps/fe/src/app/shipper/orders/[id]/page.tsx`
> Chi tiet don hang giao: thong tin khach, dia chi, san pham, thanh toan.
> Nut hanh dong theo trang thai. Chup anh xac nhan giao hang.

### 3.1 Cau truc giao dien

```
┌─────────────────────────────────────┐
│  [<] Chi tiet don hang              │
├─────────────────────────────────────┤
│                                     │
│  #ORD-240402-015                    │
│  [WAITING_PICKUP] ← badge          │
│                                     │
│  === KHACH HANG ===                 │
│  ┌─────────────────────────────┐    │
│  │ Nguyen Van B                │    │
│  │ 0901234567  [GOI]           │    │
│  │ 123 Nguyen Trai, Q.1       │    │
│  │ TP. Ho Chi Minh             │    │
│  │                              │    │
│  │ [       CHI DUONG       ]   │    │
│  └─────────────────────────────┘    │
│                                     │
│  === SAN PHAM ===                   │
│  ┌─────────────────────────────┐    │
│  │ Sofa Boras                  │    │
│  │ Xam dam - 180x80cm | SL: 1 │    │
│  ├─────────────────────────────┤    │
│  │ Ban Mino                    │    │
│  │ Go soi - 120cm | SL: 2     │    │
│  └─────────────────────────────┘    │
│                                     │
│  === THANH TOAN ===                 │
│  ┌─────────────────────────────┐    │
│  │ COD - CHUA THANH TOAN       │    │
│  │ Thu ho: 8,500,000 VND       │    │
│  └─────────────────────────────┘    │
│                                     │
│  [     DA LAY HANG (48px)     ]     │  ← WAITING_PICKUP
│  [     DA GIAO HANG (48px)    ]     │  ← IN_TRANSIT
│                                     │
└─────────────────────────────────────┘
```

### 3.2 Code

```tsx
// ============================================================
// apps/fe/src/app/shipper/orders/[id]/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Navigation,
  Package,
  CreditCard,
  Banknote,
  Camera,
  Truck,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shipperService } from '@/services/shipper-service';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DeliveryProofUpload } from '@/components/shipper/delivery-proof-upload';

// ---- Status config ----
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  WAITING_PICKUP: { label: 'Cho lay hang', color: 'bg-amber-100 text-amber-800' },
  IN_TRANSIT: { label: 'Dang giao', color: 'bg-blue-100 text-blue-800' },
  DELIVERED: { label: 'Da giao', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Giao that bai', color: 'bg-red-100 text-red-800' },
};

export default function ShipperOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const [showProofUpload, setShowProofUpload] = useState(false);

  // ----- Fetch order detail -----
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shipper-order', orderId],
    queryFn: () => shipperService.getOrderDetail(orderId),
  });

  // ----- Cap nhat trang thai: Da lay hang -----
  const pickupMutation = useMutation({
    mutationFn: () =>
      shipperService.updateOrderStatus(orderId, 'IN_TRANSIT'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipper-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['shipper-active-orders'] });
      toast({ title: 'Da cap nhat', description: 'Don hang dang duoc giao.' });
    },
    onError: () => {
      toast({
        title: 'Loi',
        description: 'Khong the cap nhat trang thai.',
        variant: 'destructive',
      });
    },
  });

  // ----- Mo Google Maps chi duong -----
  const handleNavigate = () => {
    if (!order?.deliveryAddress) return;

    const { latitude, longitude, fullAddress } = order.deliveryAddress;

    if (latitude && longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`,
        '_blank'
      );
    }
  };

  // ----- Handle goi dien thoai -----
  const handleCall = () => {
    if (order?.customer?.phone) {
      window.location.href = `tel:${order.customer.phone}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
        <p className="text-base">Khong tim thay don hang</p>
        <Button className="mt-4" onClick={() => router.back()}>
          Quay lai
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.WAITING_PICKUP;

  return (
    <div className="pb-6">
      {/* ===== HEADER ===== */}
      <div className="sticky top-14 z-30 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base">#{order.orderNumber}</h1>
        </div>
        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
      </div>

      <div className="p-4 space-y-4">
        {/* ===== KHACH HANG ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Thong tin giao hang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-lg">{order.customer.fullName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base text-gray-600">
                  {order.customer.phone}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1 text-green-600 border-green-300"
                  onClick={handleCall}
                >
                  <Phone className="h-4 w-4" />
                  Goi
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-base leading-relaxed">
                {order.deliveryAddress.fullAddress}
              </p>
              {order.deliveryAddress.note && (
                <p className="text-sm text-gray-500 mt-1">
                  Ghi chu: {order.deliveryAddress.note}
                </p>
              )}
            </div>

            <Button
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              onClick={handleNavigate}
            >
              <Navigation className="h-5 w-5 mr-2" />
              Chi duong
            </Button>
          </CardContent>
        </Card>

        {/* ===== SAN PHAM ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              San pham ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-base">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-500">
                      {item.variantLabel}
                    </span>
                    <span className="text-sm font-medium">
                      SL: {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ===== THANH TOAN ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {order.paymentMethod === 'cod' ? (
                <Banknote className="h-4 w-4 text-amber-600" />
              ) : (
                <CreditCard className="h-4 w-4 text-green-600" />
              )}
              Thanh toan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Phuong thuc:</span>
                <span className="font-medium">
                  {order.paymentMethod === 'cod'
                    ? 'Thu ho (COD)'
                    : 'Da thanh toan'}
                </span>
              </div>
              {order.paymentMethod === 'cod' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">So tien thu ho:</span>
                  <span className="text-xl font-bold text-amber-700">
                    {formatCurrency(order.codAmount || order.total)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tong don hang:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="space-y-3 pt-2">
          {order.status === 'WAITING_PICKUP' && (
            <Button
              className="w-full h-14 text-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
              onClick={() => pickupMutation.mutate()}
              disabled={pickupMutation.isPending}
            >
              {pickupMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Truck className="h-5 w-5 mr-2" />
              )}
              Da lay hang
            </Button>
          )}

          {order.status === 'IN_TRANSIT' && (
            <Button
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 active:bg-green-800"
              onClick={() => setShowProofUpload(true)}
            >
              <Camera className="h-5 w-5 mr-2" />
              Da giao hang
            </Button>
          )}
        </div>
      </div>

      {/* ===== DELIVERY PROOF UPLOAD ===== */}
      {showProofUpload && (
        <DeliveryProofUpload
          orderId={orderId}
          onClose={() => setShowProofUpload(false)}
          onSuccess={() => {
            setShowProofUpload(false);
            queryClient.invalidateQueries({
              queryKey: ['shipper-order', orderId],
            });
            toast({
              title: 'Giao hang thanh cong!',
              description: 'Don hang da duoc xac nhan giao.',
            });
          }}
        />
      )}
    </div>
  );
}
```

### 3.3 DeliveryProofUpload Component

```tsx
// ============================================================
// apps/fe/src/components/shipper/delivery-proof-upload.tsx
// ============================================================
'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  X,
  Upload,
  CheckCircle,
  RotateCcw,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper-service';

interface DeliveryProofUploadProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryProofUpload({
  orderId,
  onClose,
  onSuccess,
}: DeliveryProofUploadProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- Chup anh hoac chon file -----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Tao preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ----- Reset -----
  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ----- Upload va xac nhan -----
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error('Chua co anh');

      const formData = new FormData();
      formData.append('proof', imageFile);

      return shipperService.confirmDelivery(orderId, formData);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
        <h3 className="font-bold text-lg">Xac nhan giao hang</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {imagePreview ? (
          /* ----- Preview anh da chup ----- */
          <div className="w-full max-w-md space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-900">
              <img
                src={imagePreview}
                alt="Proof of delivery"
                className="w-full h-auto max-h-[50vh] object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 text-base bg-white/10 text-white border-white/30 hover:bg-white/20"
                onClick={handleReset}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Chup lai
              </Button>
              <Button
                className="h-14 text-base bg-green-600 hover:bg-green-700"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Xac nhan giao hang
              </Button>
            </div>
          </div>
        ) : (
          /* ----- Camera/file input ----- */
          <div className="w-full max-w-md space-y-4 text-center">
            <div className="bg-white/10 rounded-2xl p-12">
              <Camera className="h-16 w-16 mx-auto mb-4 text-white/70" />
              <p className="text-white text-lg mb-2">
                Chup anh xac nhan giao hang
              </p>
              <p className="text-white/60 text-sm">
                Chup anh khach hang da nhan hang hoac de truoc cua
              </p>
            </div>

            {/* Camera button - su dung input file voi capture */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-6 w-6 mr-2" />
              Chup anh
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-base bg-white/10 text-white border-white/30 hover:bg-white/20"
              onClick={() => {
                // Mo file picker khong co capture (de chon tu thu vien)
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) =>
                  handleFileChange(
                    e as unknown as React.ChangeEvent<HTMLInputElement>
                  );
                input.click();
              }}
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Chon anh tu thu vien
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. AcceptOrderFlow

> File: `apps/fe/src/components/shipper/accept-order-dialog.tsx` + `reject-order-dialog.tsx`
> Flow nhan/tu choi don hang.

### 4.1 Accept Dialog

```tsx
// ============================================================
// apps/fe/src/components/shipper/accept-order-dialog.tsx
// ============================================================
'use client';

import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  MapPin,
  Package,
  Banknote,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper-service';
import { useShipperStore } from '@/stores/use-shipper-store';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AcceptOrderDialogProps {
  order: {
    id: string;
    orderNumber: string;
    customerArea: string;
    itemsCount: number;
    total: number;
    distanceKm: number;
    paymentMethod: string;
    codAmount?: number;
  };
  onClose: () => void;
  onAccepted: () => void;
}

export function AcceptOrderDialog({
  order,
  onClose,
  onAccepted,
}: AcceptOrderDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addActiveOrder } = useShipperStore();

  const acceptMutation = useMutation({
    mutationFn: () => shipperService.acceptOrder(order.id),
    onSuccess: () => {
      addActiveOrder(order.id);
      toast({
        title: 'Da nhan don!',
        description: `Don #${order.orderNumber} da duoc gan cho ban.`,
      });
      onAccepted();
      // Chuyen den trang chi tiet
      router.push(`/shipper/orders/${order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Loi',
        description: error.message || 'Khong the nhan don. Don co the da duoc nhan boi nguoi khac.',
        variant: 'destructive',
      });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Nhan don hang?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="font-mono font-bold text-xl text-blue-700">
              #{order.orderNumber}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              {order.customerArea}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Package className="h-4 w-4" />
              {order.itemsCount} san pham
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(order.total)}
            </p>
            {order.paymentMethod === 'cod' && order.codAmount && (
              <p className="text-sm text-amber-600 mt-1 flex items-center justify-center gap-1">
                <Banknote className="h-4 w-4" />
                Thu ho COD: {formatCurrency(order.codAmount)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2" />
            )}
            Xac nhan nhan don
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12 text-base"
            onClick={onClose}
          >
            Huy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.2 Reject Dialog

```tsx
// ============================================================
// apps/fe/src/components/shipper/reject-order-dialog.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper-service';
import { useToast } from '@/hooks/use-toast';

const REJECT_REASONS = [
  { value: 'too_far', label: 'Qua xa' },
  { value: 'busy', label: 'Dang ban' },
  { value: 'vehicle_issue', label: 'Xe co van de' },
  { value: 'heavy_items', label: 'Hang qua nang/cong kenh' },
  { value: 'bad_weather', label: 'Thoi tiet xau' },
  { value: 'other', label: 'Ly do khac' },
];

interface RejectOrderDialogProps {
  order: { id: string; orderNumber: string };
  onClose: () => void;
  onRejected: () => void;
}

export function RejectOrderDialog({
  order,
  onClose,
  onRejected,
}: RejectOrderDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');

  const rejectMutation = useMutation({
    mutationFn: () => shipperService.rejectOrder(order.id, reason),
    onSuccess: () => {
      toast({
        title: 'Da tu choi don',
        description: `Don #${order.orderNumber} da bi tu choi.`,
      });
      onRejected();
    },
    onError: () => {
      toast({
        title: 'Loi',
        description: 'Khong the tu choi don hang.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tu choi don #{order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <label className="text-sm font-medium mb-2 block">
            Ly do tu choi
          </label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Chon ly do..." />
            </SelectTrigger>
            <SelectContent>
              {REJECT_REASONS.map((r) => (
                <SelectItem
                  key={r.value}
                  value={r.value}
                  className="py-3 text-base"
                >
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            className="w-full h-12 text-base"
            onClick={() => rejectMutation.mutate()}
            disabled={!reason || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Tu choi don hang
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12 text-base"
            onClick={onClose}
          >
            Huy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. GPS Tracking

> File: `apps/fe/src/hooks/use-gps-tracking.ts`
> Theo doi vi tri GPS shipper. Gui cap nhat qua Socket.IO.
> Chi gui khi di chuyen > 10m (Haversine). Tiet kiem pin.

### 5.1 Hook Code

```typescript
// ============================================================
// apps/fe/src/hooks/use-gps-tracking.ts
// ============================================================
import { useEffect, useRef, useCallback, useState } from 'react';
import { useShipperSocket } from '@/hooks/use-shipper-socket';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseGPSTrackingOptions {
  enabled: boolean;
  minDistanceMeters?: number; // Mac dinh 10m
  updateIntervalMs?: number; // Mac dinh 10s
}

// ---- Haversine distance (meters) ----
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Ban kinh Trai Dat (met)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGPSTracking({
  enabled,
  minDistanceMeters = 10,
  updateIntervalMs = 10000,
}: UseGPSTrackingOptions) {
  const { socket } = useShipperSocket();
  const watchIdRef = useRef<number | null>(null);
  const lastSentPositionRef = useRef<GPSPosition | null>(null);
  const lastSentTimeRef = useRef<number>(0);

  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // ----- Gui vi tri qua Socket.IO -----
  const sendPosition = useCallback(
    (position: GPSPosition) => {
      if (!socket?.connected) return;

      const now = Date.now();
      const lastSent = lastSentPositionRef.current;

      // Kiem tra khoang cach toi thieu
      if (lastSent) {
        const distance = haversineDistance(
          lastSent.latitude,
          lastSent.longitude,
          position.latitude,
          position.longitude
        );

        // Chi gui neu da di chuyen > minDistanceMeters
        // HOAC da qua updateIntervalMs tu lan gui truoc
        if (
          distance < minDistanceMeters &&
          now - lastSentTimeRef.current < updateIntervalMs
        ) {
          return;
        }
      }

      socket.emit('shipper:location-update', {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: position.timestamp,
        batteryLevel,
      });

      lastSentPositionRef.current = position;
      lastSentTimeRef.current = now;
    },
    [socket, minDistanceMeters, updateIntervalMs, batteryLevel]
  );

  // ----- Watch position -----
  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      if (!navigator.geolocation) {
        setError('Thiet bi khong ho tro GPS');
      }
      return;
    }

    // Bat dau theo doi
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const gpsPosition: GPSPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };

        setCurrentPosition(gpsPosition);
        setError(null);
        sendPosition(gpsPosition);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Vui long cap quyen truy cap vi tri');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Khong the xac dinh vi tri');
            break;
          case err.TIMEOUT:
            setError('Het thoi gian xac dinh vi tri');
            break;
          default:
            setError('Loi GPS khong xac dinh');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, sendPosition]);

  // ----- Battery level -----
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  return {
    currentPosition,
    error,
    batteryLevel,
    isTracking: enabled && watchIdRef.current !== null,
  };
}
```

### 5.2 Shipper Socket Hook

```typescript
// ============================================================
// apps/fe/src/hooks/use-shipper-socket.ts
// ============================================================
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/use-auth-store';
import { useShipperStore } from '@/stores/use-shipper-store';
import { useToast } from '@/hooks/use-toast';

let socket: Socket | null = null;

export function useShipperSocket() {
  const { token } = useAuthStore();
  const { setAvailableOrdersCount, status } = useShipperStore();
  const { toast } = useToast();
  const statusRef = useRef(status);

  // Keep ref in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!token) return;

    // Tao ket noi Socket.IO
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket'],
      path: '/socket/shipper',
    });

    socket.on('connect', () => {
      console.log('[ShipperSocket] Connected');
      // Gui trang thai hien tai
      socket?.emit('shipper:status', { status: statusRef.current });
    });

    // Nhan don hang moi
    socket.on('order:new-available', (data: { count: number }) => {
      setAvailableOrdersCount(data.count);

      // Thong bao neu dang san sang
      if (statusRef.current === 'available') {
        toast({
          title: 'Don hang moi!',
          description: 'Co don hang moi can giao.',
        });

        // Vibrate (PWA)
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    });

    // Cap nhat so don
    socket.on(
      'order:available-count',
      (data: { count: number }) => {
        setAvailableOrdersCount(data.count);
      }
    );

    socket.on('disconnect', () => {
      console.log('[ShipperSocket] Disconnected');
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token, setAvailableOrdersCount, toast]);

  // Gui status update khi thay doi
  useEffect(() => {
    if (socket?.connected) {
      socket.emit('shipper:status', { status });
    }
  }, [status]);

  return { socket };
}
```

---

## 6. HistoryPage

> File: `apps/fe/src/app/shipper/history/page.tsx`
> Lich su giao hang da hoan thanh. Loc theo ngay.

### 6.1 Code

```tsx
// ============================================================
// apps/fe/src/app/shipper/history/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  Banknote,
  Package,
  Calendar,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { shipperService } from '@/services/shipper-service';
import { formatCurrency } from '@/lib/utils';

interface DeliveryHistory {
  id: string;
  orderNumber: string;
  customerName: string;
  customerArea: string;
  total: number;
  codAmount: number;
  deliveredAt: string;
  deliveryTimeMinutes: number;
}

export default function HistoryPage() {
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0] // Hom nay
  );

  // ----- Fetch lich su -----
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['shipper-history', dateFilter],
    queryFn: () => shipperService.getDeliveryHistory({ date: dateFilter }),
  });

  // ----- Format time -----
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Lich su giao hang
      </h1>

      {/* Date filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto h-11 text-base"
        />
      </div>

      {/* Deliveries list */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
        </div>
      ) : !deliveries || deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-base">Khong co don giao nao</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3">
            <span className="text-sm text-green-700">
              Tong: {deliveries.length} don
            </span>
            <span className="font-bold text-green-700">
              COD:{' '}
              {formatCurrency(
                deliveries.reduce(
                  (sum: number, d: DeliveryHistory) => sum + (d.codAmount || 0),
                  0
                )
              )}
            </span>
          </div>

          {/* List */}
          <div className="space-y-3">
            {deliveries.map((delivery: DeliveryHistory) => (
              <Card key={delivery.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold">
                      #{delivery.orderNumber}
                    </span>
                    <Badge className="bg-green-100 text-green-700 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Da giao
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5" />
                      <span>{delivery.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{delivery.customerArea}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {formatTime(delivery.deliveredAt)} |{' '}
                          {delivery.deliveryTimeMinutes} phut
                        </span>
                      </div>
                      <span className="font-bold text-base text-gray-900">
                        {formatCurrency(delivery.total)}
                      </span>
                    </div>
                    {delivery.codAmount > 0 && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Banknote className="h-3.5 w-3.5" />
                        <span>
                          COD: {formatCurrency(delivery.codAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 7. EarningsPage

> File: `apps/fe/src/app/shipper/earnings/page.tsx`
> Thu nhap shipper: thong ke theo ky, bieu do, bang chi tiet, doi soat COD.

### 7.1 Cau truc giao dien

```
┌─────────────────────────────────────┐
│  THU NHAP                           │
│                                     │
│  [Hom nay] [Tuan nay] [Thang nay]  │
│                                     │
│  ┌────────┐ ┌────────┐             │
│  │ 850K   │ │ 12     │             │
│  │Thu nhap│ │So don  │             │
│  └────────┘ └────────┘             │
│  ┌────────┐ ┌────────┐             │
│  │ 5.2M   │ │ 3.8M   │             │
│  │COD thu │ │COD chua│             │
│  │        │ │doi soat│             │
│  └────────┘ └────────┘             │
│                                     │
│  === BIEU DO THU NHAP ===          │
│  ┌─────────────────────────────┐    │
│  │  ▓                          │    │
│  │  ▓  ▓     ▓                 │    │
│  │  ▓  ▓  ▓  ▓  ▓              │    │
│  │  ▓  ▓  ▓  ▓  ▓  ▓  ▓       │    │
│  │  T2 T3 T4 T5 T6 T7 CN      │    │
│  └─────────────────────────────┘    │
│                                     │
│  === CHI TIET THEO NGAY ===        │
│  ┌─────┬──────┬────────┬──────┐    │
│  │Ngay │ Don  │Thu nhap│ COD  │    │
│  │02/04│  5   │  350K  │ 2.1M │    │
│  │01/04│  7   │  500K  │ 3.1M │    │
│  └─────┴──────┴────────┴──────┘    │
│                                     │
│  === DOI SOAT COD ===              │
│  COD chua doi soat: 3,800,000      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ #ORD-001 | 1,200,000       │    │
│  │ #ORD-005 | 2,600,000       │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 7.2 Code

```tsx
// ============================================================
// apps/fe/src/app/shipper/earnings/page.tsx
// ============================================================
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Package,
  Banknote,
  AlertCircle,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { shipperService } from '@/services/shipper-service';
import { formatCurrency } from '@/lib/utils';

type PeriodTab = 'today' | 'week' | 'month';

const PERIOD_LABELS: Record<PeriodTab, string> = {
  today: 'Hom nay',
  week: 'Tuan nay',
  month: 'Thang nay',
};

interface DailyEarning {
  date: string;
  ordersCount: number;
  earnings: number;
  codCollected: number;
}

interface PendingCODOrder {
  id: string;
  orderNumber: string;
  codAmount: number;
  deliveredAt: string;
}

export default function EarningsPage() {
  const [period, setPeriod] = useState<PeriodTab>('today');

  // ----- Fetch thong ke thu nhap -----
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['shipper-earnings', period],
    queryFn: () => shipperService.getEarnings(period),
  });

  // ----- Fetch COD chua doi soat -----
  const { data: pendingCOD } = useQuery({
    queryKey: ['shipper-pending-cod'],
    queryFn: () => shipperService.getPendingCOD(),
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Thu nhap
      </h1>

      {/* Period tabs */}
      <div className="flex gap-2">
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={period === key ? 'default' : 'outline'}
            onClick={() => setPeriod(key as PeriodTab)}
            className="flex-1 h-11 text-base"
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* ===== THONG KE TONG HOP ===== */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Thu nhap</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(earningsData?.totalEarnings || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-medium">So don</span>
                </div>
                <p className="text-2xl font-bold">
                  {earningsData?.totalOrders || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Banknote className="h-4 w-4" />
                  <span className="text-xs font-medium">COD da thu</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(earningsData?.totalCODCollected || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">COD chua doi soat</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(pendingCOD?.totalPending || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ===== BIEU DO THU NHAP (Simple bar chart) ===== */}
          {earningsData?.dailyBreakdown &&
            earningsData.dailyBreakdown.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Bieu do thu nhap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-32">
                    {earningsData.dailyBreakdown.map(
                      (day: DailyEarning, idx: number) => {
                        const maxEarning = Math.max(
                          ...earningsData.dailyBreakdown.map(
                            (d: DailyEarning) => d.earnings
                          )
                        );
                        const heightPercent =
                          maxEarning > 0
                            ? (day.earnings / maxEarning) * 100
                            : 0;

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-[10px] text-gray-500">
                              {formatCurrency(day.earnings)}
                            </span>
                            <div
                              className="w-full bg-blue-500 rounded-t-sm min-h-[4px] transition-all"
                              style={{
                                height: `${Math.max(heightPercent, 3)}%`,
                              }}
                            />
                            <span className="text-[10px] text-gray-500">
                              {new Date(day.date).toLocaleDateString(
                                'vi-VN',
                                { day: '2-digit', month: '2-digit' }
                              )}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* ===== BANG CHI TIET THEO NGAY ===== */}
          {earningsData?.dailyBreakdown &&
            earningsData.dailyBreakdown.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Chi tiet theo ngay
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngay</TableHead>
                          <TableHead className="text-center">Don</TableHead>
                          <TableHead className="text-right">Thu nhap</TableHead>
                          <TableHead className="text-right">COD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {earningsData.dailyBreakdown.map(
                          (day: DailyEarning) => (
                            <TableRow key={day.date}>
                              <TableCell className="font-medium">
                                {new Date(day.date).toLocaleDateString(
                                  'vi-VN',
                                  { day: '2-digit', month: '2-digit' }
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {day.ordersCount}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {formatCurrency(day.earnings)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(day.codCollected)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
        </>
      )}

      {/* ===== DOI SOAT COD ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Doi soat COD
            </span>
            {pendingCOD?.totalPending > 0 && (
              <Badge variant="destructive">
                {formatCurrency(pendingCOD.totalPending)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pendingCOD?.orders || pendingCOD.orders.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-base">
              Khong co COD can doi soat
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">
                Cac don COD chua nop lai cho admin:
              </p>
              {pendingCOD.orders.map((order: PendingCODOrder) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="font-mono font-medium">
                      #{order.orderNumber}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(order.deliveredAt).toLocaleDateString(
                        'vi-VN'
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-amber-700">
                    {formatCurrency(order.codAmount)}
                  </span>
                </div>
              ))}

              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                <span>Tong COD can nop:</span>
                <span className="text-red-600">
                  {formatCurrency(pendingCOD.totalPending)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 8. ShipperProfilePage

> File: `apps/fe/src/app/shipper/profile/page.tsx`
> Thong tin ca nhan, thong ke hieu suat, doi trang thai, dang xuat.

### 8.1 Code

```tsx
// ============================================================
// apps/fe/src/app/shipper/profile/page.tsx
// ============================================================
'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Phone,
  Mail,
  Truck,
  Star,
  CheckCircle,
  Clock,
  LogOut,
  ChevronRight,
  Edit,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/use-auth-store';
import { useShipperStore } from '@/stores/use-shipper-store';
import { shipperService } from '@/services/shipper-service';

export default function ShipperProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { status, setStatus } = useShipperStore();

  // ----- Fetch thong ke hieu suat -----
  const { data: performanceStats } = useQuery({
    queryKey: ['shipper-performance'],
    queryFn: () => shipperService.getPerformanceStats(),
  });

  // ----- Handle logout -----
  const handleLogout = () => {
    const confirmed = window.confirm('Ban co chac muon dang xuat?');
    if (!confirmed) return;
    setStatus('offline');
    logout();
    router.replace('/login');
  };

  return (
    <div className="p-4 space-y-4">
      {/* ===== PROFILE CARD ===== */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{user?.fullName}</h2>
              <Badge variant="outline" className="mt-1">
                <Shield className="h-3 w-3 mr-1" />
                Shipper
              </Badge>
            </div>

            {/* Edit button */}
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0"
              onClick={() => router.push('/shipper/profile/edit')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-base">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{user?.phone || 'Chua cap nhat'}</span>
            </div>
            <div className="flex items-center gap-3 text-base">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{user?.email || 'Chua cap nhat'}</span>
            </div>
            <div className="flex items-center gap-3 text-base">
              <Truck className="h-4 w-4 text-gray-400" />
              <span>
                {user?.vehicleType || 'Xe may'} -{' '}
                {user?.licensePlate || 'Chua cap nhat'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== HIEU SUAT ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hieu suat giao hang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <CheckCircle className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">
                {performanceStats?.totalDeliveries || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tong don giao
              </p>
            </div>

            <div className="text-center bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">
                {performanceStats?.onTimeRate || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Dung gio
              </p>
            </div>

            <div className="text-center bg-amber-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Star className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">
                {performanceStats?.rating || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Danh gia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== TRANG THAI ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trang thai hoat dong</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(['available', 'busy', 'offline'] as const).map((s) => {
              const isActive = status === s;
              const labels: Record<string, string> = {
                available: 'San sang',
                busy: 'Ban',
                offline: 'Offline',
              };
              const colors: Record<string, string> = {
                available: isActive
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700',
                busy: isActive
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700',
                offline: isActive
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-50 text-gray-700',
              };

              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`
                    py-3 rounded-lg text-base font-medium transition-all
                    active:scale-95 ${colors[s]}
                  `}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== DANG XUAT ===== */}
      <Button
        variant="outline"
        className="w-full h-12 text-base text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Dang xuat
      </Button>
    </div>
  );
}
```

---

## 9. PWA Configuration

> Cau hinh Progressive Web App cho Shipper App.
> Cho phep cai dat nhu ung dung doc lap tren dien thoai.

### 9.1 manifest.json

```json
// ============================================================
// apps/fe/public/shipper-manifest.json
// ============================================================
{
  "name": "Giao Hang - Noi That Viet Nam",
  "short_name": "Giao Hang",
  "description": "Ung dung giao hang cho shipper - Noi That Viet Nam",
  "start_url": "/shipper",
  "scope": "/shipper",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icons/shipper-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/shipper-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "logistics"],
  "lang": "vi",
  "dir": "ltr"
}
```

### 9.2 Service Worker

```javascript
// ============================================================
// apps/fe/public/shipper-sw.js
// ============================================================

const CACHE_NAME = 'shipper-v1';
const STATIC_ASSETS = [
  '/shipper',
  '/shipper/offline',
  '/icons/shipper-192.png',
  '/icons/shipper-512.png',
];

// ----- Install: cache static assets -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ----- Activate: xoa cache cu -----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ----- Fetch: Network-first, fallback to cache -----
self.addEventListener('fetch', (event) => {
  // Chi cache GET requests
  if (event.request.method !== 'GET') return;

  // Khong cache API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache response moi
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // Neu la navigation request, tra ve offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/shipper/offline');
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ----- Push notification (future enhancement) -----
// self.addEventListener('push', (event) => {
//   const data = event.data?.json();
//   self.registration.showNotification(data.title, {
//     body: data.body,
//     icon: '/icons/shipper-192.png',
//     badge: '/icons/shipper-badge.png',
//     vibrate: [200, 100, 200],
//     data: data.url,
//   });
// });
//
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   event.waitUntil(clients.openWindow(event.notification.data));
// });
```

### 9.3 PWA Registration & Install Prompt

```tsx
// ============================================================
// apps/fe/src/components/shipper/pwa-install-prompt.tsx
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Kiem tra da cai chua
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Lang nghe su kien beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Hien banner sau 5 giay
      setTimeout(() => setShowBanner(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Dang ky Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/shipper-sw.js', { scope: '/shipper' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // ----- Handle install -----
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  // ----- Handle dismiss -----
  const handleDismiss = () => {
    setShowBanner(false);
    // Khong hien lai trong 24h
    localStorage.setItem(
      'pwa-dismiss-time',
      Date.now().toString()
    );
  };

  if (isInstalled || !showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-xl shadow-xl border p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base">Cai dat ung dung</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Them vao man hinh chinh de truy cap nhanh hon
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 -mt-1 -mr-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <Button
          className="w-full h-12 mt-3 text-base bg-blue-600 hover:bg-blue-700"
          onClick={handleInstall}
        >
          <Download className="h-5 w-5 mr-2" />
          Cai dat ung dung
        </Button>
      </div>
    </div>
  );
}
```

### 9.4 Offline Page

```tsx
// ============================================================
// apps/fe/src/app/shipper/offline/page.tsx
// ============================================================
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShipperOfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <WifiOff className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold mb-2">Khong co ket noi mang</h1>
        <p className="text-gray-500 text-base mb-6">
          Vui long kiem tra ket noi Internet va thu lai.
        </p>
        <Button
          className="h-12 text-base px-8"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Thu lai
        </Button>
      </div>
    </div>
  );
}
```

---

## 10. BottomNav

> File: `apps/fe/src/components/shipper/bottom-nav.tsx`
> 5 tab voi icons. Highlight tab hien tai. Badge cho don hang.
> Safe area padding cho iOS (notch/home indicator).
> Touch target toi thieu 48px.

### 10.1 Cau truc giao dien

```
┌─────────────────────────────────────┐
│  [🏠]    [📦3]   [📋]   [💰]   [👤] │
│  Trang   Don     Lich   Thu    Ca   │
│  chu     hang    su     nhap   nhan │
│                                     │
│  (safe-area-inset-bottom padding)   │
└─────────────────────────────────────┘
```

### 10.2 Code

```tsx
// ============================================================
// apps/fe/src/components/shipper/bottom-nav.tsx
// ============================================================
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Package,
  Clock,
  DollarSign,
  User,
} from 'lucide-react';

interface BottomNavProps {
  availableOrdersCount: number;
}

// ---- Nav items config ----
const NAV_ITEMS = [
  {
    href: '/shipper',
    label: 'Trang chu',
    icon: Home,
    exact: true, // Chi active khi exact match
  },
  {
    href: '/shipper/orders',
    label: 'Don hang',
    icon: Package,
    showBadge: true, // Hien thi badge
  },
  {
    href: '/shipper/history',
    label: 'Lich su',
    icon: Clock,
  },
  {
    href: '/shipper/earnings',
    label: 'Thu nhap',
    icon: DollarSign,
  },
  {
    href: '/shipper/profile',
    label: 'Ca nhan',
    icon: User,
  },
];

export function BottomNav({ availableOrdersCount }: BottomNavProps) {
  const pathname = usePathname();

  // ----- Check active -----
  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white border-t
        safe-area-bottom
      "
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-0.5
                min-h-[48px] min-w-[48px]
                transition-colors relative
                active:bg-gray-100
                ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }
              `}
            >
              <div className="relative">
                <Icon
                  className={`h-6 w-6 ${active ? 'stroke-[2.5]' : ''}`}
                />

                {/* Badge cho don hang */}
                {item.showBadge && availableOrdersCount > 0 && (
                  <span
                    className="
                      absolute -top-1.5 -right-2.5
                      min-w-[18px] h-[18px]
                      bg-red-500 text-white
                      rounded-full text-[10px] font-bold
                      flex items-center justify-center
                      px-1
                    "
                  >
                    {availableOrdersCount > 99
                      ? '99+'
                      : availableOrdersCount}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] leading-tight ${
                  active ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## Tong ket File Structure

```
apps/fe/src/
├── app/shipper/
│   ├── layout.tsx                   # ShipperLayout (auth, header, bottom nav)
│   ├── page.tsx                     # ShipperDashboard (stats, orders)
│   ├── offline/
│   │   └── page.tsx                 # Offline fallback page
│   ├── orders/
│   │   └── [id]/
│   │       └── page.tsx             # ShipperOrderDetailPage
│   ├── history/
│   │   └── page.tsx                 # HistoryPage
│   ├── earnings/
│   │   └── page.tsx                 # EarningsPage (NEW)
│   └── profile/
│       └── page.tsx                 # ShipperProfilePage
├── components/shipper/
│   ├── bottom-nav.tsx               # BottomNav (5 tabs, badge, safe area)
│   ├── accept-order-dialog.tsx      # AcceptOrderDialog
│   ├── reject-order-dialog.tsx      # RejectOrderDialog
│   ├── delivery-proof-upload.tsx    # DeliveryProofUpload (camera)
│   └── pwa-install-prompt.tsx       # PWAInstallPrompt
├── hooks/
│   ├── use-gps-tracking.ts         # GPS tracking hook (Haversine)
│   └── use-shipper-socket.ts       # Socket.IO hook
├── stores/
│   └── use-shipper-store.ts        # Shipper Zustand store
└── public/
    ├── shipper-manifest.json        # PWA manifest
    └── shipper-sw.js                # Service Worker
```

### Luu y Mobile-first

| Yeu to               | Gia tri                                        |
| --------------------- | ---------------------------------------------- |
| Touch target          | Min 48px (tat ca button, link)                 |
| Font size             | Base 16px, header 20px, label 14px             |
| Spacing               | p-4 (16px) cho page padding                    |
| Button height         | h-12 (48px) mac dinh, h-14 (56px) cho CTA     |
| Bottom nav height     | h-16 (64px) + safe-area                        |
| Safe area             | env(safe-area-inset-bottom) cho iOS             |
| Animation             | Minimal - chi transition-colors, active:scale   |
| Image loading         | Lazy loading mac dinh                          |
| Offline               | Service Worker + cache + offline page           |
