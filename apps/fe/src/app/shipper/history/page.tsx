'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PaginationControl } from '@/components/shared/pagination-control';
import { useQuery } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { formatDate, formatPrice } from '@/lib/utils';

export default function ShipperHistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['shipper-history', page],
    queryFn: () => shipperService.getMyOrders({ page, limit: 10, status: 'delivered' }),
  });
  const orders = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  return (
    <div className="pb-20 px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Lịch Sử Giao Hàng</h1>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order: any, i: number) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/shipper/orders/${order._id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-secondary-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">#{order.orderCode}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-success-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Đã giao
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {order.shippingAddress?.district}, {order.shippingAddress?.province}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Chưa có lịch sử giao hàng</p>
              </div>
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4">
              <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
