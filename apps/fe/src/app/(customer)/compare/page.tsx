'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GitCompareArrows, X, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PriceDisplay } from '@/components/shared/price-display';
import { useComparisonStore } from '@/stores/use-comparison-store';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';

const SPEC_ROWS = [
  { label: 'Thương hiệu', key: 'brand' },
  { label: 'Danh mục', key: 'categoryId.name' },
  { label: 'Vật liệu', key: 'material' },
  { label: 'Xuất xứ', key: 'origin' },
  { label: 'Bảo hành', key: 'warranty' },
];

function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export default function ComparePage() {
  const { productIds, removeProduct, clearAll } = useComparisonStore();

  const { data: products, isLoading } = useQuery({
    queryKey: ['compare-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const results = await Promise.all(
        productIds.map((id) => productService.getProductById(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: productIds.length > 0,
  });

  const cols = (products as any[]) || [];

  return (
    <div className="container-custom py-6 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold">So Sánh Sản Phẩm</h1>
        </div>
        {productIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            Xóa tất cả
          </Button>
        )}
      </div>

      {productIds.length === 0 ? (
        <div className="text-center py-20">
          <GitCompareArrows className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có sản phẩm nào để so sánh</p>
          <Button asChild className="mt-4">
            <Link href="/products">Xem sản phẩm</Link>
          </Button>
        </div>
      ) : isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <td className="w-32 p-3 bg-gray-50 border border-gray-100 font-medium text-sm text-gray-500">
                  Sản phẩm
                </td>
                {cols.map((p: any) => (
                  <td key={p._id} className="p-3 border border-gray-100 text-center min-w-[180px]">
                    <div className="relative group">
                      <button
                        onClick={() => removeProduct(p._id)}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gray-100 hover:bg-danger-100 hover:text-danger-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="relative h-28 w-full rounded-lg overflow-hidden bg-gray-50 mb-2">
                        <Image
                          src={p.images?.[0] || '/images/placeholder.svg'}
                          alt={p.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Link href={`/products/${p.slug}`} className="text-sm font-medium hover:text-primary-600 line-clamp-2">
                        {p.name}
                      </Link>
                      <div className="mt-1">
                        <PriceDisplay price={p.salePrice || p.basePrice} originalPrice={p.salePrice ? p.basePrice : undefined} size="sm" />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Rating */}
              <tr>
                <td className="p-3 bg-gray-50 border border-gray-100 font-medium text-sm">Đánh giá</td>
                {cols.map((p: any) => (
                  <td key={p._id} className="p-3 border border-gray-100 text-center text-sm">
                    ⭐ {p.rating?.average?.toFixed(1) || '—'} ({p.rating?.count || 0})
                  </td>
                ))}
              </tr>
              {/* Stock */}
              <tr>
                <td className="p-3 bg-gray-50 border border-gray-100 font-medium text-sm">Còn hàng</td>
                {cols.map((p: any) => (
                  <td key={p._id} className="p-3 border border-gray-100 text-center">
                    {p.status === 'active' ? (
                      <Check className="h-4 w-4 text-success-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-danger-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              {/* Spec rows */}
              {SPEC_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="p-3 bg-gray-50 border border-gray-100 font-medium text-sm">{row.label}</td>
                  {cols.map((p: any) => {
                    const val = getNestedValue(p, row.key);
                    return (
                      <td key={p._id} className="p-3 border border-gray-100 text-center text-sm text-gray-600">
                        {val || <Minus className="h-3.5 w-3.5 text-gray-300 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Add to cart row */}
              <tr>
                <td className="p-3 bg-gray-50 border border-gray-100" />
                {cols.map((p: any) => (
                  <td key={p._id} className="p-3 border border-gray-100 text-center">
                    <Button size="sm" asChild>
                      <Link href={`/products/${p.slug}`}>Xem chi tiết</Link>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
