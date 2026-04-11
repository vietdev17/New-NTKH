'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, CheckCircle, Package, Truck, Warehouse, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useOrder } from '@/hooks/use-orders';
import { useSocketEvent, useSocketRoom } from '@/hooks/use-socket';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import type { MarkerData } from '@/components/shared/delivery-map';

const DeliveryMap = dynamic(() => import('@/components/shared/delivery-map'), { ssr: false });

const STATUS_TIMELINE = [
  { key: 'pending', label: 'Chờ xác nhận', icon: Clock, desc: 'Đơn hàng đang chờ xác nhận từ cửa hàng' },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle, desc: 'Cửa hàng đã xác nhận đơn hàng' },
  { key: 'preparing', label: 'Đang chuẩn bị', icon: Package, desc: 'Đơn hàng đang được đóng gói' },
  { key: 'waiting_pickup', label: 'Chờ lấy hàng', icon: Warehouse, desc: 'Đơn hàng chờ shipper đến lấy' },
  { key: 'in_transit', label: 'Đang giao', icon: Truck, desc: 'Đơn hàng đang trên đường giao đến bạn' },
  { key: 'delivered', label: 'Đã giao', icon: CheckCircle, desc: 'Đơn hàng đã được giao thành công' },
];

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const { data: order, isLoading } = useOrder(params.id);
  const qc = useQueryClient();
  const [shipperLocation, setShipperLocation] = useState<[number, number] | null>(null);

  // Join order room để nhận location broadcast từ shipper
  useSocketRoom(`room:order:${params.id}`);

  // Realtime: listen for status changes
  const handleStatusUpdate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['order', params.id] });
  }, [qc, params.id]);
  useSocketEvent('order:statusUpdated', handleStatusUpdate);

  // Fetch initial shipper location from API
  useEffect(() => {
    orderService.getShipperLocation(params.id).then((loc) => {
      if (loc?.lat && loc?.lng) {
        setShipperLocation([loc.lat, loc.lng]);
      }
    });
  }, [params.id]);

  // Realtime: listen for shipper location (backend sends lat/lng)
  const handleShipperLocation = useCallback((data: any) => {
    const lat = data?.lat ?? data?.latitude;
    const lng = data?.lng ?? data?.longitude;
    if (lat && lng) {
      setShipperLocation([lat, lng]);
    }
  }, []);
  useSocketEvent('shipper:location_updated', handleShipperLocation);

  const o = (order as any) || {};
  const currentIndex = STATUS_TIMELINE.findIndex((s) => s.key === o.status);
  const isInTransit = o.status === 'in_transit' || o.status === 'shipping';
  const hasShipper = !!o.shipperName;
  const fullAddress = [o.shippingStreet, o.shippingWard, o.shippingDistrict, o.shippingProvince].filter(Boolean).join(', ');

  // Get destination coords from order (lat/lng saved when address was created)
  const destinationCoords = useMemo<[number, number] | null>(() => {
    // Use saved lat/lng from order
    if (o.shippingLat && o.shippingLng) {
      return [o.shippingLat, o.shippingLng];
    }
    return null;
  }, [o.shippingLat, o.shippingLng]);

  // Map markers
  const markers = useMemo<MarkerData[]>(() => {
    const result: MarkerData[] = [];

    if (shipperLocation) {
      result.push({
        id: 'shipper',
        position: shipperLocation,
        label: o.shipperName || 'Shipper',
        type: 'shipper',
        popup: o.shipperPhone ? `SĐT: ${o.shipperPhone}` : undefined,
      });
    }

    if (destinationCoords) {
      result.push({
        id: 'destination',
        position: destinationCoords,
        label: 'Địa chỉ giao hàng',
        type: 'destination',
        popup: fullAddress,
      });
    }

    return result;
  }, [shipperLocation, o.shipperName, o.shipperPhone, destinationCoords, fullAddress]);

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!order) return null;

  return (
    <div className="container-custom py-6 lg:py-10 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href={`/orders/${params.id}`}><ArrowLeft className="h-4 w-4" /> Chi tiết đơn</Link>
        </Button>
        <h1 className="text-xl font-bold">Theo Dõi Đơn Hàng</h1>
      </div>

      {/* Order number */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mã đơn hàng</p>
            <p className="font-mono font-bold text-lg">#{o.orderNumber}</p>
          </div>
          <div className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium',
            isInTransit ? 'bg-blue-100 text-blue-700' : o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
          )}>
            {STATUS_TIMELINE.find((s) => s.key === o.status)?.label || o.status}
          </div>
        </div>
      </div>

      {/* Shipper info card - show when assigned */}
      {hasShipper && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden mb-6">
          <div className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{o.shipperName}</p>
                {isInTransit && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    {shipperLocation ? 'Đang giao' : 'Đang kết nối...'}
                  </span>
                )}
              </div>
              {o.shipperPhone && (
                <a href={`tel:${o.shipperPhone}`} className="text-sm text-blue-500 font-medium flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {o.shipperPhone}
                </a>
              )}
            </div>
          </div>

          {/* Map - show when in_transit with shipper location, or show destination */}
          {(isInTransit || markers.length > 0) && (
            <div className="h-[350px] border-t border-gray-100 isolate">
              <DeliveryMap
                markers={markers}
                showRoute={shipperLocation !== null && markers.length >= 2}
              />
            </div>
          )}

          {/* In transit but no GPS yet */}
          {isInTransit && !shipperLocation && (
            <div className="p-4 bg-blue-50 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Đang chờ vị trí GPS từ shipper...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map for non-shipper states - show destination only */}
      {!hasShipper && o.shippingProvince && o.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <p className="font-semibold text-sm">Địa chỉ giao hàng</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">{fullAddress}</p>
          </div>
          <div className="h-[250px] isolate">
            <DeliveryMap markers={markers} showRoute={false} />
          </div>
        </div>
      )}

      {/* Status Timeline */}
      {o.status === 'cancelled' ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
          {o.cancelReason && <p className="text-sm text-red-500 mt-1">Lý do: {o.cancelReason}</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
          <h2 className="font-semibold mb-4">Trạng thái đơn hàng</h2>
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
            <div className="space-y-6">
              {STATUS_TIMELINE.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = currentIndex >= i;
                const isCurrent = currentIndex === i;

                // Find matching status history entry
                const historyEntry = o.statusHistory?.find((h: any) => h.status === step.key);

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 relative z-10"
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                      isCompleted ? 'bg-primary-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-300',
                      isCurrent && 'ring-4 ring-primary-100',
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={cn('pt-1.5', isCompleted ? '' : 'opacity-40')}>
                      <p className={cn('font-medium', isCurrent && 'text-primary-600')}>{step.label}</p>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                      {historyEntry && (
                        <p className="text-xs text-primary-500 mt-0.5">{formatDateTime(historyEntry.changedAt)}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shipping address - when shipper is shown, address is in map popup */}
      {!hasShipper && o.shippingFullName && !o.shippingProvince && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary-500" />
            <h3 className="font-semibold text-sm">Địa chỉ giao hàng</h3>
          </div>
          <p className="text-sm font-medium">{o.shippingFullName}</p>
          <p className="text-sm text-gray-500">{o.shippingPhone}</p>
          <p className="text-sm text-gray-500">{fullAddress}</p>
        </div>
      )}
    </div>
  );
}
