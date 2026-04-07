'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/customer/product-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PaginationControl } from '@/components/shared/pagination-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/use-products';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { useState, useEffect } from 'react';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
  });

  const { data, isLoading } = useProducts({
    category: slug,
    page,
    limit: 16,
    sort,
  });
  const products = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  return (
    <div className="container-custom py-6 lg:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {(category as any)?.name || 'Danh mục'}
        </h1>
        {(category as any)?.description && (
          <p className="text-gray-500 mt-1">{(category as any).description}</p>
        )}
        {meta && (
          <p className="text-sm text-gray-400 mt-1">{meta.total} sản phẩm</p>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Sắp xếp</span>
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Không có sản phẩm trong danh mục này</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product: any, i: number) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="mt-8">
              <PaginationControl
                currentPage={page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
