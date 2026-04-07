'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/customer/product-card';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductSectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  viewAllHref: string;
  accent?: 'primary' | 'secondary' | 'accent';
}

const accentColors = {
  primary: 'text-primary-500',
  secondary: 'text-secondary-500',
  accent: 'text-accent-400',
};

export function ProductSection({ title, subtitle, products, viewAllHref, accent = 'primary' }: ProductSectionProps) {
  return (
    <section className="py-12 lg:py-16">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className={cn('text-2xl lg:text-3xl font-bold text-gray-900', accentColors[accent])}>
              {title}
            </h2>
            <p className="mt-1 text-gray-500 text-sm">{subtitle}</p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex gap-1 text-gray-600 hover:text-primary-600">
            <Link href={viewAllHref}>
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href={viewAllHref}>Xem tất cả <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
