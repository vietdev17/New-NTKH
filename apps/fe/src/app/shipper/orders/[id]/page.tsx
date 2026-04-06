'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, Phone, Package, Navigation, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrder } from '@/hooks/use-orders';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { formatPrice } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { MarkerData } from '@/components/shared/delivery-map';

const DeliveryMap = dynamic(() => import('@/components/shared/delivery-map'), { ssr: false });

export default function ShipperOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(id);
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const o = order as any;
  const isDelivering = o?.status === 'in_transit' || o?.status === 'shipping';

  // GPS tracking - only when delivering
  const geo = useGeolocation({
    enableSocket: true,
    currentOrderId: isDelivering ? id : null,
    intervalMs: 10000,
  });

  // Auto-start tracking when delivering
  useEffect(() => {
    if (isDelivering && !geo.isTracking) {
      geo.startTracking();
    }
    return () => { geo.stopTracking(); };
  }, [isDelivering]);

  // Deliver mutation
  const deliverMutation = useMutation({
    mutationFn: () => shipperService.deliverOrder(id, proofImage || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['shipper'] });
      toast.success('Giao hàng thành công!');
      setShowDeliverDialog(false);
      geo.stopTracking();
      router.push('/shipper/orders');
    },
    onError: (e: any) => toast.error(e.message || 'Thất bại'),
  });

  // Map markers
  const markers = useMemo<MarkerData[]>(() => {
    const result: MarkerData[] = [];
    if (geo.latitude && geo.longitude) {
      result.push({
        id: 'shipper',
        position: [geo.latitude, geo.longitude],
        label: 'Vị trí của bạn',
        type: 'shipper',
      });
    }
    // Destination - use a fixed point for now (address geocoding would need an API)
    // We'll show the address in popup
    if (o?.shippingProvince) {
      // Default to HCMC center if no geocoding
      result.push({
        id: 'destination',
        position: [10.8231, 106.6297],
        label: o.shippingFullName || 'Điểm giao',
        type: 'destination',
        popup: [o.shippingStreet, o.shippingWard, o.shippingDistrict, o.shippingProvince].filter(Boolean).join(', '),
      });
    }
    return result;
  }, [geo.latitude, geo.longitude, o]);

  // Camera capture
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProofImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (!order) return null;

  const fullAddress = [o.shippingStreet, o.shippingWard, o.shippingDistrict, o.shippingProvince].filter(Boolean).join(', ');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="pb-28 pt-4">
      {/* Header */}
      <div className="px-4 flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" asChild className="p-0">
          <Link href="/shipper/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-lg font-bold">#{o.orderNumber}</h1>
        <StatusBadge status={o.status} type="order" />
      </div>

      <div className="px-4 space-y-4">
        {/* GPS Status */}
        {isDelivering && (
          <div className={`rounded-xl p-3 text-sm flex items-center gap-2 ${geo.isTracking ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            <div className={`h-2 w-2 rounded-full ${geo.isTracking ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            {geo.isTracking
              ? `GPS đang hoạt động (độ chính xác: ${Math.round(geo.accuracy || 0)}m)`
              : geo.error || 'Đang bắt GPS...'}
            {!geo.isTracking && (
              <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => geo.startTracking()}>
                Thử lại
              </Button>
            )}
          </div>
        )}

        {/* Map */}
        {isDelivering && markers.length > 0 && (
          <div className="h-[250px]">
            <DeliveryMap markers={markers} showRoute={true} />
          </div>
        )}

        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Người nhận</h3>
          <p className="font-bold text-lg">{o.shippingFullName}</p>
          <div className="flex items-center gap-2 mt-2">
            <Phone className="h-4 w-4 text-secondary-500" />
            <a href={`tel:${o.shippingPhone}`} className="text-secondary-600 font-medium">
              {o.shippingPhone}
            </a>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <MapPin className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700">{fullAddress}</p>
          </div>
          {/* Navigation button */}
          <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-2">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-3.5 w-3.5" /> Chỉ đường Google Maps
            </a>
          </Button>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Sản phẩm ({o.items?.length})</h3>
          <div className="space-y-2">
            {o.items?.map((item: any, i: number) => (
              <div key={item._id || i} className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 text-gray-300 shrink-0" />
                <p className="flex-1 line-clamp-1">{item.productName}</p>
                <span className="text-gray-400">x{item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>{o.paymentMethod === 'cod' ? 'Thu COD' : 'Đã thanh toán'}</span>
            <span className="text-primary-600">
              {o.paymentMethod === 'cod' ? formatPrice(o.total) : formatPrice(o.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Deliver button - fixed at bottom */}
      {isDelivering && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-10">
          <Button
            className="w-full h-14 text-base font-semibold bg-green-500 hover:bg-green-600 gap-2"
            onClick={() => setShowDeliverDialog(true)}
          >
            <CheckCircle className="h-5 w-5" /> Xác nhận đã giao hàng
          </Button>
        </div>
      )}

      {/* Deliver confirmation dialog with proof photo */}
      <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận giao hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Chụp ảnh chứng minh đã giao hàng thành công</p>

            {/* Camera/Upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              {proofImage ? (
                <div className="space-y-2">
                  <img src={proofImage} alt="Proof" className="max-h-48 mx-auto rounded-lg" />
                  <Button variant="ghost" size="sm" onClick={() => setProofImage(null)}>Chụp lại</Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Camera className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Chạm để chụp ảnh</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCapture}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeliverDialog(false)}>
                Hủy
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => deliverMutation.mutate()}
                disabled={deliverMutation.isPending}
              >
                {deliverMutation.isPending ? 'Đang xử lý...' : 'Xác nhận giao'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
