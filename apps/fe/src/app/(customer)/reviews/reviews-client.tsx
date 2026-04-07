'use client';
import Image from 'next/image';
import { Star, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyReviews } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useMyReviews } from '@/hooks/use-reviews';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function ReviewsPage() {
  const { data, isLoading } = useMyReviews({ limit: 20 });
  const reviews = (data as any)?.data || [];

  return (
    <div className="container-custom py-6 lg:py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Star className="h-6 w-6 text-primary-500" />
        <h1 className="text-2xl font-bold">Đánh Giá Của Tôi</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review._id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
              <div className="flex gap-4">
                {review.product && (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    <Image
                      src={review.product.images?.[0] || '/images/placeholder.svg'}
                      alt={review.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{review.product?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn('h-4 w-4', s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{review.comment}</p>
                  <div className="flex items-center justify-between mt-3">
                    <StatusBadge status={review.status} type="review" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-danger-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
