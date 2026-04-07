'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="h-24 w-24 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="h-12 w-12 text-success-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt Hàng Thành Công!</h1>
          <p className="text-gray-500 mb-6">
            Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý và giao hàng trong thời gian sớm nhất.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500">Mã đơn hàng</p>
              <p className="font-mono font-bold text-primary-600">#{orderId.slice(-8).toUpperCase()}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {orderId && (
              <Button asChild className="gap-2">
                <Link href={`/orders/${orderId}`}>
                  <Package className="h-4 w-4" /> Xem Đơn Hàng
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="gap-2">
              <Link href="/products">
                Tiếp Tục Mua Sắm <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
