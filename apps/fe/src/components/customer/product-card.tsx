'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/shared/price-display';
import { useCartStore } from '@/stores/use-cart-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toggle, isWished } = useWishlistStore();
  const wished = isWished(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product._id,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
      },
      price: product.salePrice || product.basePrice,
      quantity: 1,
    });
    toast.success('Da them vao gio hang!');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggle(product._id);
    toast.success(wished ? 'Da xoa khoi yeu thich' : 'Da them vao yeu thich!');
  };

  const discountPercent =
    product.salePrice && product.basePrice > product.salePrice
      ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
      : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn('group relative', className)}
    >
      <Link href={`/products/${product.slug}`}>
        <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-300">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
            <Image
              src={product.images[0] || '/images/placeholder.svg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discountPercent > 0 && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5">
                  -{discountPercent}%
                </Badge>
              )}
              {product.isFeatured && (
                <Badge className="text-xs px-2 py-0.5 bg-secondary-500">
                  Noi bat
                </Badge>
              )}
            </div>
            {/* Wishlist button */}
            <button
              onClick={handleToggleWishlist}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            >
              <Heart
                className={cn('h-4 w-4 transition-colors', wished ? 'fill-danger-500 text-danger-500' : 'text-gray-400')}
              />
            </button>
            {/* Quick view overlay */}
            <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <Button
                onClick={handleAddToCart}
                className="w-full h-9 text-sm gap-2 bg-white/95 text-primary-600 hover:bg-white hover:text-primary-700 shadow-sm"
                variant="ghost"
              >
                <ShoppingCart className="h-4 w-4" />
                Them vao gio
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <p className="text-xs text-gray-400 mb-1">{(product as any).categoryId?.name || (product as any).category?.name}</p>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <PriceDisplay
                price={product.salePrice || product.basePrice}
                originalPrice={product.salePrice ? product.basePrice : undefined}
                size="sm"
              />
              {(product as any).rating?.average > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{(product as any).rating.average.toFixed(1)}</span>
                </div>
              )}
            </div>
            {(product as any).totalSold > 0 && (
              <p className="text-xs text-gray-400 mt-1">Da ban {(product as any).totalSold.toLocaleString()}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
