'use client';
import { motion } from 'framer-motion';
import { DollarSign, Package, Users, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import { StatsCard } from '@/components/admin/stats-card';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { OrderStatusChart } from '@/components/admin/order-status-chart';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => reportService.getDashboard(),
  });

  const d = dashboard as any;

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Doanh thu hôm nay"
          value={formatPrice(d?.todayRevenue || 0)}
          icon={DollarSign}
          change={d?.revenueChange}
          changeLabel="so hôm qua"
          color="primary"
          delay={0}
        />
        <StatsCard
          title="Đơn hàng mới"
          value={d?.todayOrders || 0}
          icon={ShoppingCart}
          change={d?.ordersChange}
          changeLabel="so hôm qua"
          color="success"
          delay={0.05}
        />
        <StatsCard
          title="Khách hàng mới"
          value={d?.newCustomers || 0}
          icon={Users}
          change={d?.customersChange}
          changeLabel="so hôm qua"
          color="accent"
          delay={0.1}
        />
        <StatsCard
          title="Sản phẩm bán"
          value={d?.soldProducts || 0}
          icon={Package}
          change={d?.productsChange}
          changeLabel="so hôm qua"
          color="warning"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Doanh thu 30 ngày</h2>
            <div className="flex items-center gap-1.5 text-xs text-success-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Tháng này</span>
            </div>
          </div>
          <RevenueChart data={d?.revenueChart || []} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
        >
          <h2 className="font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
          <OrderStatusChart data={d?.orderStatusStats || []} />
        </motion.div>
      </div>

      {/* Recent orders + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary-500" />
            <h2 className="font-semibold">Đơn hàng gần đây</h2>
          </div>
          <div className="space-y-3">
            {(d?.recentOrders || []).map((order: any) => (
              <div key={order._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">#{order.orderCode}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} type="order" />
                  <span className="font-semibold text-primary-600">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
            {(!d?.recentOrders || d.recentOrders.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">Chưa có đơn hàng</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
        >
          <h2 className="font-semibold mb-4">Sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {(d?.topProducts || []).map((p: any, i: number) => (
              <div key={p._id} className="flex items-center gap-3 text-sm">
                <span className="text-lg font-bold text-gray-200 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400">Đã bán: {p.sold}</p>
                </div>
                <span className="font-semibold text-primary-600">{formatPrice(p.revenue)}</span>
              </div>
            ))}
            {(!d?.topProducts || d.topProducts.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
