'use client';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Category } from '@/types';

interface FeaturedCategoriesProps {
  categories: Category[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const displayed = categories.slice(0, 6);

  return (
    <section className="py-12 lg:py-16">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Danh Muc Noi Bat</h2>
          <p className="mt-2 text-gray-500">Kham pha cac danh muc noi that phu hop voi nhu cau cua ban</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayed.length > 0
            ? displayed.map((cat, i) => (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link href={`/categories/${cat.slug}`}>
                    <div className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-card transition-all duration-200 cursor-pointer">
                      <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden group-hover:bg-primary-100 transition-colors">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-2xl">🪑</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors text-center line-clamp-2">
                        {cat.name}
                      </span>
                      {cat.productCount > 0 && (
                        <span className="text-xs text-gray-400">{cat.productCount} san pham</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
              ))}
        </div>
      </div>
    </section>
  );
}
