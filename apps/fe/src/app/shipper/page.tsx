'use client';
import { motion } from 'framer-motion';
import { Package, CheckCircle, DollarSign, Truck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { useQuery } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { useAuthStore } from '@/stores/use-auth-store';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';

function StatItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function ShipperDashboardPage() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['shipper-dashboard'],
    queryFn: () => shipperService.getMyDashboard(),
  });

  const d = dashboard as any;

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary-600 to-secondary-800 text-white px-4 pt-6 pb-8">
        <p className="text-secondary-200 text-sm">Xin chào,</p>
        <h1 className="text-2xl font-bold mt-0.5">{user?.fullName}</h1>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`h-2 w-2 rounded-full ${d?.isAvailable ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="text-sm text-secondary-200">{d?.isAvailable ? 'Đang hoạt động' : 'Không khả dụng'}</span>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatItem icon={Package} label="Đơn hôm nay" value={d?.todayDeliveries || 0} color="bg-primary-500" />
          <StatItem icon={CheckCircle} label="Đã giao" value={d?.completedToday || 0} color="bg-success-500" />
          <StatItem icon={DollarSign} label="Thu nhập hôm nay" value={formatPrice(d?.todayEarnings || 0)} color="bg-secondary-500" />
          <StatItem icon={Truck} label="Tổng đã giao" value={d?.totalDeliveries || 0} color="bg-accent-600" />
        </motion.div>

        {/* Pending orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Đơn hàng cần giao</h2>
            <Link href="/shipper/orders" className="text-sm text-secondary-600">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {(d?.pendingOrders || []).map((order: any, i: number) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">#{order.orderNumber || order.orderCode}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <StatusBadge status={order.status} type="order" />
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-secondary-500 mt-0.5 shrink-0" />
                  <p className="text-xs line-clamp-2">
                    {order.shippingStreet || order.shippingAddress?.street}, {order.shippingDistrict || order.shippingAddress?.district}, {order.shippingProvince || order.shippingAddress?.province}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" asChild className="flex-1 h-8 text-xs">
                    <Link href={`/shipper/orders/${order._id}`}>Chi tiết</Link>
                  </Button>
                  <Button size="sm" className="flex-1 h-8 text-xs bg-secondary-600 hover:bg-secondary-700" asChild>
                    <Link href={`/shipper/orders/${order._id}`}>Bắt đầu giao</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
            {(!d?.pendingOrders || d.pendingOrders.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Không có đơn hàng cần giao</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
