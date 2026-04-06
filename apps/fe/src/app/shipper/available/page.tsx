'use client';
import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { useSocketEvent } from '@/hooks/use-socket';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ShipperAvailableOrdersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const acceptedIdRef = useRef<string | null>(null);
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['shipper', 'available'],
    queryFn: () => shipperService.getAvailableOrders(),
    refetchInterval: 30000,
  });

  // Realtime: refresh when new order assigned
  const handleNewOrder = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['shipper', 'available'] });
  }, [qc]);
  useSocketEvent('order:created', handleNewOrder);
  useSocketEvent('order:statusUpdated', handleNewOrder);

  const acceptMutation = useMutation({
    mutationFn: (orderId: string) => {
      acceptedIdRef.current = orderId;
      return shipperService.acceptOrder(orderId);
    },
    onSuccess: () => {
      toast.success('Da nhan don! Chuyen sang trang giao hang...');
      qc.invalidateQueries({ queryKey: ['shipper', 'available'] });
      qc.invalidateQueries({ queryKey: ['shipper', 'my-orders'] });
      router.push(`/shipper/orders/${acceptedIdRef.current}`);
    },
    onError: (e: any) => toast.error(e.message || 'Nhan don that bai'),
  });

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;

  return (
    <div className="pb-20 pt-4">
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold">Don cho giao</h1>
        <p className="text-sm text-gray-500">{orders.length} don dang cho</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Khong co don nao can giao</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {(orders as any[]).map((order: any) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm">#{order.orderNumber}</span>
                <span className="text-xs text-gray-400">{order.items?.length || 0} san pham</span>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <MapPin className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{order.shippingFullName}</p>
                  <p className="text-gray-500">
                    {[order.shippingStreet, order.shippingWard, order.shippingDistrict, order.shippingProvince]
                      .filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">COD: </span>
                  <span className="font-bold text-primary-600">
                    {order.paymentMethod === 'cod' ? formatPrice(order.total) : 'Da thanh toan'}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => acceptMutation.mutate(order._id)}
                  disabled={acceptMutation.isPending}
                >
                  Nhan don <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
