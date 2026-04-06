import { cn } from '@/lib/utils';
import { Package, ShoppingCart, Heart, Search, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        {icon || <Package className="h-8 w-8 text-gray-400" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>}
      {actionLabel && (actionHref ? (
        <Button asChild><Link href={actionHref}>{actionLabel}</Link></Button>
      ) : onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null)}
    </div>
  );
}

export const EmptyCart = () => <EmptyState icon={<ShoppingCart className="h-8 w-8 text-gray-400" />} title="Giỏ hàng trống" description="Bạn chưa có sản phẩm nào trong giỏ hàng" actionLabel="Mua sắm ngay" actionHref="/products" />;
export const EmptyWishlist = () => <EmptyState icon={<Heart className="h-8 w-8 text-gray-400" />} title="Chưa có sản phẩm yêu thích" description="Hãy thêm sản phẩm yêu thích để theo dõi giá và khuyến mại" actionLabel="Khám phá sản phẩm" actionHref="/products" />;
export const EmptySearch = () => <EmptyState icon={<Search className="h-8 w-8 text-gray-400" />} title="Không tìm thấy kết quả" description="Thử thay đổi từ khóa tìm kiếm" />;
export const EmptyOrders = () => <EmptyState icon={<FileText className="h-8 w-8 text-gray-400" />} title="Chưa có đơn hàng" description="Bạn chưa có đơn hàng nào" actionLabel="Mua sắm ngay" actionHref="/products" />;
export const EmptyReviews = () => <EmptyState icon={<Star className="h-8 w-8 text-gray-400" />} title="Chưa có đánh giá" description="Bạn chưa viết đánh giá nào" />;
