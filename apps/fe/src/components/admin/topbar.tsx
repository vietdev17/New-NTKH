'use client';
import { Menu, LogOut, Settings } from 'lucide-react';
import { useSidebarStore } from '@/stores/use-sidebar-store';
import { NotificationBell } from '@/components/shared/notification-bell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/use-auth-store';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_ITEMS } from '@/lib/constants';

export function AdminTopbar() {
  const { setMobileOpen } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = ADMIN_NAV_ITEMS.find(
    (item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white/95 backdrop-blur-md px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 hidden sm:block">
          {currentPage?.label || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs bg-primary-100 text-primary-600">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium leading-none">{user.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{user.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-gray-500 font-normal">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> Cai dat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-danger-500 focus:text-danger-500 focus:bg-danger-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Dang xuat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
