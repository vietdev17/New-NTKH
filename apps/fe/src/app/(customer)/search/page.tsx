'use client';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/customer/product-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptySearch } from '@/components/shared/empty-state';
import { PaginationControl } from '@/components/shared/pagination-control';
import { useProducts } from '@/hooks/use-products';
import { useState } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [page, setPage] = useState(1);

  const { data, isLoading } = useProducts({ search: q, page, limit: 12 });
  const products = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  return (
    <div className="container-custom py-6 lg:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold">Kết quả tìm kiếm</h1>
          {q && (
            <p className="text-gray-500 text-sm mt-0.5">
              {meta?.total ?? 0} kết quả cho &ldquo;<span className="text-primary-600 font-medium">{q}</span>&rdquo;
            </p>
          )}
        </div>
      </div>

      {!q ? (
        <div className="text-center py-16 text-gray-500">Nhập từ khóa để tìm kiếm sản phẩm</div>
      ) : isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : products.length === 0 ? (
        <EmptySearch />
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
