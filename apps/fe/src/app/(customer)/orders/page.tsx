'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { EmptyOrders } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useMyOrders } from '@/hooks/use-orders';
import { formatDate, formatPrice } from '@/lib/utils';
import { Package, Eye } from 'lucide-react';

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMyOrders({
    page,
    limit: 10,
    ...(status !== 'all' ? { status } : {}),
  });

  const orders = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  return (
    <div className="container-custom py-6 lg:py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-primary-500" />
        <h1 className="text-2xl font-bold">Đơn Hàng Của Tôi</h1>
      </div>

      <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        <TabsList className="h-auto flex-wrap gap-1 p-1 mb-6">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={status}>
          {isLoading ? (
            <LoadingSpinner className="py-12" />
          ) : orders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                  {/* Order header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <div>
                      <span className="text-xs text-gray-500">Mã đơn: </span>
                      <span className="text-sm font-mono font-medium">#{order.orderNumber || order.orderCode}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      <StatusBadge status={order.status} type="order" />
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="p-4">
                    <div className="flex gap-3 mb-3">
                      {order.items?.slice(0, 3).map((item: any, i: number) => (
                        <div key={item._id || i} className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                          <Image
                            src={item.productImage || item.product?.images?.[0] || '/images/placeholder.svg'}
                            alt={item.productName || item.product?.name || ''}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="h-14 w-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-sm text-gray-500 shrink-0">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{order.items?.length} sản phẩm</p>
                        <p className="font-bold text-primary-600">{formatPrice(order.total)}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href={`/orders/${order._id}`}>
                          <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {meta && meta.totalPages > 1 && (
                <PaginationControl page={page} totalPages={meta.totalPages} onPageChange={setPage} className="mt-6" />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
