# CUSTOMER - PRODUCTS & COMPARISON

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/products/`, `apps/fe/src/app/(customer)/compare/`, `apps/fe/src/app/(customer)/categories/`, `apps/fe/src/app/(customer)/search/`
> Bao gom: ProductListingPage, FilterSidebar, ProductDetailPage, ComparisonPage, CategoryPage, SearchPage
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + React Query + Zustand
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [ProductListingPage](#1-productlistingpage)
2. [FilterSidebar](#2-filtersidebar)
3. [ProductDetailPage](#3-productdetailpage)
4. [ComparisonPage](#4-comparisonpage)
5. [CategoryPage](#5-categorypage)
6. [SearchPage](#6-searchpage)
7. [Responsive & Animation Summary](#7-responsive--animation-summary)

---

## 1. ProductListingPage

> File: `apps/fe/src/app/(customer)/products/page.tsx`
> Danh sach san pham voi filter, sort, pagination.
> URL params: `?category=&brand=&material=&minPrice=&maxPrice=&sort=&page=`

### 1.1 Cau truc trang

```
Desktop:
┌──────────────────────────────────────────────────────────┐
│  Breadcrumb: Trang chu > San pham                        │
├────────────┬─────────────────────────────────────────────┤
│            │  [Active filters: Sofa x | Go soi x | ...]  │
│  FILTER    │  Hien thi 1-12 trong 48 san pham    [Sort▼] │
│  SIDEBAR   │  ┌────────┐ ┌────────┐ ┌────────┐          │
│  --------  │  │Product │ │Product │ │Product │          │
│  Danh muc  │  │ Card 1 │ │ Card 2 │ │ Card 3 │          │
│  Gia       │  └────────┘ └────────┘ └────────┘          │
│  Thuong    │  ┌────────┐ ┌────────┐ ┌────────┐          │
│   hieu     │  │Product │ │Product │ │Product │          │
│  Chat lieu │  │ Card 4 │ │ Card 5 │ │ Card 6 │          │
│  Danh gia  │  └────────┘ └────────┘ └────────┘          │
│            │                                             │
│  [Xoa loc] │  [< 1 2 3 ... 8 >]                         │
├────────────┴─────────────────────────────────────────────┤
│  Width: 280px   |  Flex-1                                 │
└──────────────────────────────────────────────────────────┘

Mobile:
┌──────────────────────────────┐
│  [Bo loc (3)]    [Sap xep▼]  │ ← Bo loc mo bottom sheet
│  [Active filters...]         │
│  Hien thi 1-12 trong 48     │
│  ┌───────────┐ ┌───────────┐│
│  │ Product   │ │ Product   ││
│  │ Card 1    │ │ Card 2    ││
│  └───────────┘ └───────────┘│
│  ┌───────────┐ ┌───────────┐│
│  │ Product   │ │ Product   ││
│  │ Card 3    │ │ Card 4    ││
│  └───────────┘ └───────────┘│
│  [< 1 2 3 ... >]            │
└──────────────────────────────┘
```

### 1.2 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/products/page.tsx
// ============================================================
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product-service';
import { ProductCard } from '@/components/customer/product-card';
import { FilterSidebar } from '@/components/customer/filter-sidebar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Pagination } from '@/components/ui/pagination';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';
import type { Product } from '@/types';

// ----- Sort options -----
const SORT_OPTIONS = [
  { value: 'newest', label: 'Moi nhat' },
  { value: 'price_asc', label: 'Gia thap - cao' },
  { value: 'price_desc', label: 'Gia cao - thap' },
  { value: 'bestSeller', label: 'Ban chay' },
  { value: 'rating', label: 'Danh gia cao' },
] as const;

// ----- Filter interface -----
interface Filters {
  category?: string;
  brand?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort: string;
  page: number;
}

const ITEMS_PER_PAGE = 12;

export default function ProductListingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ----- Parse URL params thanh filters -----
  const filters: Filters = useMemo(
    () => ({
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      material: searchParams.get('material') || undefined,
      minPrice: searchParams.get('minPrice')
        ? Number(searchParams.get('minPrice'))
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? Number(searchParams.get('maxPrice'))
        : undefined,
      rating: searchParams.get('rating')
        ? Number(searchParams.get('rating'))
        : undefined,
      sort: searchParams.get('sort') || 'newest',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    }),
    [searchParams],
  );

  // ----- Fetch products tu API (React Query) -----
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', filters],
    queryFn: () =>
      productService.getProducts({
        ...filters,
        limit: ITEMS_PER_PAGE,
      }),
    staleTime: 30 * 1000, // 30 giay
    keepPreviousData: true, // Giu data cu khi chuyen trang/filter
  });

  const products: Product[] = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 0 };

  // ----- Cap nhat URL params khi filter thay doi -----
  const updateFilters = useCallback(
    (newFilters: Partial<Filters>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page ve 1 khi thay doi filter (khong phai khi doi page)
      if (!('page' in newFilters)) {
        params.set('page', '1');
      }

      // Cap nhat params
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      // Xoa page=1 de URL sach hon
      if (params.get('page') === '1') {
        params.delete('page');
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // ----- Xoa 1 filter cu the -----
  const removeFilter = useCallback(
    (key: string) => {
      updateFilters({ [key]: undefined });
    },
    [updateFilters],
  );

  // ----- Xoa tat ca filters -----
  const clearAllFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // ----- Active filters (de hien thi tags) -----
  const activeFilters = useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = [];
    if (filters.category) result.push({ key: 'category', label: 'Danh muc', value: filters.category });
    if (filters.brand) result.push({ key: 'brand', label: 'Thuong hieu', value: filters.brand });
    if (filters.material) result.push({ key: 'material', label: 'Chat lieu', value: filters.material });
    if (filters.minPrice || filters.maxPrice) {
      const priceLabel = `${filters.minPrice?.toLocaleString('vi-VN') || '0'}₫ - ${
        filters.maxPrice?.toLocaleString('vi-VN') || '...'
      }₫`;
      result.push({ key: 'price', label: 'Gia', value: priceLabel });
    }
    if (filters.rating) result.push({ key: 'rating', label: 'Danh gia', value: `${filters.rating}+ sao` });
    return result;
  }, [filters]);

  // ----- Breadcrumb -----
  const breadcrumbItems = [
    { label: 'Trang chu', href: '/' },
    { label: 'San pham' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-4" />

      <div className="flex gap-6">
        {/* ===== FILTER SIDEBAR (Desktop) ===== */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onFilterChange={updateFilters}
            onClearAll={clearAllFilters}
          />
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 min-w-0">
          {/* --- Top bar: Mobile filter + Active filters + Sort + Count --- */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile filter button */}
              <Sheet
                open={isMobileFilterOpen}
                onOpenChange={setIsMobileFilterOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Bo loc
                    {activeFilters.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary-500 px-1.5
                                       text-[10px] font-bold text-white">
                        {activeFilters.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
                  <SheetHeader>
                    <SheetTitle>Bo loc san pham</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto py-4">
                    <FilterSidebar
                      filters={filters}
                      onFilterChange={(newFilters) => {
                        updateFilters(newFilters);
                        setIsMobileFilterOpen(false);
                      }}
                      onClearAll={() => {
                        clearAllFilters();
                        setIsMobileFilterOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Result count */}
              <p className="text-body-sm text-muted-foreground hidden sm:block">
                Hien thi{' '}
                <span className="font-medium text-foreground">
                  {(meta.page - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(meta.page * ITEMS_PER_PAGE, meta.total)}
                </span>{' '}
                trong{' '}
                <span className="font-medium text-foreground">{meta.total}</span>{' '}
                san pham
              </p>

              {/* Sort dropdown */}
              <Select
                value={filters.sort}
                onValueChange={(value) => updateFilters({ sort: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sap xep" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active filter tags */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <motion.span
                    key={filter.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50
                               border border-primary-200 px-3 py-1 text-caption
                               text-primary-700"
                  >
                    <span className="font-medium">{filter.label}:</span>
                    {filter.value}
                    <button
                      onClick={() => {
                        if (filter.key === 'price') {
                          updateFilters({ minPrice: undefined, maxPrice: undefined });
                        } else {
                          removeFilter(filter.key);
                        }
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-primary-100
                                 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-caption font-medium text-primary-500
                             hover:text-primary-600 transition-colors"
                >
                  Xoa tat ca
                </button>
              </div>
            )}
          </div>

          {/* --- Product Grid --- */}
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white p-3 shadow-card">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <StaggerContainer
              className={`grid grid-cols-1 gap-4
                          sm:grid-cols-2
                          lg:grid-cols-3 lg:gap-6
                          ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {products.map((product) => (
                <StaggerItem key={product._id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full
                              bg-surface-200 mb-4">
                <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-h5 font-medium text-foreground mb-1">
                Khong tim thay san pham
              </p>
              <p className="text-body-sm text-muted-foreground mb-4">
                Thu thay doi bo loc hoac tu khoa tim kiem
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Xoa tat ca bo loc
              </Button>
            </div>
          )}

          {/* --- Pagination --- */}
          {meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(page) => updateFilters({ page })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 1.3 Ket noi API / Stores

| Thanh phan | API / Hook | Muc dich |
|---|---|---|
| Products | `productService.getProducts(filters)` via React Query | Fetch danh sach + pagination meta |
| URL sync | `useSearchParams()` + `useRouter()` | Dong bo filter ↔ URL params |
| Filter change | `updateFilters()` | Cap nhat URL → trigger re-fetch |

---

## 2. FilterSidebar

> File: `apps/fe/src/components/customer/filter-sidebar.tsx`
> Desktop: Sidebar 280px ben trai.
> Mobile: Sheet/Bottom drawer.
> Collapsible sections cho tung loai filter.

### 2.1 Cau truc

```
┌────────────────────────────┐
│  Bo loc san pham            │
├────────────────────────────┤
│  ▼ Danh muc                │
│    ☐ Sofa & Ghe (42)       │
│    ☐ Ban (38)              │
│      ├ ☐ Ban an (22)       │
│      └ ☐ Ban lam viec (16) │
│    ☐ Giuong (25)           │
│    ☐ Tu & Ke (31)          │
├────────────────────────────┤
│  ▼ Khoang gia              │
│    [Min ₫] ─── [Max ₫]    │
│    ┌──────────────────┐    │
│    │  ○───────●        │    │ ← Range slider
│    └──────────────────┘    │
├────────────────────────────┤
│  ▼ Thuong hieu             │
│    ☐ Noi That Xuan Hoa     │
│    ☐ Hoa Phat              │
│    ☐ Moho                  │
│    ☐ Nha Xinh              │
├────────────────────────────┤
│  ▼ Chat lieu               │
│    ☐ Go soi (45)           │
│    ☐ Go oc cho (32)        │
│    ☐ Go thong (28)         │
│    ☐ MDF (15)              │
├────────────────────────────┤
│  ▼ Danh gia                │
│    ○ Tu 4 sao tro len      │
│    ○ Tu 3 sao tro len      │
│    ○ Tu 2 sao tro len      │
├────────────────────────────┤
│  [Xoa bo loc]              │
└────────────────────────────┘
```

### 2.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/filter-sidebar.tsx
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { categoryService } from '@/services/category-service';
import { productService } from '@/services/product-service';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types';

interface Filters {
  category?: string;
  brand?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort: string;
  page: number;
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onClearAll: () => void;
}

// ----- Collapsible Filter Section -----
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-body-sm
                   font-semibold text-foreground hover:text-primary-500 transition-colors"
      >
        {title}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----- Price Range constants -----
const PRICE_MIN = 0;
const PRICE_MAX = 50_000_000; // 50 trieu
const PRICE_STEP = 500_000;   // 500k

export function FilterSidebar({
  filters,
  onFilterChange,
  onClearAll,
}: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || PRICE_MIN,
    filters.maxPrice || PRICE_MAX,
  ]);

  // ----- Fetch filter options tu API -----
  const { data: categories } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['products', 'filter-options'],
    queryFn: () => productService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const brands = filterOptions?.brands || [];
  const materials = filterOptions?.materials || [];

  // ----- Sync price range khi filters thay doi tu URL -----
  useEffect(() => {
    setPriceRange([
      filters.minPrice || PRICE_MIN,
      filters.maxPrice || PRICE_MAX,
    ]);
  }, [filters.minPrice, filters.maxPrice]);

  // ----- Category tree render (recursive) -----
  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((cat) => (
      <div key={cat._id} style={{ paddingLeft: `${level * 16}px` }}>
        <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
          <Checkbox
            checked={filters.category === cat.slug}
            onCheckedChange={(checked) =>
              onFilterChange({ category: checked ? cat.slug : undefined })
            }
            className="h-4 w-4"
          />
          <span className="flex-1 text-body-sm text-foreground
                           group-hover:text-primary-500 transition-colors">
            {cat.name}
          </span>
          {cat.productCount !== undefined && (
            <span className="text-caption text-muted-foreground">
              ({cat.productCount})
            </span>
          )}
        </label>
        {cat.children && cat.children.length > 0 && (
          <div>{renderCategoryTree(cat.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-h5 font-semibold text-foreground hidden lg:block">
        Bo loc san pham
      </h3>

      {/* === Danh muc === */}
      <FilterSection title="Danh muc">
        <div className="max-h-[250px] overflow-y-auto space-y-0.5 pr-2
                        scrollbar-thin scrollbar-thumb-surface-400">
          {categories ? renderCategoryTree(categories) : (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-full animate-pulse rounded bg-surface-200" />
              ))}
            </div>
          )}
        </div>
      </FilterSection>

      {/* === Khoang gia === */}
      <FilterSection title="Khoang gia">
        <div className="space-y-4">
          {/* Min/Max inputs */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Tu"
              value={priceRange[0] || ''}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setPriceRange([val, priceRange[1]]);
              }}
              onBlur={() =>
                onFilterChange({
                  minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                })
              }
              className="text-body-sm"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Den"
              value={priceRange[1] < PRICE_MAX ? priceRange[1] : ''}
              onChange={(e) => {
                const val = Number(e.target.value) || PRICE_MAX;
                setPriceRange([priceRange[0], val]);
              }}
              onBlur={() =>
                onFilterChange({
                  maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
                })
              }
              className="text-body-sm"
            />
          </div>

          {/* Slider */}
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceRange}
            onValueChange={(val: number[]) =>
              setPriceRange(val as [number, number])
            }
            onValueCommit={(val: number[]) =>
              onFilterChange({
                minPrice: val[0] > PRICE_MIN ? val[0] : undefined,
                maxPrice: val[1] < PRICE_MAX ? val[1] : undefined,
              })
            }
            className="mt-2"
          />

          {/* Price labels */}
          <div className="flex justify-between text-caption text-muted-foreground">
            <span>{priceRange[0].toLocaleString('vi-VN')}₫</span>
            <span>
              {priceRange[1] >= PRICE_MAX
                ? '50.000.000₫+'
                : `${priceRange[1].toLocaleString('vi-VN')}₫`}
            </span>
          </div>
        </div>
      </FilterSection>

      {/* === Thuong hieu === */}
      <FilterSection title="Thuong hieu">
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2
                        scrollbar-thin scrollbar-thumb-surface-400">
          {brands.map((brand: { name: string; count: number }) => (
            <label key={brand.name} className="flex items-center gap-2 py-1.5 cursor-pointer group">
              <Checkbox
                checked={filters.brand === brand.name}
                onCheckedChange={(checked) =>
                  onFilterChange({ brand: checked ? brand.name : undefined })
                }
                className="h-4 w-4"
              />
              <span className="flex-1 text-body-sm text-foreground
                               group-hover:text-primary-500 transition-colors">
                {brand.name}
              </span>
              <span className="text-caption text-muted-foreground">
                ({brand.count})
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* === Chat lieu === */}
      <FilterSection title="Chat lieu">
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2
                        scrollbar-thin scrollbar-thumb-surface-400">
          {materials.map((mat: { name: string; count: number }) => (
            <label key={mat.name} className="flex items-center gap-2 py-1.5 cursor-pointer group">
              <Checkbox
                checked={filters.material === mat.name}
                onCheckedChange={(checked) =>
                  onFilterChange({ material: checked ? mat.name : undefined })
                }
                className="h-4 w-4"
              />
              <span className="flex-1 text-body-sm text-foreground
                               group-hover:text-primary-500 transition-colors">
                {mat.name}
              </span>
              <span className="text-caption text-muted-foreground">
                ({mat.count})
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* === Danh gia === */}
      <FilterSection title="Danh gia" defaultOpen={false}>
        <RadioGroup
          value={String(filters.rating || '')}
          onValueChange={(val) =>
            onFilterChange({ rating: val ? Number(val) : undefined })
          }
          className="space-y-2"
        >
          {[4, 3, 2].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <RadioGroupItem value={String(rating)} id={`rating-${rating}`} />
              <Label
                htmlFor={`rating-${rating}`}
                className="flex items-center gap-1 cursor-pointer"
              >
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < rating
                          ? 'text-warning-500 fill-warning-500'
                          : 'text-surface-400',
                      )}
                    />
                  ))}
                </div>
                <span className="text-body-sm text-muted-foreground ml-1">
                  tro len
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FilterSection>

      {/* === Xoa bo loc === */}
      <Button
        variant="outline"
        className="w-full"
        onClick={onClearAll}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Xoa bo loc
      </Button>
    </div>
  );
}
```

### 2.3 Ket noi API

| Data | API | Muc dich |
|---|---|---|
| Categories tree | `categoryService.getCategoryTree()` | Checkbox list voi parent-child |
| Filter options | `productService.getFilterOptions()` | Danh sach brands, materials voi count |

---

## 3. ProductDetailPage

> File: `apps/fe/src/app/(customer)/products/[slug]/page.tsx`
> Server component voi `generateMetadata` cho SEO.
> Two-column layout: images trai, info phai.

### 3.1 Cau truc trang

```
Breadcrumb: Trang chu > San pham > Sofa go oc cho Nordic

Desktop:
┌──────────────────────────────┬────────────────────────────────┐
│  ┌────────────────────────┐  │  Ten san pham                   │
│  │                        │  │  ★★★★☆ (4.2) - 24 danh gia     │
│  │    [Main Image]        │  │                                 │
│  │    (click to zoom)     │  │  1.200.000₫  ~~1.500.000₫~~    │
│  │                        │  │                                 │
│  └────────────────────────┘  │  Mo ta ngan...                  │
│  [Thumb1] [Thumb2] [Thumb3]  │                                 │
│  [Thumb4] [Thumb5]           │  Mau sac:                       │
│                              │  (●Nau) (○Xam) (○Kem)           │
│                              │                                 │
│                              │  Kich thuoc:                     │
│                              │  (○ 180x90 ) (● 200x100 )      │
│                              │                                 │
│                              │  SKU: SF-OC-NAU-200             │
│                              │  Tinh trang: Con hang (15)      │
│                              │                                 │
│                              │  [-] 1 [+]                      │
│                              │                                 │
│                              │  [Them vao gio hang]             │
│                              │  [♡ Yeu thich]  [⊞ So sanh]     │
├──────────────────────────────┴────────────────────────────────┤
│  [Mo ta chi tiet] [Thong so] [Danh gia (24)] [Doi tra]        │
│  ─────────────────────────────────────────────────────────────│
│  Tab content here...                                          │
├───────────────────────────────────────────────────────────────┤
│  San pham lien quan                                           │
│  [Card] [Card] [Card] [Card]                                  │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/products/[slug]/page.tsx
// ============================================================
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productService } from '@/services/product-service';
import { ProductDetailClient } from '@/components/customer/product-detail-client';

// ----- Dynamic SEO Metadata -----
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await productService.getProductBySlug(params.slug);

    return {
      title: `${product.name} | Noi That Viet`,
      description: product.shortDescription || product.name,
      openGraph: {
        title: product.name,
        description: product.shortDescription,
        images: [
          {
            url: product.thumbnail,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
        type: 'website',
      },
      other: {
        'product:price:amount': String(product.minPrice),
        'product:price:currency': 'VND',
      },
    };
  } catch {
    return {
      title: 'San pham | Noi That Viet',
    };
  }
}

// ----- Server Component -----
export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let product;
  try {
    product = await productService.getProductBySlug(params.slug);
  } catch {
    notFound();
  }

  // Fetch related products
  const relatedProducts = await productService
    .getRelatedProducts(product._id, { limit: 4 })
    .catch(() => []);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
```

### 3.3 ProductDetailClient

```tsx
// ============================================================
// apps/fe/src/components/customer/product-detail-client.tsx
// ============================================================
'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  GitCompareArrows,
  Minus,
  Plus,
  Share2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/use-cart-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import { useComparisonStore } from '@/stores/use-comparison-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageGallery } from './image-gallery';
import { VariantSelector } from './variant-selector';
import { ReviewsList } from './reviews-list';
import { ProductCard } from './product-card';
import { StaggerContainer, StaggerItem, FadeInWhenVisible } from '@/components/ui/animations';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0],
  );
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addProduct, isInComparison } = useComparisonStore();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const isWished = isInWishlist(product._id);
  const isComparing = isInComparison(product._id);
  const isOutOfStock = selectedVariant.stock <= 0;

  // ----- Breadcrumb -----
  const breadcrumbItems = useMemo(
    () => [
      { label: 'Trang chu', href: '/' },
      { label: 'San pham', href: '/products' },
      ...(product.category
        ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }]
        : []),
      { label: product.name },
    ],
    [product],
  );

  // ----- Quantity handlers -----
  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQty = () =>
    setQuantity((q) => Math.min(selectedVariant.stock, q + 1));

  // ----- Add to cart -----
  const handleAddToCart = useCallback(() => {
    addItem(
      {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail,
      },
      {
        sku: selectedVariant.sku,
        color: selectedVariant.color,
        dimensions: selectedVariant.dimensions,
        price: selectedVariant.price,
        originalPrice: selectedVariant.originalPrice,
        stock: selectedVariant.stock,
        image: selectedVariant.image,
      },
      quantity,
    );
    toast({
      title: 'Da them vao gio hang!',
      description: `${product.name} x${quantity}`,
    });
  }, [product, selectedVariant, quantity, addItem, toast]);

  // ----- Toggle wishlist -----
  const handleWishlist = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Vui long dang nhap',
        description: 'Ban can dang nhap de su dung tinh nang nay.',
        variant: 'destructive',
      });
      return;
    }
    toggleWishlist(product._id);
    toast({
      title: isWished ? 'Da xoa khoi yeu thich' : 'Da them vao yeu thich',
    });
  }, [isAuthenticated, isWished, product._id, toggleWishlist, toast]);

  // ----- Compare -----
  const handleCompare = useCallback(() => {
    if (isComparing) return;
    const added = addProduct(product);
    if (!added) {
      toast({
        title: 'Toi da 4 san pham',
        description: 'Ban chi co the so sanh toi da 4 san pham.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Da them vao so sanh' });
    }
  }, [isComparing, product, addProduct, toast]);

  // ----- Reset quantity khi doi variant -----
  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* ===== TWO-COLUMN LAYOUT ===== */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* --- LEFT: Image Gallery --- */}
        <FadeInWhenVisible>
          <ImageGallery
            images={product.images}
            thumbnail={product.thumbnail}
            productName={product.name}
          />
        </FadeInWhenVisible>

        {/* --- RIGHT: Product Info --- */}
        <FadeInWhenVisible delay={0.1}>
          <div className="space-y-5">
            {/* Product name */}
            <h1 className="text-h2 lg:text-h1 font-bold text-foreground">
              {product.name}
            </h1>

            {/* Rating summary */}
            {product.averageRating > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-lg',
                        i < Math.round(product.averageRating)
                          ? 'text-warning-500'
                          : 'text-surface-400',
                      )}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-body font-medium text-foreground">
                    {product.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-body-sm text-muted-foreground">
                  ({product.reviewCount} danh gia)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-h2 font-bold text-primary-500">
                {formatCurrency(selectedVariant.price)}
              </span>
              {selectedVariant.originalPrice > selectedVariant.price && (
                <>
                  <span className="text-body text-muted-foreground line-through">
                    {formatCurrency(selectedVariant.originalPrice)}
                  </span>
                  <span className="rounded-md bg-danger-50 px-2 py-0.5 text-body-sm
                                   font-semibold text-danger-600">
                    -
                    {Math.round(
                      ((selectedVariant.originalPrice - selectedVariant.price) /
                        selectedVariant.originalPrice) *
                        100,
                    )}
                    %
                  </span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-body text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            {/* Divider */}
            <hr className="border-border" />

            {/* ===== VARIANT SELECTOR ===== */}
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={handleVariantChange}
            />

            {/* SKU + Stock */}
            <div className="flex flex-wrap items-center gap-4 text-body-sm">
              <span className="text-muted-foreground">
                SKU: <span className="font-medium text-foreground">{selectedVariant.sku}</span>
              </span>
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOutOfStock ? 'text-danger-500' : 'text-success-500',
                )}
              >
                {isOutOfStock ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Het hang
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Con hang ({selectedVariant.stock})
                  </>
                )}
              </span>
            </div>

            {/* Divider */}
            <hr className="border-border" />

            {/* ===== QUANTITY + ADD TO CART ===== */}
            <div className="space-y-4">
              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <span className="text-body-sm font-medium text-foreground">
                  So luong:
                </span>
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    onClick={decreaseQty}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center
                               text-foreground hover:bg-surface-200
                               disabled:opacity-30 transition-colors rounded-l-lg"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-10 w-14 items-center justify-center
                                   border-x border-border text-body font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQty}
                    disabled={quantity >= selectedVariant.stock}
                    className="flex h-10 w-10 items-center justify-center
                               text-foreground hover:bg-surface-200
                               disabled:opacity-30 transition-colors rounded-r-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  size="lg"
                  className="flex-1 text-body font-semibold"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock ? 'Het hang' : 'Them vao gio hang'}
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWishlist}
                    className={cn(
                      isWished && 'text-danger-500 border-danger-200 hover:bg-danger-50',
                    )}
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={isWished ? 'currentColor' : 'none'}
                    />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCompare}
                    className={cn(
                      isComparing && 'text-primary-500 border-primary-200 bg-primary-50',
                    )}
                  >
                    <GitCompareArrows className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </div>

      {/* ===== TABS: Mo ta, Thong so, Danh gia, Doi tra ===== */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start border-b border-border bg-transparent
                               rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent px-4 py-3
                         data-[state=active]:border-primary-500
                         data-[state=active]:text-primary-500
                         data-[state=active]:shadow-none"
            >
              Mo ta chi tiet
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-none border-b-2 border-transparent px-4 py-3
                         data-[state=active]:border-primary-500
                         data-[state=active]:text-primary-500
                         data-[state=active]:shadow-none"
            >
              Thong so ky thuat
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent px-4 py-3
                         data-[state=active]:border-primary-500
                         data-[state=active]:text-primary-500
                         data-[state=active]:shadow-none"
            >
              Danh gia ({product.reviewCount})
            </TabsTrigger>
            <TabsTrigger
              value="returns"
              className="rounded-none border-b-2 border-transparent px-4 py-3
                         data-[state=active]:border-primary-500
                         data-[state=active]:text-primary-500
                         data-[state=active]:shadow-none"
            >
              Chinh sach doi tra
            </TabsTrigger>
          </TabsList>

          {/* Mo ta chi tiet */}
          <TabsContent value="description" className="mt-6">
            <div
              className="prose prose-neutral max-w-none
                         prose-headings:text-foreground prose-p:text-muted-foreground
                         prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </TabsContent>

          {/* Thong so ky thuat */}
          <TabsContent value="specs" className="mt-6">
            {product.specifications && product.specifications.length > 0 ? (
              <table className="w-full max-w-2xl">
                <tbody>
                  {product.specifications.map(
                    (spec: { label: string; value: string }, index: number) => (
                      <tr
                        key={spec.label}
                        className={cn(
                          'border-b border-border',
                          index % 2 === 0 ? 'bg-surface-100' : 'bg-white',
                        )}
                      >
                        <td className="px-4 py-3 text-body-sm font-medium text-foreground
                                       w-[200px]">
                          {spec.label}
                        </td>
                        <td className="px-4 py-3 text-body-sm text-muted-foreground">
                          {spec.value}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            ) : (
              <p className="text-body-sm text-muted-foreground">
                Chua co thong so ky thuat cho san pham nay.
              </p>
            )}
          </TabsContent>

          {/* Danh gia */}
          <TabsContent value="reviews" className="mt-6">
            <ReviewsList productId={product._id} />
          </TabsContent>

          {/* Chinh sach doi tra */}
          <TabsContent value="returns" className="mt-6">
            <div className="space-y-4 max-w-2xl">
              <div className="rounded-lg bg-surface-100 p-4">
                <h4 className="text-body font-semibold text-foreground mb-2">
                  Chinh sach doi tra
                </h4>
                <ul className="space-y-2 text-body-sm text-muted-foreground">
                  <li>- Doi tra trong vong 30 ngay ke tu ngay nhan hang</li>
                  <li>- San pham con nguyen tem, nhan, chua qua su dung</li>
                  <li>- Hoan tien 100% neu san pham bi loi tu nha san xuat</li>
                  <li>- Mien phi doi tra lan dau tien</li>
                </ul>
              </div>
              <div className="rounded-lg bg-surface-100 p-4">
                <h4 className="text-body font-semibold text-foreground mb-2">
                  Bao hanh
                </h4>
                <ul className="space-y-2 text-body-sm text-muted-foreground">
                  <li>- Bao hanh {product.warranty || 12} thang cho loi ky thuat</li>
                  <li>- Bao tri va sua chua voi chi phi uu dai sau bao hanh</li>
                  <li>- Lien he hotline 1900 xxxx de duoc ho tro</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== RELATED PRODUCTS ===== */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-h3 font-bold text-foreground mb-6">
            San pham lien quan
          </h2>
          <StaggerContainer
            className="grid grid-cols-2 gap-4
                       md:grid-cols-3
                       lg:grid-cols-4 lg:gap-6"
          >
            {relatedProducts.map((rp) => (
              <StaggerItem key={rp._id}>
                <ProductCard product={rp} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}
    </div>
  );
}
```

### 3.4 ImageGallery

> File: `apps/fe/src/components/customer/image-gallery.tsx`

```tsx
// ============================================================
// apps/fe/src/components/customer/image-gallery.tsx
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  thumbnail: string;
  productName: string;
}

export function ImageGallery({ images, thumbnail, productName }: ImageGalleryProps) {
  const allImages = [thumbnail, ...images.filter((img) => img !== thumbnail)];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goToImage = useCallback(
    (index: number) => {
      setActiveIndex(
        ((index % allImages.length) + allImages.length) % allImages.length,
      );
    },
    [allImages.length],
  );

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-square overflow-hidden rounded-xl bg-surface-100
                     cursor-zoom-in group"
          onClick={() => setIsLightboxOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              <Image
                src={allImages[activeIndex]}
                alt={`${productName} - Anh ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom icon overlay */}
          <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center
                          justify-center rounded-full bg-white/80 text-foreground
                          opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2',
                'transition-all duration-200',
                index === activeIndex
                  ? 'border-primary-500 ring-1 ring-primary-200'
                  : 'border-transparent hover:border-surface-400',
              )}
            >
              <Image
                src={img}
                alt={`${productName} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal bg-black/95 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center
                         justify-center rounded-full bg-white/10 text-white
                         hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Prev / Next buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToImage(activeIndex - 1);
              }}
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center
                         rounded-full bg-white/10 text-white hover:bg-white/20
                         transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToImage(activeIndex + 1);
              }}
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center
                         rounded-full bg-white/10 text-white hover:bg-white/20
                         transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image */}
            <div
              className="relative h-[80vh] w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={allImages[activeIndex]}
                alt={productName}
                fill
                className="object-contain"
                sizes="80vw"
              />
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 text-body-sm text-white/70">
              {activeIndex + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### 3.5 VariantSelector

> File: `apps/fe/src/components/customer/variant-selector.tsx`

```tsx
// ============================================================
// apps/fe/src/components/customer/variant-selector.tsx
// ============================================================
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  // ----- Extract unique colors va dimensions tu variants -----
  const uniqueColors = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    variants.forEach((v) => {
      if (v.color && !map.has(v.color.name)) {
        map.set(v.color.name, v.color);
      }
    });
    return Array.from(map.values());
  }, [variants]);

  const uniqueDimensions = useMemo(() => {
    const map = new Map<string, ProductVariant['dimensions']>();
    variants.forEach((v) => {
      if (v.dimensions && !map.has(v.dimensions.label)) {
        map.set(v.dimensions.label, v.dimensions);
      }
    });
    return Array.from(map.values());
  }, [variants]);

  // ----- Tim variant phu hop khi thay doi color hoac dimension -----
  const findVariant = (
    colorName?: string,
    dimLabel?: string,
  ): ProductVariant | undefined => {
    return variants.find((v) => {
      const colorMatch = !colorName || v.color?.name === colorName;
      const dimMatch = !dimLabel || v.dimensions?.label === dimLabel;
      return colorMatch && dimMatch;
    });
  };

  // ----- Handler chon color -----
  const handleColorChange = (colorName: string) => {
    const match = findVariant(
      colorName,
      selectedVariant.dimensions?.label,
    );
    if (match) {
      onVariantChange(match);
    } else {
      // Neu khong tim duoc match chinh xac, lay variant dau tien co color nay
      const fallback = variants.find((v) => v.color?.name === colorName);
      if (fallback) onVariantChange(fallback);
    }
  };

  // ----- Handler chon dimension -----
  const handleDimensionChange = (dimLabel: string) => {
    const match = findVariant(
      selectedVariant.color?.name,
      dimLabel,
    );
    if (match) {
      onVariantChange(match);
    } else {
      const fallback = variants.find((v) => v.dimensions?.label === dimLabel);
      if (fallback) onVariantChange(fallback);
    }
  };

  return (
    <div className="space-y-5">
      {/* === Color Picker === */}
      {uniqueColors.length > 0 && (
        <div>
          <p className="text-body-sm font-medium text-foreground mb-2">
            Mau sac:{' '}
            <span className="font-normal text-muted-foreground">
              {selectedVariant.color?.name}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map((color) => {
              const isSelected = selectedVariant.color?.name === color.name;
              // Kiem tra co variant con hang voi color nay khong
              const hasStock = variants.some(
                (v) => v.color?.name === color.name && v.stock > 0,
              );

              return (
                <button
                  key={color.name}
                  onClick={() => handleColorChange(color.name)}
                  disabled={!hasStock}
                  title={`${color.name}${!hasStock ? ' (Het hang)' : ''}`}
                  className={cn(
                    'relative flex items-center gap-2 rounded-lg border px-3 py-2',
                    'transition-all duration-200',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                      : 'border-border hover:border-primary-300',
                    !hasStock && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-border shadow-inner"
                    style={{ backgroundColor: color.code }}
                  />
                  <span className="text-body-sm">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === Dimension Picker === */}
      {uniqueDimensions.length > 0 && (
        <div>
          <p className="text-body-sm font-medium text-foreground mb-2">
            Kich thuoc:{' '}
            <span className="font-normal text-muted-foreground">
              {selectedVariant.dimensions?.label}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueDimensions.map((dim) => {
              if (!dim) return null;
              const isSelected = selectedVariant.dimensions?.label === dim.label;
              const hasStock = variants.some(
                (v) => v.dimensions?.label === dim.label && v.stock > 0,
              );

              return (
                <button
                  key={dim.label}
                  onClick={() => handleDimensionChange(dim.label)}
                  disabled={!hasStock}
                  title={`${dim.width}x${dim.length}x${dim.height}cm${!hasStock ? ' (Het hang)' : ''}`}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-body-sm',
                    'transition-all duration-200',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium ring-1 ring-primary-200'
                      : 'border-border text-foreground hover:border-primary-300',
                    !hasStock && 'opacity-40 cursor-not-allowed line-through',
                  )}
                >
                  {dim.label}
                  <span className="block text-caption text-muted-foreground font-normal">
                    {dim.width}x{dim.length}x{dim.height}cm
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3.6 Ket noi API / Stores

| Thanh phan | API / Store | Muc dich |
|---|---|---|
| Product data | `productService.getProductBySlug(slug)` (SSR) | Fetch chi tiet san pham |
| Related products | `productService.getRelatedProducts(id)` (SSR) | San pham lien quan |
| SEO | `generateMetadata()` | Dynamic OG tags |
| Add to cart | `useCartStore.addItem()` | Them vao gio hang |
| Wishlist | `useWishlistStore.toggleWishlist()` | Them/xoa yeu thich |
| Compare | `useComparisonStore.addProduct()` | Them vao so sanh |
| Reviews | `ReviewsList` component (React Query noi bo) | Fetch + paginate danh gia |

---

## 4. ComparisonPage

> File: `apps/fe/src/app/(customer)/compare/page.tsx`
> So sanh side-by-side 2-4 san pham.
> Data lay tu `useComparisonStore`.

### 4.1 Cau truc

```
             So sanh san pham

┌───────────┬───────────┬───────────┬───────────┐
│           │ Product 1 │ Product 2 │ Product 3 │
│           │   [X]     │   [X]     │   [X]     │
├───────────┼───────────┼───────────┼───────────┤
│ Hinh anh  │   [Img]   │   [Img]   │   [Img]   │
├───────────┼───────────┼───────────┼───────────┤
│ Ten       │ Sofa go   │ Sofa vai  │ Sofa da   │
├───────────┼───────────┼───────────┼───────────┤  ← highlight differences
│ Gia       │ 12.000.0₫ │ 8.500.0₫  │ 15.000.0₫ │
├───────────┼───────────┼───────────┼───────────┤
│ Thuong    │ Nha Xinh  │ Moho      │ Nha Xinh  │
│ hieu      │           │           │           │
├───────────┼───────────┼───────────┼───────────┤
│ Chat lieu │ Go oc cho │ Vai boc   │ Da that   │
├───────────┼───────────┼───────────┼───────────┤
│ Xuat xu   │ Viet Nam  │ Viet Nam  │ Y         │
├───────────┼───────────┼───────────┼───────────┤
│ Mau sac   │ Nau, Xam  │ Xam, Xanh│ Den, Nau  │
├───────────┼───────────┼───────────┼───────────┤
│ Kich thuoc│ 200x90cm  │ 180x85cm  │ 220x95cm  │
├───────────┼───────────┼───────────┼───────────┤
│ Danh gia  │ ★★★★☆ 4.2│ ★★★★★ 4.8│ ★★★★☆ 4.0│
├───────────┼───────────┼───────────┼───────────┤
│ Bao hanh  │ 24 thang  │ 12 thang  │ 24 thang  │
├───────────┼───────────┼───────────┼───────────┤
│           │[Them vao  │[Them vao  │[Them vao  │
│           │ gio hang] │ gio hang] │ gio hang] │
└───────────┴───────────┴───────────┴───────────┘

Mobile: Horizontal scroll
```

### 4.2 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/compare/page.tsx
// ============================================================
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, ShoppingCart, Star, GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useComparisonStore } from '@/stores/use-comparison-store';
import { useCartStore } from '@/stores/use-cart-store';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { FadeInWhenVisible } from '@/components/ui/animations';
import type { Product } from '@/types';

// ----- So sanh rows config -----
const COMPARISON_ROWS = [
  { key: 'price', label: 'Khoang gia' },
  { key: 'brand', label: 'Thuong hieu' },
  { key: 'material', label: 'Chat lieu' },
  { key: 'origin', label: 'Xuat xu' },
  { key: 'colors', label: 'Mau sac' },
  { key: 'dimensions', label: 'Kich thuoc' },
  { key: 'rating', label: 'Danh gia' },
  { key: 'warranty', label: 'Bao hanh' },
] as const;

// ----- Lay gia tri tu product theo key -----
function getProductValue(product: Product, key: string): string {
  switch (key) {
    case 'price':
      return `${formatCurrency(product.minPrice)}${
        product.maxPrice && product.maxPrice !== product.minPrice
          ? ` - ${formatCurrency(product.maxPrice)}`
          : ''
      }`;
    case 'brand':
      return product.brand || '-';
    case 'material':
      return product.material || '-';
    case 'origin':
      return product.origin || '-';
    case 'colors':
      return (
        product.variants
          ?.map((v) => v.color?.name)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(', ') || '-'
      );
    case 'dimensions':
      return (
        product.variants
          ?.map((v) => v.dimensions?.label)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(', ') || '-'
      );
    case 'rating':
      return product.averageRating > 0
        ? `${product.averageRating.toFixed(1)} (${product.reviewCount} danh gia)`
        : 'Chua co danh gia';
    case 'warranty':
      return product.warranty ? `${product.warranty} thang` : '-';
    default:
      return '-';
  }
}

// ----- Kiem tra cac gia tri co khac nhau khong (de highlight) -----
function valuesAreDifferent(products: Product[], key: string): boolean {
  const values = products.map((p) => getProductValue(p, key));
  return new Set(values).size > 1;
}

export default function ComparisonPage() {
  const { products, removeProduct, clearAll } = useComparisonStore();
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const breadcrumbItems = [
    { label: 'Trang chu', href: '/' },
    { label: 'So sanh san pham' },
  ];

  // ----- Add to cart -----
  const handleAddToCart = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      addItem(
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          thumbnail: product.thumbnail,
        },
        variant,
      );
      toast({ title: 'Da them vao gio hang', description: product.name });
    }
  };

  // ----- Empty state -----
  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full
                          bg-surface-200 mb-4">
            <GitCompareArrows className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-h3 font-bold text-foreground mb-2">
            Chua co san pham de so sanh
          </h1>
          <p className="text-body text-muted-foreground mb-6 max-w-md">
            Hay them san pham vao danh sach so sanh bang cach nhan nut "So sanh" tren
            the san pham hoac trang chi tiet san pham.
          </p>
          <Button asChild>
            <Link href="/products">Xem san pham</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h2 font-bold text-foreground">
          So sanh san pham ({products.length})
        </h1>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Xoa tat ca
        </Button>
      </div>

      {/* ===== COMPARISON TABLE ===== */}
      <FadeInWhenVisible>
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
          <table className="w-full min-w-[600px]">
            {/* --- Product images + names --- */}
            <thead>
              <tr className="border-b border-border">
                <th className="w-[140px] p-4 text-left text-body-sm font-medium
                               text-muted-foreground align-top">
                  San pham
                </th>
                {products.map((product) => (
                  <th
                    key={product._id}
                    className="p-4 text-center align-top min-w-[200px]"
                  >
                    {/* Remove button */}
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => removeProduct(product._id)}
                        className="rounded-full p-1 text-muted-foreground
                                   hover:text-danger-500 hover:bg-danger-50
                                   transition-colors"
                        aria-label={`Xoa ${product.name} khoi so sanh`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Product image */}
                    <Link href={`/products/${product.slug}`} className="block">
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        width={160}
                        height={160}
                        className="mx-auto h-32 w-32 rounded-lg object-cover
                                   hover:opacity-80 transition-opacity"
                      />
                    </Link>

                    {/* Product name */}
                    <Link
                      href={`/products/${product.slug}`}
                      className="mt-3 block text-body-sm font-semibold text-foreground
                                 hover:text-primary-500 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            {/* --- Comparison rows --- */}
            <tbody>
              {COMPARISON_ROWS.map((row, rowIndex) => {
                const isDifferent = valuesAreDifferent(products, row.key);

                return (
                  <tr
                    key={row.key}
                    className={cn(
                      'border-b border-border',
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-surface-100/50',
                    )}
                  >
                    <td className="p-4 text-body-sm font-medium text-foreground">
                      {row.label}
                    </td>
                    {products.map((product) => {
                      const value = getProductValue(product, row.key);
                      return (
                        <td
                          key={product._id}
                          className={cn(
                            'p-4 text-center text-body-sm',
                            isDifferent
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground',
                          )}
                        >
                          {/* Rating: hien thi sao */}
                          {row.key === 'rating' && product.averageRating > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      'h-4 w-4',
                                      i < Math.round(product.averageRating)
                                        ? 'text-warning-500 fill-warning-500'
                                        : 'text-surface-400',
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-caption">
                                {product.averageRating.toFixed(1)} ({product.reviewCount})
                              </span>
                            </div>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* --- Add to cart row --- */}
              <tr>
                <td className="p-4"></td>
                {products.map((product) => (
                  <td key={product._id} className="p-4 text-center">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      size="sm"
                      className="w-full max-w-[180px]"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Them vao gio
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </FadeInWhenVisible>
    </div>
  );
}
```

### 4.3 Ket noi API / Stores

| Thanh phan | Store | Muc dich |
|---|---|---|
| Products | `useComparisonStore.products` | Danh sach san pham dang so sanh |
| Remove | `useComparisonStore.removeProduct()` | Xoa san pham khoi so sanh |
| Clear all | `useComparisonStore.clearAll()` | Xoa tat ca |
| Add to cart | `useCartStore.addItem()` | Them vao gio tu bang so sanh |

---

## 5. CategoryPage

> File: `apps/fe/src/app/(customer)/categories/[slug]/page.tsx`
> Trang san pham theo danh muc.
> Reuse ProductListingPage filter + grid.

### 5.1 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/categories/[slug]/page.tsx
// ============================================================
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categoryService } from '@/services/category-service';
import { CategoryPageClient } from '@/components/customer/category-page-client';

// ----- Dynamic Metadata -----
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const category = await categoryService.getCategoryBySlug(params.slug);
    return {
      title: `${category.name} | Noi That Viet`,
      description: category.description || `Mua ${category.name} chat luong cao tai Noi That Viet`,
      openGraph: {
        title: `${category.name} - Noi That Viet`,
        description: category.description,
        images: category.image ? [{ url: category.image }] : [],
      },
    };
  } catch {
    return { title: 'Danh muc | Noi That Viet' };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  let category;
  try {
    category = await categoryService.getCategoryBySlug(params.slug);
  } catch {
    notFound();
  }

  return <CategoryPageClient category={category} />;
}
```

### 5.2 CategoryPageClient

```tsx
// ============================================================
// apps/fe/src/components/customer/category-page-client.tsx
// ============================================================
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FadeInWhenVisible } from '@/components/ui/animations';
import type { Category } from '@/types';

// Import va reuse ProductListingPage logic tu products page
// (Filter sidebar, product grid, pagination, etc.)
// Trong thuc te, extract shared logic thanh custom hook hoac component

interface CategoryPageClientProps {
  category: Category;
}

export function CategoryPageClient({ category }: CategoryPageClientProps) {
  return (
    <div>
      {/* ===== CATEGORY BANNER ===== */}
      <FadeInWhenVisible>
        <div className="relative h-[200px] lg:h-[280px] overflow-hidden bg-primary-100">
          {category.image && (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover opacity-30"
              sizes="100vw"
            />
          )}
          <div className="relative z-10 flex h-full flex-col items-center justify-center
                          text-center px-4">
            <h1 className="text-h1 font-bold text-foreground mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-body text-muted-foreground max-w-2xl">
                {category.description}
              </p>
            )}
            {category.productCount !== undefined && (
              <p className="text-body-sm text-muted-foreground mt-2">
                {category.productCount} san pham
              </p>
            )}
          </div>
        </div>
      </FadeInWhenVisible>

      {/* ===== SUBCATEGORIES CHIPS ===== */}
      {category.children && category.children.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/categories/${category.slug}`}
              className="rounded-full bg-primary-500 px-4 py-1.5 text-body-sm
                         font-medium text-white"
            >
              Tat ca
            </Link>
            {category.children.map((sub: Category) => (
              <Link
                key={sub._id}
                href={`/categories/${sub.slug}`}
                className="rounded-full border border-border bg-white px-4 py-1.5
                           text-body-sm text-foreground hover:border-primary-300
                           hover:text-primary-500 transition-colors"
              >
                {sub.name}
                {sub.productCount !== undefined && (
                  <span className="ml-1 text-muted-foreground">
                    ({sub.productCount})
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== PRODUCT LISTING (reuse filter + grid) ===== */}
      {/* 
        Trong thuc te, su dung cung component ProductListingContent
        voi prop categorySlug de pre-filter theo danh muc.
        
        Vi du:
        <ProductListingContent 
          defaultCategory={category.slug}
          showFilterSidebar 
        />
        
        Component nay bao gom: FilterSidebar + Product Grid + Pagination
        (da duoc implement o Section 1 va Section 2 tren)
      */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {/* Placeholder - reuse ProductListingPage content */}
        <p className="text-body-sm text-muted-foreground">
          {/* Reuse ProductListingContent component voi defaultCategory={category.slug} */}
        </p>
      </div>
    </div>
  );
}
```

### 5.3 Ket noi API

| Data | API | Muc dich |
|---|---|---|
| Category info | `categoryService.getCategoryBySlug(slug)` | Lay thong tin danh muc (banner, children) |
| Products | Reuse `productService.getProducts({ category: slug })` | Filter san pham theo danh muc |

---

## 6. SearchPage

> File: `apps/fe/src/app/(customer)/search/page.tsx`
> Hien thi ket qua tim kiem tu URL params `?q=`.
> Reuse product grid va filter logic.

### 6.1 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/search/page.tsx
// ============================================================
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight } from 'lucide-react';
import { productService } from '@/services/product-service';
import { ProductCard } from '@/components/customer/product-card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { StaggerContainer, StaggerItem, FadeInWhenVisible } from '@/components/ui/animations';
import type { Product } from '@/types';

const ITEMS_PER_PAGE = 12;

// ----- Goi y tim kiem khi khong co ket qua -----
const SEARCH_SUGGESTIONS = [
  'sofa go',
  'ban an',
  'giuong ngu',
  'tu quan ao',
  'ke sach',
  'ban tra',
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;

  // ----- Fetch search results -----
  const { data, isLoading } = useQuery({
    queryKey: ['search', query, page],
    queryFn: () =>
      productService.search({
        q: query,
        page,
        limit: ITEMS_PER_PAGE,
      }),
    enabled: !!query.trim(),
    staleTime: 30 * 1000,
  });

  const products: Product[] = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 0 };

  const breadcrumbItems = [
    { label: 'Trang chu', href: '/' },
    { label: 'Tim kiem' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* Search header */}
      <FadeInWhenVisible>
        <div className="mb-8">
          {query.trim() ? (
            <>
              <h1 className="text-h2 font-bold text-foreground">
                Ket qua tim kiem cho "{query}"
              </h1>
              {!isLoading && (
                <p className="text-body text-muted-foreground mt-1">
                  Tim thay {meta.total} san pham
                </p>
              )}
            </>
          ) : (
            <h1 className="text-h2 font-bold text-foreground">
              Tim kiem san pham
            </h1>
          )}
        </div>
      </FadeInWhenVisible>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-3 shadow-card">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && products.length > 0 && (
        <>
          <StaggerContainer
            className="grid grid-cols-2 gap-4
                       md:grid-cols-3
                       lg:grid-cols-4 lg:gap-6"
          >
            {products.map((product) => (
              <StaggerItem key={product._id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(newPage) => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(newPage));
                  window.history.pushState(null, '', `?${params.toString()}`);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* No results state */}
      {!isLoading && query.trim() && products.length === 0 && (
        <FadeInWhenVisible>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full
                            bg-surface-200 mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-h4 font-semibold text-foreground mb-2">
              Khong tim thay ket qua
            </h2>
            <p className="text-body text-muted-foreground mb-6 max-w-md">
              Khong co san pham nao phu hop voi tu khoa "{query}".
              Thu tim kiem voi tu khoa khac hoac duyet theo danh muc.
            </p>

            {/* Goi y tim kiem */}
            <div className="mb-6">
              <p className="text-body-sm font-medium text-muted-foreground mb-3">
                Goi y tim kiem:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={`/search?q=${encodeURIComponent(suggestion)}`}
                    className="rounded-full border border-border px-4 py-1.5
                               text-body-sm text-foreground hover:border-primary-300
                               hover:text-primary-500 transition-colors"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>
            </div>

            <Button asChild>
              <Link href="/products">
                Xem tat ca san pham
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeInWhenVisible>
      )}
    </div>
  );
}
```

### 6.2 Ket noi API

| Data | API | Muc dich |
|---|---|---|
| Search results | `productService.search({ q, page, limit })` | Tim kiem san pham (full-text) |

---

## 7. Responsive & Animation Summary

### 7.1 Breakpoint Matrix

| Page / Component | Mobile (<768px) | Tablet (768-1023px) | Desktop (1024px+) |
|---|---|---|---|
| **ProductListing** | Filter: bottom sheet, Grid: 1 col | Filter: bottom sheet, Grid: 2 cols | Filter: sidebar 280px, Grid: 3 cols |
| **ProductDetail** | 1 col (image → info), stacked tabs | 1 col, wider layout | 2 cols (image left, info right) |
| **ImageGallery** | Swipe thumbnails, full-screen lightbox | Same | Thumbnails row, click lightbox |
| **VariantSelector** | Wrapped chips | Same | Same, more horizontal space |
| **ComparisonPage** | Horizontal scroll table | 2-3 cols visible | Full table (up to 4 cols) |
| **CategoryPage** | Banner 200px, chips scroll | Banner 200px, chips wrap | Banner 280px |
| **SearchPage** | 2 cols grid | 3 cols | 4 cols |
| **FilterSidebar** | Bottom sheet drawer | Bottom sheet drawer | Fixed sidebar (280px) |

### 7.2 Animation Summary

| Component | Animation | Config |
|---|---|---|
| Product grid | Stagger on load | `StaggerContainer` + `StaggerItem` |
| Filter sections | Expand/collapse | Height `0 → auto`, 200ms |
| Active filter tags | Scale in/out | `scale: 0.9 → 1` + opacity |
| ImageGallery main | Crossfade | `opacity: 0 → 1`, 200ms |
| Lightbox | Fade overlay | `opacity: 0 → 1` |
| ProductDetail sections | Fade in when visible | `FadeInWhenVisible` |
| Comparison table | Fade in | `FadeInWhenVisible` |
| Search results | Stagger grid | `StaggerContainer` |
| Empty states | Fade in | `FadeInWhenVisible` |
| Loading skeleton | Shimmer | CSS `animate-shimmer` |

### 7.3 Data Flow Tong Hop

```
URL Search Params (source of truth cho filters)
  │
  ├─ useSearchParams() → parse ra Filters object
  │
  ├─ React Query: productService.getProducts(filters)
  │   ├─ data.data → Product[] → ProductCard grid
  │   └─ data.meta → Pagination component
  │
  ├─ FilterSidebar (reads + writes URL params)
  │   ├─ categoryService.getCategoryTree() → Category checkboxes
  │   └─ productService.getFilterOptions() → Brand, Material options
  │
  └─ Sort Select → updateFilters({ sort })

Product Detail:
  Server (SSR)
  ├─ productService.getProductBySlug(slug) → product data
  ├─ productService.getRelatedProducts(id) → related products
  └─ generateMetadata() → SEO tags
        ↓
  Client
  ├─ ImageGallery (local state: activeIndex, lightbox)
  ├─ VariantSelector (local state → selectedVariant)
  ├─ useCartStore.addItem() (add to cart)
  ├─ useWishlistStore.toggleWishlist() (wishlist)
  └─ useComparisonStore.addProduct() (compare)

Comparison:
  useComparisonStore.products (Zustand, persist localStorage)
  → ComparisonPage table
  → useCartStore.addItem() per product
```

---

> **Lien ket tai lieu:**
> - Layout & Navigation: `04-frontend/04-customer-layout.md`
> - Home Page: `04-frontend/05-customer-home.md`
> - Types: `04-frontend/01-shared-types.md`
> - API Client & Stores: `04-frontend/02-shared-api-client.md`
> - UI Components: `04-frontend/03-shared-ui-components.md`
