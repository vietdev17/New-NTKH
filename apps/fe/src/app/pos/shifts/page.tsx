'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, StopCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { usePosStore } from '@/stores/use-pos-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService } from '@/services/shift.service';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function POSShiftsPage() {
  const { currentShift, setCurrentShift } = usePosStore();
  const queryClient = useQueryClient();
  const [openingBalance, setOpeningBalance] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-shifts'],
    queryFn: () => shiftService.getMyShifts(),
  });
  const shifts = (data as any)?.data || [];

  const openShiftMutation = useMutation({
    mutationFn: (openingBalance: number) => shiftService.openShift({ openingBalance }),
    onSuccess: (data: any) => {
      setCurrentShift(data);
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      toast.success('Ca làm việc đã bắt đầu');
    },
    onError: () => toast.error('Không thể mở ca'),
  });

  const closeShiftMutation = useMutation({
    mutationFn: ({ id, closingBalance }: any) => shiftService.closeShift(id, { closingBalance }),
    onSuccess: () => {
      setCurrentShift(null);
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      toast.success('Ca làm việc đã kết thúc');
    },
    onError: () => toast.error('Không thể đóng ca'),
  });

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Quản Lý Ca Làm Việc</h1>

      {/* Current shift status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-5 ${currentShift ? 'border-success-200 bg-success-50' : 'border-gray-100 bg-white shadow-card'}`}
      >
        {currentShift ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
              <p className="font-semibold text-success-700">Ca đang hoạt động</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <p className="text-gray-500">Bắt đầu</p>
                <p className="font-medium">{formatDateTime((currentShift as any).startTime)}</p>
              </div>
              <div>
                <p className="text-gray-500">Số dư đầu ca</p>
                <p className="font-medium">{formatPrice((currentShift as any).openingBalance || 0)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Số dư cuối ca (tiền mặt)"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                id="closing-balance"
              />
              <Button
                variant="outline"
                className="border-danger-300 text-danger-500 hover:bg-danger-50 gap-2"
                onClick={() => {
                  const val = (document.getElementById('closing-balance') as HTMLInputElement)?.value;
                  closeShiftMutation.mutate({ id: (currentShift as any)._id, closingBalance: Number(val) || 0 });
                }}
                disabled={closeShiftMutation.isPending}
              >
                <StopCircle className="h-4 w-4" />
                Kết thúc ca
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <p className="font-semibold text-gray-700">Chưa có ca làm việc</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="Số dư đầu ca (tiền mặt)"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <Button
                className="gap-2"
                onClick={() => openShiftMutation.mutate(Number(openingBalance) || 0)}
                disabled={openShiftMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Bắt đầu ca
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Shift history */}
      <div>
        <h2 className="font-semibold mb-3">Lịch sử ca làm việc</h2>
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <div className="space-y-3">
            {shifts.map((shift: any) => (
              <div key={shift._id} className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${shift.status === 'open' ? 'bg-success-500' : 'bg-gray-300'}`} />
                    <span className="font-medium text-sm">{formatDate(shift.startTime)}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${shift.status === 'open' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                    {shift.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Đơn hàng</p>
                    <p className="font-medium">{shift.orderCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Doanh thu</p>
                    <p className="font-medium text-primary-600">{formatPrice(shift.totalRevenue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Tiền mặt</p>
                    <p className="font-medium">{formatPrice(shift.cashRevenue || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
