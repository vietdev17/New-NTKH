'use client';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { formatPrice, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ShipperEarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['shipper-earnings'],
    queryFn: () => shipperService.getMyEarnings(),
  });
  const d = data as any;

  return (
    <div className="pb-20 px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Thu Nhập</h1>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <p className="text-xs text-gray-500 mb-1">Hôm nay</p>
              <p className="text-xl font-bold text-primary-600">{formatPrice(d?.todayEarnings || 0)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <p className="text-xs text-gray-500 mb-1">Tháng này</p>
              <p className="text-xl font-bold text-secondary-600">{formatPrice(d?.monthEarnings || 0)}</p>
            </motion.div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <h2 className="font-semibold text-sm mb-3">7 ngày gần đây</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={d?.weeklyEarnings || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v/1000}K`} />
                <Tooltip formatter={(v: any) => [formatPrice(v), 'Thu nhập']} />
                <Bar dataKey="amount" fill="#2D5016" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent transactions */}
          <div>
            <h2 className="font-semibold mb-3">Giao dịch gần đây</h2>
            <div className="space-y-2">
              {(d?.recentTransactions || []).map((t: any, i: number) => (
                <motion.div
                  key={t._id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">#{t.orderCode}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                  </div>
                  <p className="font-semibold text-success-600">+{formatPrice(t.amount)}</p>
                </motion.div>
              ))}
              {(!d?.recentTransactions || d.recentTransactions.length === 0) && (
                <p className="text-center text-gray-400 text-sm py-8">Chưa có giao dịch</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
