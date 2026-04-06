'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategoryTree } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

// Recursive tree node for sidebar
function CategoryNode({
  category,
  activeSlug,
  depth = 0,
  onNavigate,
}: {
  category: Category;
  activeSlug?: string;
  depth?: number;
  onNavigate?: () => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isActive = activeSlug === category.slug;
  const [open, setOpen] = useState(isActive || (hasChildren && category.children!.some((c) => c.slug === activeSlug)));

  return (
    <div>
      <div className="flex items-center">
        {hasChildren && (
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded hover:bg-gray-100 transition-colors mr-0.5"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        <Link
          href={`/categories/${category.slug}`}
          onClick={onNavigate}
          className={cn(
            'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
            isActive
              ? 'text-primary-600 bg-primary-50 font-medium'
              : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
          )}
          style={{ paddingLeft: depth > 0 ? `${depth * 8}px` : undefined }}
        >
          {hasChildren ? (
            open ? <FolderOpen className="h-4 w-4 text-primary-500 shrink-0" /> : <Folder className="h-4 w-4 text-gray-400 shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 shrink-0">
              {category.name.charAt(0)}
            </span>
          )}
          <span className="truncate">{category.name}</span>
          {category.productCount > 0 && (
            <span className="ml-auto text-xs text-gray-400 shrink-0">{category.productCount}</span>
          )}
        </Link>
      </div>

      <AnimatePresence>
        {hasChildren && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-3 border-l border-gray-100 pl-1"
          >
            {category.children!.map((child) => (
              <CategoryNode
                key={child._id}
                category={child}
                activeSlug={activeSlug}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Full sidebar with category tree — used on Products page
export function CategoryTreeSidebar({
  activeSlug,
  onFilterChange,
}: {
  activeSlug?: string;
  onFilterChange?: (key: string, value: string) => void;
}) {
  const { data: categories, isLoading } = useCategoryTree();
  const tree = Array.isArray(categories) ? categories : [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tree.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-gray-900 text-sm mb-3 px-2">Danh Muc San Pham</h3>
      <Link
        href="/products"
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
          !activeSlug
            ? 'text-primary-600 bg-primary-50 font-medium'
            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
        )}
      >
        <Folder className="h-4 w-4 text-gray-400" />
        Tat ca san pham
      </Link>
      {tree.map((cat) => (
        <CategoryNode
          key={cat._id}
          category={cat}
          activeSlug={activeSlug}
        />
      ))}
    </div>
  );
}

// Compact tree for mobile menu
export function MobileCategoryTree({ onNavigate }: { onNavigate?: () => void }) {
  const { data: categories } = useCategoryTree();
  const [expanded, setExpanded] = useState(false);
  const tree = Array.isArray(categories) ? categories : [];

  if (tree.length === 0) return null;

  return (
    <div className="border-t border-b border-gray-100 my-2 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold text-gray-900"
      >
        Danh Muc
        <ChevronDown className={cn('h-4 w-4 text-gray-500 transition-transform', expanded && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-2"
          >
            {tree.map((cat) => (
              <CategoryNode
                key={cat._id}
                category={cat}
                onNavigate={onNavigate}
              />
            ))}
            <Link
              href="/categories"
              onClick={onNavigate}
              className="flex items-center gap-2 px-2 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg mt-1"
            >
              Xem tat ca danh muc →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
