'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown,
  LogOut, Package, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCartStore } from '@/stores/use-cart-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import { NotificationBell } from '@/components/shared/notification-bell';
import { CategoryMegaMenu } from '@/components/customer/category-mega-menu';
import { MobileCategoryTree } from '@/components/customer/category-tree-sidebar';
import { useMounted } from '@/hooks/use-mounted';
import { getInitials } from '@/lib/utils';
import { CUSTOMER_NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function CustomerHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);

  // Prevent hydration mismatch — render 0/false on server, real values after mount
  const safeItemCount = mounted ? itemCount : 0;
  const safeWishlistCount = mounted ? wishlistCount : 0;
  const safeIsAuthenticated = mounted ? isAuthenticated : false;
  const safeUser = mounted ? user : null;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-soft' : 'bg-white border-b border-gray-100'
        )}
      >
        {/* Promo bar */}
        <div className="hidden lg:block bg-primary-500">
          <div className="container-custom flex h-8 items-center justify-between text-xs text-white/90">
            <span>🚚 Miễn phí vận chuyển cho đơn hàng từ 2.000.000đ</span>
            <div className="flex items-center gap-6">
              <Link href="/orders" className="hover:text-white transition-colors">Tra cứu đơn hàng</Link>
              <span>Hotline: 1900 xxxx</span>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="container-custom flex h-16 items-center justify-between gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-primary-500">Furniture</span>
              <span className="text-xl font-bold text-secondary-500"> VN</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {CUSTOMER_NAV_ITEMS.map((item) =>
              item.href === '/products' ? (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  onMouseLeave={() => setMegaMenuOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      pathname === item.href || pathname.startsWith('/categories')
                        ? 'text-primary-500 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-500 hover:bg-gray-50'
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', megaMenuOpen && 'rotate-180')} />
                  </Link>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-500 hover:bg-gray-50'
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm nội thất..."
                className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </form>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            <Link href="/wishlist" className="relative rounded-full p-2 hover:bg-gray-100 transition-colors hidden sm:inline-flex">
              <Heart className="h-5 w-5 text-gray-600" />
              {safeWishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                  {safeWishlistCount}
                </span>
              )}
            </Link>

            {safeIsAuthenticated && <NotificationBell />}

            <Link href="/cart" className="relative rounded-full p-2 hover:bg-gray-100 transition-colors">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {safeItemCount > 0 && (
                <motion.span
                  key={safeItemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white"
                >
                  {safeItemCount > 9 ? '9+' : safeItemCount}
                </motion.span>
              )}
            </Link>

            {safeIsAuthenticated && safeUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors ml-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={safeUser?.avatar} />
                      <AvatarFallback className="text-xs bg-primary-100 text-primary-600">
                        {getInitials(safeUser?.fullName || '')}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{safeUser?.fullName}</p>
                    <p className="text-xs text-gray-500 font-normal">{safeUser?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account"><User className="mr-2 h-4 w-4" /> Tài khoản</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders"><Package className="mr-2 h-4 w-4" /> Đơn hàng của tôi</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist"><Heart className="mr-2 h-4 w-4" /> Yêu thích</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile"><Settings className="mr-2 h-4 w-4" /> Cài đặt</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-danger-500 focus:text-danger-500 focus:bg-danger-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container-custom py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mega menu - category dropdown */}
        <AnimatePresence>
          {megaMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="hidden lg:block"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <CategoryMegaMenu />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-elevated lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-bold">F</span>
                  </div>
                  <span className="text-lg font-bold text-primary-500">Furniture VN</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {CUSTOMER_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'text-primary-500 bg-primary-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Category tree for mobile */}
                <MobileCategoryTree onNavigate={() => setMobileMenuOpen(false)} />
                <div className="border-t my-4" />
                {safeIsAuthenticated && safeUser ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <User className="mr-3 h-4 w-4" /> Tài khoản
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <Package className="mr-3 h-4 w-4" /> Đơn hàng của tôi
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <Heart className="mr-3 h-4 w-4" /> Yêu thích ({safeWishlistCount})
                    </Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="flex w-full items-center px-4 py-3 rounded-lg text-sm text-danger-500 hover:bg-danger-50"
                    >
                      <LogOut className="mr-3 h-4 w-4" /> Đăng xuất
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 px-4">
                    <Button asChild className="w-full">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>Đăng ký</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
