'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatsCard } from '@/components/admin/stats-card';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { formatPrice } from '@/lib/utils';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

export default function AdminReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['admin-report', startDate, endDate],
    queryFn: () => reportService.getRevenueReport({ startDate, endDate }),
  });

  const response = report as any;
  const summary = response?.summary;
  const chartData = response?.data || [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Báo Cáo Doanh Thu</h1>

      {/* Date filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label>Từ ngày</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label>Đến ngày</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div>
        <Button onClick={() => refetch()} className="gap-2">
          <Calendar className="h-4 w-4" />
          Xem báo cáo
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Tổng doanh thu" value={formatPrice(summary?.totalRevenue || 0)} icon={DollarSign} color="primary" delay={0} />
            <StatsCard title="Tổng đơn hàng" value={summary?.totalOrders || 0} icon={ShoppingCart} color="success" delay={0.05} />
            <StatsCard title="Đơn trung bình" value={formatPrice(summary?.avgOrderValue || 0)} icon={Package} color="accent" delay={0.1} />
            <StatsCard title="Khách mới" value={summary?.newCustomers || 0} icon={Users} color="warning" delay={0.15} />
          </div>

          {/* Revenue by day */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
          >
            <h2 className="font-semibold mb-4">Doanh thu theo ngày</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: any) => [formatPrice(v), 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top products - API không có dữ liệu này */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
          >
            <h2 className="font-semibold mb-4">Sản phẩm bán chạy nhất</h2>
            <p className="text-gray-400 text-center py-4">Chưa có dữ liệu</p>
          </motion.div>
        </>
      )}
    </div>
  );
}
