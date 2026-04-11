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

  const data = dashboard as any;

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
          value={formatPrice(data?.revenue?.today || 0)}
          icon={DollarSign}
          color="primary"
          delay={0}
        />
        <StatsCard
          title="Đơn hàng mới"
          value={data?.orders?.total || 0}
          icon={ShoppingCart}
          color="success"
          delay={0.05}
        />
        <StatsCard
          title="Khách hàng mới"
          value={data?.customers?.newThisMonth || 0}
          icon={Users}
          color="accent"
          delay={0.1}
        />
        <StatsCard
          title="Sản phẩm"
          value={data?.products?.total || 0}
          icon={Package}
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
          <RevenueChart data={[]} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
        >
          <h2 className="font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
          <OrderStatusChart data={data?.orders?.byStatus || {}} />
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
          <p className="text-gray-400 text-sm text-center py-4">Chưa có dữ liệu</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
        >
          <h2 className="font-semibold mb-4">Sản phẩm bán chạy</h2>
          <p className="text-gray-400 text-sm text-center py-4">Chưa có dữ liệu</p>
        </motion.div>
      </div>
    </div>
  );
}
