'use client';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/customer/product-card';
import { EmptyWishlist } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAuthStore } from '@/stores/use-auth-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { productIds } = useWishlistStore();

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const results = await Promise.all(
        productIds.slice(0, 20).map((id) => productService.getProductById(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: productIds.length > 0,
  });

  return (
    <div className="container-custom py-6 lg:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-6 w-6 text-primary-500" />
        <h1 className="text-2xl font-bold">Sản Phẩm Yêu Thích</h1>
        {productIds.length > 0 && (
          <span className="bg-primary-100 text-primary-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {productIds.length}
          </span>
        )}
      </div>

      {productIds.length === 0 ? (
        <EmptyWishlist />
      ) : isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {(products as any[])?.map((product: any, i: number) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
