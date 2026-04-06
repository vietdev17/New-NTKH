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

  const r = report as any;

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
            <StatsCard title="Tổng doanh thu" value={formatPrice(r?.totalRevenue || 0)} icon={DollarSign} color="primary" delay={0} />
            <StatsCard title="Tổng đơn hàng" value={r?.totalOrders || 0} icon={ShoppingCart} color="success" delay={0.05} />
            <StatsCard title="Đơn trung bình" value={formatPrice(r?.avgOrderValue || 0)} icon={Package} color="accent" delay={0.1} />
            <StatsCard title="Khách mới" value={r?.newCustomers || 0} icon={Users} color="warning" delay={0.15} />
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
              <BarChart data={r?.dailyRevenue || []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: any) => [formatPrice(v), 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
          >
            <h2 className="font-semibold mb-4">Sản phẩm bán chạy nhất</h2>
            <div className="space-y-3">
              {(r?.topProducts || []).map((p: any, i: number) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-200 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-sm font-semibold text-primary-600">{formatPrice(p.revenue)}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-400 rounded-full"
                        style={{ width: `${Math.min(100, (p.sold / (r?.topProducts?.[0]?.sold || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Đã bán: {p.sold}</p>
                  </div>
                </div>
              ))}
              {(!r?.topProducts || r.topProducts.length === 0) && (
                <p className="text-gray-400 text-center py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
