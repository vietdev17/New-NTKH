'use client';
import { useState } from 'react';
import { RotateCcw, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PosReturnsPage() {
  const [searchCode, setSearchCode] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pos-returns'],
    queryFn: () => orderService.getOrders({ status: 'returned', limit: 20 }),
  });
  const returns = (data as any)?.data || [];

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    try {
      const order = await orderService.getOrderByCode(searchCode.trim());
      if (order) {
        setSearchedOrder(order);
      } else {
        toast.error('Không tìm thấy đơn hàng');
        setSearchedOrder(null);
      }
    } catch {
      toast.error('Không tìm thấy đơn hàng');
      setSearchedOrder(null);
    } finally {
      setSearching(false);
    }
  };

  const returnMutation = useMutation({
    mutationFn: (orderId: string) => orderService.updateOrderStatus(orderId, 'returned'),
    onSuccess: () => {
      toast.success('Đã xử lý trả hàng!');
      setSearchedOrder(null);
      setSearchCode('');
      queryClient.invalidateQueries({ queryKey: ['pos-returns'] });
    },
    onError: () => toast.error('Xử lý thất bại'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-primary-500" />
          Trả Hàng
        </h1>
        <p className="text-sm text-gray-500 mt-1">Tìm đơn hàng và xử lý trả hàng tại quầy</p>
      </div>

      {/* Search order */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="font-semibold mb-3">Tìm đơn hàng</h2>
        <div className="flex gap-3 max-w-md">
          <Input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Nhập mã đơn hàng..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} className="gap-2 shrink-0">
            <Search className="h-4 w-4" />
            Tìm
          </Button>
        </div>

        {searchedOrder && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">Đơn #{searchedOrder.orderNumber}</p>
                <p className="text-sm text-gray-500">{formatDate(searchedOrder.createdAt)}</p>
              </div>
              <StatusBadge status={searchedOrder.status} type="order" />
            </div>
            <div className="space-y-2 mb-3">
              {searchedOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.productName || item.product?.name} x{item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.totalPrice || item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="font-bold">Tổng: {formatPrice(searchedOrder.total)}</span>
              {searchedOrder.status === 'delivered' && (
                <Button
                  onClick={() => returnMutation.mutate(searchedOrder._id)}
                  variant="destructive"
                  disabled={returnMutation.isPending}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {returnMutation.isPending ? 'Đang xử lý...' : 'Trả hàng'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent returns */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="font-semibold mb-3">Đơn trả hàng gần đây</h2>
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : returns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chưa có đơn trả hàng</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((order: any) => (
              <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary-600">{formatPrice(order.total)}</p>
                  <StatusBadge status={order.status} type="order" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
