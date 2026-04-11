'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Banknote, Building2, CheckCircle, Printer, Loader2, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Receipt } from './receipt';

type PaymentMethodType = 'cash' | 'bank_transfer' | 'deposit_cash' | 'deposit_bank';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onConfirm: (paymentMethod: string, cashReceived?: number, depositAmount?: number) => void;
  isLoading?: boolean;
  customer?: { fullName: string; phone: string; address?: string } | null;
  cashierName?: string;
  cartItems?: Array<{ name: string; variantLabel?: string; quantity: number; unitPrice: number; total: number }>;
}

const PAYMENT_METHODS: Array<{ value: PaymentMethodType; label: string; icon: any; desc?: string }> = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'bank_transfer', label: 'Chuyển khoản', icon: Building2 },
  { value: 'deposit_cash', label: 'Đặt cọc TM', icon: Wallet, desc: 'Cọc 1 phần, giao sau' },
  { value: 'deposit_bank', label: 'Đặt cọc CK', icon: Wallet, desc: 'Cọc 1 phần, giao sau' },
];

export function PaymentModal({ open, onOpenChange, total, onConfirm, isLoading, customer, cashierName, cartItems }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethodType>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPercent, setDepositPercent] = useState(50);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setMethod('cash');
      setCashReceived('');
      setDepositAmount('');
      setDepositPercent(50);
      setShowReceipt(false);
      setOrderResult(null);
    }
  }, [open]);

  const isDeposit = method === 'deposit_cash' || method === 'deposit_bank';
  const isBank = method === 'bank_transfer' || method === 'deposit_bank';

  const change = method === 'cash' && cashReceived ? Math.max(0, Number(cashReceived) - total) : 0;

  const depositValue = isDeposit
    ? depositAmount
      ? Number(depositAmount)
      : Math.round((total * depositPercent) / 100)
    : 0;

  const remainingAmount = isDeposit ? Math.max(0, total - depositValue) : 0;

  const handlePrint = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleConfirm = () => {
    let finalMethod = method;
    if (isDeposit) {
      finalMethod = method === 'deposit_cash' ? 'deposit_cash' : 'deposit_bank';
    }

    if (isDeposit) {
      onConfirm(finalMethod, undefined, depositValue);
    } else if (method === 'cash') {
      onConfirm('cash', Number(cashReceived));
    } else {
      onConfirm('bank_transfer');
    }
  };

  // Build a fake order for receipt display
  const receiptOrder = {
    orderNumber: orderResult?.orderNumber || 'POS-...',
    createdAt: orderResult?.createdAt || new Date().toISOString(),
    items: cartItems || [],
    subtotal: cartItems ? cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0) : total,
    discountAmount: 0,
    total,
    paidAmount: isDeposit ? depositValue : (method === 'cash' ? Number(cashReceived) : total),
    paymentMethod: isDeposit ? 'deposit' : method,
    customer: customer ? { fullName: customer.fullName, phone: customer.phone, address: customer.address } : null,
    cashReceived: method === 'cash' ? Number(cashReceived) : undefined,
    changeAmount: change > 0 ? change : undefined,
  };

  const canConfirm = isLoading
    ? false
    : isDeposit
    ? depositValue > 0 && depositValue <= total
    : method === 'cash'
    ? Number(cashReceived) >= total
    : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {orderResult ? 'Thanh toán thành công!' : 'Xác nhận thanh toán'}
          </DialogTitle>
        </DialogHeader>

        {/* ===== SUCCESS STATE ===== */}
        <AnimatePresence>
          {orderResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="h-16 w-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-success-500" />
                </div>
                <p className="font-semibold text-lg">
                  {isDeposit ? 'Đặt cọc thành công!' : 'Thanh toán thành công!'}
                </p>
                <p className="text-sm text-gray-500">
                  Ma don: <span className="font-mono font-medium">{orderResult.orderNumber}</span>
                </p>
                {isDeposit && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Da coc:</span>
                      <span className="font-bold text-amber-800">{formatPrice(depositValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Con lai:</span>
                      <span className="font-bold text-amber-800">{formatPrice(remainingAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  In hoa don
                </Button>
                <Button className="flex-1" onClick={() => onOpenChange(false)}>
                  Don moi
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== PAYMENT FORM ===== */}
        {!orderResult && (
          <div className="space-y-5 mt-2">
            {/* Total */}
            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
              <p className="text-3xl font-bold text-primary-600">{formatPrice(total)}</p>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Phương thức</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const selected = method === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMethod(m.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                        selected
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-gray-100 hover:border-gray-200 text-gray-600'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{m.label}</span>
                      {m.desc && (
                        <span className="text-[10px] text-gray-400">{m.desc}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===== DEPOSIT INPUT ===== */}
            {isDeposit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Khách đặt cọc 1 phần, số tiền còn lại thanh toán khi nhận hàng (COD).
                </div>
                <div className="space-y-1.5">
                  <Label>Số tiền đặt cọc</Label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[30, 50, 70].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setDepositPercent(p);
                          setDepositAmount('');
                        }}
                        className={cn(
                          'text-xs py-2 rounded-lg border font-medium transition-colors',
                          depositPercent === p && !depositAmount
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-gray-200 text-gray-600 hover:border-amber-300'
                        )}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        setDepositPercent(0);
                      }}
                      placeholder="Nhập số tiền..."
                      className="flex-1 text-right font-semibold"
                    />
                    <div className="flex items-center px-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                      đ
                    </div>
                  </div>
                </div>
                {depositValue > 0 && (
                  <div className="bg-success-50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-success-700">Da coc:</span>
                      <span className="font-bold text-success-800">{formatPrice(depositValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">Con lai (COD):</span>
                      <span className="font-bold text-amber-800">{formatPrice(remainingAmount)}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== CASH INPUT ===== */}
            {method === 'cash' && !isDeposit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
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
                <div className="grid grid-cols-4 gap-2">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(String(amt))}
                      className="text-xs bg-gray-50 hover:bg-gray-100 rounded-lg py-2 font-medium text-gray-600 transition-colors"
                    >
                      {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                    </button>
                  ))}
                </div>
                {/* Quick full amount */}
                <button
                  onClick={() => setCashReceived(String(Math.ceil(total / 1000) * 1000))}
                  className="w-full text-xs text-primary-600 hover:text-primary-700 py-1"
                >
                  Đúng số tiền — tap here
                </button>
              </motion.div>
            )}

            {/* ===== BANK TRANSFER ===== */}
            {method === 'bank_transfer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <p className="font-medium mb-2">Thông tin chuyển khoản</p>
                  <p>Vui lòng chuyển khoản đúng số tiền <strong>{formatPrice(total)}</strong></p>
                  <p className="mt-1">Nội dung: <strong>{customer?.phone || 'POS'}</strong></p>
                </div>
              </motion.div>
            )}

            {/* ===== CONFIRM BUTTON ===== */}
            <Button
              className="w-full h-12 gap-2 text-base font-semibold"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang xu ly...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {isDeposit
                    ? `Xac nhan dat coc ${formatPrice(depositValue)}`
                    : 'Xac nhan thanh toan'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Hidden receipt for printing */}
        {showReceipt && (
          <div className="hidden print:block fixed inset-0 z-[-1]">
            <Receipt
              ref={receiptRef}
              order={receiptOrder}
              cashierName={cashierName}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
