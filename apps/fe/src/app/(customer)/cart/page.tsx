'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/shared/price-display';
import { EmptyCart } from '@/components/shared/empty-state';
import { useCartStore } from '@/stores/use-cart-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getShippingFee, getTotal, couponCode, couponDiscount } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container-custom py-16">
        <h1 className="text-2xl font-bold mb-8">Giỏ Hàng</h1>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container-custom py-6 lg:py-10">
      <h1 className="text-2xl font-bold mb-6">Giỏ Hàng ({items.length} sản phẩm)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-card">
                  <Link href={`/products/${item.product.slug}`}>
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                      <Image
                        src={item.product.images[0] || '/images/placeholder.svg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 text-sm sm:text-base">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.variant.colorName} / {item.variant.dimensionLabel}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 text-sm font-medium"
                        >
                          -
                        </button>
                        <span className="h-8 w-8 flex items-center justify-center text-sm font-medium border-x border-gray-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-gray-50 text-sm font-medium"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-primary-600">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-gray-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4 sticky top-24">
            <h2 className="text-lg font-bold">Tóm Tắt Đơn Hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tạm tính</span>
                <span className="font-medium">{formatPrice(getSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span className={getShippingFee() === 0 ? 'text-success-600 font-medium' : 'font-medium'}>
                  {getShippingFee() === 0 ? 'Miễn phí' : formatPrice(getShippingFee())}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Giảm giá ({couponCode})</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(getTotal())}</span>
              </div>
            </div>
            {getShippingFee() > 0 && (
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                💡 Mua thêm {formatPrice(2000000 - getSubtotal())} để được miễn phí vận chuyển
              </p>
            )}
            <Button asChild size="lg" className="w-full gap-2">
              <Link href="/checkout">
                Thanh Toán <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link href="/products">
                <ShoppingBag className="h-4 w-4" /> Tiếp Tục Mua Sắm
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
