'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, Building2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'bank_transfer', label: 'Chuyển khoản', icon: Building2 },
];

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (paymentMethod: string, cashReceived?: number) => void;
  isLoading?: boolean;
}

export function PaymentModal({ open, onOpenChange, total, onConfirm, isLoading }: PaymentModalProps) {
  const [method, setMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');

  const change = method === 'cash' && cashReceived ? Math.max(0, Number(cashReceived) - total) : 0;

  const handleConfirm = () => {
    onConfirm(method, method === 'cash' ? Number(cashReceived) : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Total */}
          <div className="bg-primary-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
            <p className="text-3xl font-bold text-primary-600">{formatPrice(total)}</p>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Phương thức thanh toán</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                      method === m.value
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash received */}
          {method === 'cash' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tiền khách đưa</Label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  className="text-lg font-semibold text-right"
                />
              </div>
              {change > 0 && (
                <div className="flex items-center justify-between bg-success-50 rounded-lg p-3">
                  <span className="text-sm text-success-700">Tiền thừa</span>
                  <span className="font-bold text-success-600">{formatPrice(change)}</span>
                </div>
              )}
              {/* Quick amount buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashReceived(String(amt))}
                    className="text-xs bg-gray-50 hover:bg-gray-100 rounded-lg py-2 font-medium text-gray-600 transition-colors"
                  >
                    {amt >= 1000000 ? `${amt/1000000}M` : `${amt/1000}K`}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <Button
            className="w-full h-12 gap-2 text-base font-semibold"
            onClick={handleConfirm}
            disabled={isLoading || (method === 'cash' && Number(cashReceived) < total)}
          >
            <CheckCircle className="h-5 w-5" />
            {isLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
