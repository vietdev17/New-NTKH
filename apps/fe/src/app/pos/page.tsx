'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PosCart } from '@/components/pos/pos-cart';
import { PaymentModal } from '@/components/pos/payment-modal';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PriceDisplay } from '@/components/shared/price-display';
import { usePosStore } from '@/stores/use-pos-store';
import { useProducts } from '@/hooks/use-products';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { orderService } from '@/services/order.service';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function POSPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { addToCart, clearCart, getTotal, cart, coupon, selectedCustomerId, selectedCustomer } = usePosStore();
  const queryClient = useQueryClient();
  const createOrder = useMutation({
    mutationFn: (data: any) => orderService.createPosOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-pos'],
    queryFn: () => categoryService.getCategories({ limit: 100 }),
  });

  const { data, isLoading } = useProducts({
    search: debouncedSearch,
    category: category === 'all' ? undefined : category,
    limit: 24,
    page: 1,
  });
  const products = (data as any)?.data || [];

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product._id,
      variantId: undefined,
      name: product.name,
      price: product.salePrice || product.basePrice,
      quantity: 1,
      image: product.images?.[0],
    });
    toast.success(`Đã thêm ${product.name}`, { duration: 1000 });
  };

  const handlePayment = async (paymentMethod: string, cashReceived?: number) => {
    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          variantSku: item.variantId || undefined,
          quantity: item.quantity,
        })),
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer?.fullName || 'Khách lẻ',
        customerPhone: selectedCustomer?.phone || '0000000000',
        paymentMethod,
        couponCode: coupon?.code,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      };
      await createOrder.mutateAsync(orderData);
      toast.success('Thanh toán thành công!');
      clearCart();
      setPaymentOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Thanh toán thất bại');
    }
  };

  return (
    <div className="flex h-full gap-0">
      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Search bar */}
        <div className="bg-white border-b px-4 py-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="pl-9 h-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {((categories as any)?.data || []).map((c: any) => (
                <SelectItem key={c._id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <LoadingSpinner className="py-16" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product: any) => (
                <button
                  key={product._id}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white rounded-xl border border-gray-100 p-3 text-left hover:border-primary-300 hover:shadow-card-hover transition-all active:scale-95"
                >
                  <div className="relative h-24 w-full rounded-lg overflow-hidden bg-gray-50 mb-2">
                    <Image
                      src={product.images?.[0] || '/images/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {product.salePrice && product.salePrice < product.basePrice && (
                      <div className="absolute top-1 left-1 bg-danger-500 text-white text-[10px] px-1 rounded">
                        -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-sm font-bold text-primary-600">
                    {formatPrice(product.salePrice || product.basePrice)}
                  </p>
                </button>
              ))}
              {products.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Không tìm thấy sản phẩm
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart - right panel */}
      <div className="w-80 shrink-0 border-l flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        <PosCart onCheckout={() => setPaymentOpen(true)} />
      </div>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={getTotal()}
        onConfirm={handlePayment}
        isLoading={createOrder.isPending}
      />
    </div>
  );
}
