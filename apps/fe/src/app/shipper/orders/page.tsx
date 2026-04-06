'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { formatDate, formatPrice } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
];

export default function ShipperOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('shipping');

  const { data, isLoading } = useQuery({
    queryKey: ['shipper-orders', page, status],
    queryFn: () => shipperService.getMyOrders({ page, limit: 10, status: status === 'all' ? undefined : status }),
  });
  const orders = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  return (
    <div className="pb-20 px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Đơn Hàng Của Tôi</h1>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="mb-4">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="space-y-3">
          {orders.map((order: any, i: number) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/shipper/orders/${order._id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-secondary-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">#{order.orderNumber || order.orderCode}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} type="order" />
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-secondary-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {order.shippingStreet || order.shippingAddress?.street}, {order.shippingDistrict || order.shippingAddress?.district}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">{order.customerName || order.shippingFullName || order.customer?.fullName}</p>
                    <p className="text-sm font-semibold text-primary-600">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-400">Không có đơn hàng</div>
          )}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4">
          <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
