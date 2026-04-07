'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategoryTree } from '@/hooks/use-categories';
import type { Category } from '@/types';

export function CategoryMegaMenu() {
  const { data: categories } = useCategoryTree();
  const [activeParent, setActiveParent] = useState<string | null>(null);

  const tree = Array.isArray(categories) ? categories : [];
  const activeCategory = tree.find((c) => c._id === activeParent);

  if (tree.length === 0) return null;

  return (
    <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-elevated z-50">
      <div className="container-custom py-6">
        <div className="flex gap-6">
          {/* Left: parent categories */}
          <div className="w-64 shrink-0 border-r border-gray-100 pr-6">
            <Link
              href="/categories"
              className="flex items-center gap-2 px-3 py-2 mb-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Grid3X3 className="h-4 w-4" />
              Tất Cả Danh Mục
            </Link>
            {tree.map((cat) => (
              <Link
                key={cat._id}
                href={`/categories/${cat.slug}`}
                onMouseEnter={() => setActiveParent(cat._id)}
                className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  activeParent === cat._id
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={24}
                      height={24}
                      className="rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center text-xs">
                      {cat.name.charAt(0)}
                    </span>
                  )}
                  {cat.name}
                </span>
                {cat.children && cat.children.length > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </Link>
            ))}
          </div>

          {/* Right: children + featured */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeCategory && activeCategory.children && activeCategory.children.length > 0 ? (
                <motion.div
                  key={activeCategory._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {activeCategory.name}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {activeCategory.children.map((child) => (
                      <Link
                        key={child._id}
                        href={`/categories/${child.slug}`}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
                      >
                        {child.image ? (
                          <Image
                            src={child.image}
                            alt={child.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover shrink-0"
                            unoptimized
                          />
                        ) : (
                          <span className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-lg shrink-0">
                            {child.name.charAt(0)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                            {child.name}
                          </p>
                          {child.productCount > 0 && (
                            <p className="text-xs text-gray-500">{child.productCount} sản phẩm</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ) : activeCategory ? (
                <motion.div
                  key={activeCategory._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <p className="text-sm text-gray-500">
                    Xem tất cả sản phẩm trong{' '}
                    <Link href={`/categories/${activeCategory.slug}`} className="text-primary-600 font-medium hover:underline">
                      {activeCategory.name}
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {tree.slice(0, 8).map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/categories/${cat.slug}`}
                      className="group text-center p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-soft transition-all"
                    >
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          width={64}
                          height={64}
                          className="rounded-lg object-cover mx-auto mb-2"
                          unoptimized
                        />
                      ) : (
                        <span className="w-16 h-16 rounded-lg bg-primary-100 flex items-center justify-center text-2xl mx-auto mb-2">
                          {cat.name.charAt(0)}
                        </span>
                      )}
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 truncate">
                        {cat.name}
                      </p>
                      {cat.productCount > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">{cat.productCount} sản phẩm</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
