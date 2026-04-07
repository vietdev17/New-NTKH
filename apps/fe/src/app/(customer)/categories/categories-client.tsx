'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import { useCategoryTree } from '@/hooks/use-categories';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Category } from '@/types';

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-card transition-shadow"
    >
      {/* Parent category header */}
      <Link href={`/categories/${category.slug}`} className="group block p-5">
        <div className="flex items-center gap-4">
          {category.image ? (
            <Image
              src={category.image}
              alt={category.name}
              width={64}
              height={64}
              className="rounded-xl object-cover shrink-0"
              unoptimized
            />
          ) : (
            <span className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600 shrink-0">
              {category.name.charAt(0)}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              {category.productCount > 0 && (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" /> {category.productCount} sản phẩm
                </span>
              )}
              {hasChildren && (
                <span>{category.children!.length} danh mục con</span>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" />
        </div>
      </Link>

      {/* Children */}
      {hasChildren && (
        <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {category.children!.map((child) => (
              <Link
                key={child._id}
                href={`/categories/${child.slug}`}
                className="group/child flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-sm"
              >
                {child.image ? (
                  <Image
                    src={child.image}
                    alt={child.name}
                    width={28}
                    height={28}
                    className="rounded object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <span className="w-7 h-7 rounded bg-primary-100 flex items-center justify-center text-xs text-primary-600 shrink-0">
                    {child.name.charAt(0)}
                  </span>
                )}
                <span className="text-gray-700 group-hover/child:text-primary-600 truncate">
                  {child.name}
                </span>
                {child.productCount > 0 && (
                  <span className="ml-auto text-xs text-gray-400 shrink-0">{child.productCount}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategoryTree();
  const tree = Array.isArray(categories) ? categories : [];

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Danh Mục Sản Phẩm</h1>
        <p className="text-gray-500 mt-1">
          Khám phá bộ sưu tập nội thất đa dạng theo từng danh mục
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Chưa có danh mục nào.
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {tree.map((cat, i) => (
            <CategoryCard key={cat._id} category={cat} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
