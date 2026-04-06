'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Package } from 'lucide-react';
import { StatsCard } from '@/components/admin/stats-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { formatPrice } from '@/lib/utils';

export default function POSReportsPage() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['pos-today-report'],
    queryFn: () => reportService.getPosReport(),
  });

  const r = report as any;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Báo Cáo Hôm Nay</h1>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatsCard title="Doanh thu" value={formatPrice(r?.revenue || 0)} icon={DollarSign} color="primary" delay={0} />
            <StatsCard title="Số đơn" value={r?.orders || 0} icon={ShoppingCart} color="success" delay={0.05} />
            <StatsCard title="Sản phẩm bán" value={r?.itemsSold || 0} icon={Package} color="accent" delay={0.1} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-100 shadow-card p-5"
          >
            <h2 className="font-semibold mb-4">Doanh thu theo giờ</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={r?.hourlyRevenue || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v/1000}K`} />
                <Tooltip formatter={(v: any) => [formatPrice(v), 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
