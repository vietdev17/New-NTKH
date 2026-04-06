'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState, useMemo } from 'react';
import { useSocketEvent } from '@/hooks/use-socket';
import { shipperService } from '@/services/shipper.service';
import type { MarkerData } from '@/components/shared/delivery-map';

const DeliveryMap = dynamic(() => import('@/components/shared/delivery-map'), { ssr: false });

export default function AdminShipperMapPage() {
  const [realtimeLocations, setRealtimeLocations] = useState<Record<string, { lat: number; lng: number; name?: string }>>({});

  const { data: locations = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'shipper-locations'],
    queryFn: () => shipperService.getShipperLocations(),
    refetchInterval: 30000,
  });

  // Listen for realtime shipper location updates
  const handleLocationUpdate = useCallback((data: any) => {
    if (data?.shipperId && data?.latitude && data?.longitude) {
      setRealtimeLocations((prev) => ({
        ...prev,
        [data.shipperId]: { lat: data.latitude, lng: data.longitude, name: data.shipperName },
      }));
    }
  }, []);
  useSocketEvent('shipper:location_updated', handleLocationUpdate);

  // Merge DB locations with realtime updates
  const markers = useMemo<MarkerData[]>(() => {
    const markerMap = new Map<string, MarkerData>();

    // From DB
    (locations as any[]).forEach((loc: any) => {
      const coords = loc.location?.coordinates;
      if (coords?.length === 2) {
        markerMap.set(loc.shipperId?._id || loc.shipperId, {
          id: loc.shipperId?._id || loc.shipperId,
          position: [coords[1], coords[0]], // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
          label: loc.shipperId?.fullName || 'Shipper',
          type: 'shipper',
          popup: `Trang thai: ${loc.status || 'N/A'}${loc.currentOrderId ? ` | Don: ${loc.currentOrderId}` : ''}`,
        });
      }
    });

    // Override with realtime
    Object.entries(realtimeLocations).forEach(([id, loc]) => {
      markerMap.set(id, {
        id,
        position: [loc.lat, loc.lng],
        label: loc.name || 'Shipper',
        type: 'shipper',
        popup: 'Dang giao hang',
      });
    });

    return Array.from(markerMap.values());
  }, [locations, realtimeLocations]);

  const [selectedShipper, setSelectedShipper] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link href="/admin/shippers"><ArrowLeft className="h-4 w-4" /> Shipper</Link>
          </Button>
          <h1 className="text-2xl font-bold">Ban do Shipper</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {markers.length} shipper dang hoat dong
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Lam moi
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)] min-h-[500px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-100 rounded-xl">
            <p className="text-gray-400">Dang tai ban do...</p>
          </div>
        ) : (
          <DeliveryMap
            markers={markers}
            zoom={12}
            onShipperClick={(id) => setSelectedShipper(id)}
          />
        )}
      </div>

      {selectedShipper && (
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Shipper ID: {selectedShipper}</p>
          <Link href={`/admin/shippers/${selectedShipper}`}>
            <Button size="sm" variant="outline" className="mt-2">Xem chi tiet</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
