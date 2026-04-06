'use client';
import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/customer/product-card';
import { CategoryTreeSidebar } from '@/components/customer/category-tree-sidebar';
import { PaginationControl } from '@/components/shared/pagination-control';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptySearch } from '@/components/shared/empty-state';
import { useProducts } from '@/hooks/use-products';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'createdAt:desc';
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  const { data, isLoading } = useProducts({ page, limit: 12, sort, category, search, minPrice, maxPrice });

  const products = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== 'page') params.set('page', '1');
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="container-custom py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Tat Ca San Pham</h1>
          {meta && (
            <p className="text-sm text-gray-500 mt-0.5">
              Hien thi {products.length} / {meta.total} san pham
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className="lg:hidden gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bo loc
          </Button>
          <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar - desktop */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            <CategoryTreeSidebar activeSlug={category} />
          </div>
          <ProductFilters onFilterChange={updateParam} searchParams={searchParams} />
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-gray-100 animate-pulse aspect-[4/5]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptySearch />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <PaginationControl
                  page={page}
                  totalPages={meta.totalPages}
                  onPageChange={(p) => updateParam('page', String(p))}
                  className="mt-8"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductFilters({ onFilterChange, searchParams }: { onFilterChange: (key: string, value: string) => void; searchParams: any }) {
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-6 sticky top-24">
      <h3 className="font-semibold text-gray-900">Bo Loc San Pham</h3>

      {/* Price range */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Khoang Gia</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Tu"
            defaultValue={minPrice}
            className="h-8 w-full rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:border-primary-500"
            onBlur={(e) => onFilterChange('minPrice', e.target.value)}
          />
          <span className="text-gray-400 shrink-0">-</span>
          <input
            type="number"
            placeholder="Den"
            defaultValue={maxPrice}
            className="h-8 w-full rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:border-primary-500"
            onBlur={(e) => onFilterChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* Quick price filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Duoi 2tr', min: '', max: '2000000' },
          { label: '2-5tr', min: '2000000', max: '5000000' },
          { label: '5-10tr', min: '5000000', max: '10000000' },
          { label: 'Tren 10tr', min: '10000000', max: '' },
        ].map((r) => (
          <button
            key={r.label}
            onClick={() => {
              onFilterChange('minPrice', r.min);
              onFilterChange('maxPrice', r.max);
            }}
            className="px-3 py-1 rounded-full text-xs border border-gray-200 hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            {r.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          onFilterChange('minPrice', '');
          onFilterChange('maxPrice', '');
          onFilterChange('category', '');
        }}
        className="w-full text-sm text-danger-500 hover:text-danger-600 font-medium"
      >
        Xoa tat ca bo loc
      </button>
    </div>
  );
}
