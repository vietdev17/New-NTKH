'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, Bell, Star, Shield, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/use-auth-store';
import { getInitials, formatDate } from '@/lib/utils';

const MENU_ITEMS = [
  { href: '/account/profile', icon: User, label: 'Thông Tin Cá Nhân', desc: 'Cập nhật thông tin và mật khẩu' },
  { href: '/orders', icon: Package, label: 'Đơn Hàng Của Tôi', desc: 'Xem lịch sử và trạng thái đơn hàng' },
  { href: '/wishlist', icon: Heart, label: 'Sản Phẩm Yêu Thích', desc: 'Danh sách sản phẩm bạn đã lưu' },
  { href: '/account/addresses', icon: MapPin, label: 'Địa Chỉ Giao Hàng', desc: 'Quản lý địa chỉ nhận hàng' },
  { href: '/reviews', icon: Star, label: 'Đánh Giá Của Tôi', desc: 'Xem và quản lý đánh giá sản phẩm' },
  { href: '/account/notifications', icon: Bell, label: 'Thông Báo', desc: 'Cài đặt và xem thông báo' },
];

export default function AccountPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="container-custom py-6 lg:py-10 max-w-2xl">
      {/* Profile summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xl bg-primary-100 text-primary-600">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">Tham gia từ {formatDate(user.createdAt)}</p>
          </div>
        </div>
        {user.loyaltyPoints > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary-500" />
            <div>
              <p className="text-sm font-medium text-primary-700">Điểm tích lũy</p>
              <p className="text-xl font-bold text-primary-600">{user.loyaltyPoints.toLocaleString()} điểm</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Menu */}
      <div className="space-y-2">
        {MENU_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={item.href}>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-card hover:border-primary-200 hover:shadow-card-hover transition-all duration-200 group">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <Icon className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-400 transition-colors" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
