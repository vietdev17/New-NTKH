'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { useSidebarStore } from '@/stores/use-sidebar-store';
import { ADMIN_NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const { isExpanded, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
        <Link href="/admin" className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold">F</span>
          </div>
          {isExpanded && (
            <span className="text-base font-bold text-primary-500 truncate">Admin Panel</span>
          )}
        </Link>
        <button
          onClick={toggle}
          className="hidden lg:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', !isExpanded && 'rotate-180')} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                !isExpanded && 'justify-center px-2'
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isExpanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden lg:block h-screen bg-white border-r border-gray-200 transition-all duration-300',
          isExpanded ? 'w-64' : 'w-20'
        )}
      >
        {navContent}
      </aside>

      {/* Mobile overlay + sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-screen w-64 bg-white shadow-elevated lg:hidden"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
