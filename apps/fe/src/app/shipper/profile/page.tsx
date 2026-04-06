'use client';
import { motion } from 'framer-motion';
import { Camera, LogOut, Star, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/use-auth-store';
import { useQuery } from '@tanstack/react-query';
import { shipperService } from '@/services/shipper.service';
import { getInitials, formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ShipperProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ['shipper-stats'],
    queryFn: () => shipperService.getMyStats(),
  });
  const s = stats as any;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="pb-20 pt-4">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-secondary-600 to-secondary-800 text-white px-4 pt-4 pb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xl bg-secondary-500 text-white">
                {getInitials(user?.fullName || '')}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-white flex items-center justify-center shadow">
              <Camera className="h-3.5 w-3.5 text-secondary-600" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.fullName}</h1>
            <p className="text-secondary-200 text-sm">{user?.email}</p>
            <p className="text-secondary-200 text-xs mt-0.5">Shipper</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 grid grid-cols-3 divide-x"
        >
          <div className="text-center px-2">
            <p className="text-xl font-bold text-primary-600">{s?.totalDeliveries || 0}</p>
            <p className="text-xs text-gray-500">Đã giao</p>
          </div>
          <div className="text-center px-2">
            <p className="text-xl font-bold text-secondary-600">{formatPrice(s?.totalEarnings || 0)}</p>
            <p className="text-xs text-gray-500">Thu nhập</p>
          </div>
          <div className="text-center px-2">
            <p className="text-xl font-bold text-accent-600">{s?.rating?.toFixed(1) || '—'}</p>
            <p className="text-xs text-gray-500">Đánh giá</p>
          </div>
        </motion.div>

        {/* Vehicle info */}
        {user && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
            <h3 className="font-semibold text-sm mb-3">Thông tin phương tiện</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Điện thoại</span>
                <span className="font-medium">{user.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phương tiện</span>
                <span className="font-medium capitalize">{(user as any).vehicleType || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biển số</span>
                <span className="font-medium">{(user as any).vehiclePlate || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-danger-300 text-danger-500 hover:bg-danger-50 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
