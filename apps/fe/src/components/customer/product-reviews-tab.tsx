'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, ThumbsUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PaginationControl } from '@/components/shared/pagination-control';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { reviewService } from '@/services/review.service';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ProductReviewsTabProps {
  productId: string;
  productName: string;
}

export default function ProductReviewsTab({ productId, productName }: ProductReviewsTabProps) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', productId, page, sort],
    queryFn: () => reviewService.getProductReviews(productId, { page, limit: 5, sort }),
    enabled: !!productId,
  });

  const { data: stats } = useQuery({
    queryKey: ['product-review-stats', productId],
    queryFn: () => reviewService.getProductReviewStats(productId),
    enabled: !!productId,
  });

  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', productId],
    queryFn: () => reviewService.canReview(productId),
    enabled: !!productId,
  });

  const reviews = (reviewsData as any)?.data || [];
  const meta = (reviewsData as any)?.meta || {};
  const st = stats as any;
  const canReview = (canReviewData as any)?.canReview;
  const eligibleOrders = (canReviewData as any)?.eligibleOrders || [];

  const [formOrderId, setFormOrderId] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenDialog = () => {
    if (eligibleOrders.length > 0) setFormOrderId(eligibleOrders[0].orderId);
    setFormRating(5);
    setFormTitle('');
    setFormComment('');
    setReviewOpen(true);
  };

  const handleSubmit = async () => {
    if (!formOrderId) { toast.error('Vui lòng chọn đơn hàng'); return; }
    if (!formComment.trim()) { toast.error('Vui lòng viết nội dung đánh giá'); return; }
    setSubmitting(true);
    try {
      await reviewService.createReview({
        productId,
        orderId: formOrderId,
        rating: formRating,
        title: formTitle.trim() || undefined,
        comment: formComment.trim(),
      });
      toast.success('Gửi đánh giá thành công!');
      setReviewOpen(false);
      qc.invalidateQueries({ queryKey: ['product-reviews', productId] });
      qc.invalidateQueries({ queryKey: ['product-review-stats', productId] });
      qc.invalidateQueries({ queryKey: ['can-review', productId] });
    } catch (e: any) {
      toast.error(e?.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const distribution = st?.ratingDistribution || {};

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
      {/* Header: Stats + Write Review */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="text-center shrink-0">
            <p className="text-4xl font-bold text-gray-900">{st?.averageRating > 0 ? st.averageRating.toFixed(1) : '0.0'}</p>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn('h-4 w-4', s <= Math.round(st?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200')} />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">{st?.totalReviews || 0} đánh giá</p>
          </div>

          {/* Distribution bars */}
          {st?.totalReviews > 0 && (
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = st.totalReviews > 0 ? (count / st.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 w-3">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-400 text-xs w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canReview && (
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 shrink-0" onClick={handleOpenDialog}>Viết đánh giá</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Đánh giá {productName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {eligibleOrders.length > 0 && (
                  <div>
                    <Label>Đơn hàng</Label>
                    <Select value={formOrderId} onValueChange={setFormOrderId}>
                      <SelectTrigger><SelectValue placeholder="Chọn đơn hàng" /></SelectTrigger>
                      <SelectContent>
                        {eligibleOrders.map((o: any) => (
                          <SelectItem key={o.orderId} value={o.orderId}>
                            Đơn #{o.orderCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Đánh giá</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setFormRating(s)} className="p-0.5">
                        <Star className={cn('h-7 w-7 transition-colors', s <= formRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-300')} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Tiêu đề (tùy chọn)</Label>
                  <input
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Tóm tắt trải nghiệm của bạn..."
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label>Nội dung đánh giá</Label>
                  <Textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Chia sẻ chi tiết trải nghiệm của bạn về sản phẩm..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setReviewOpen(false)}>Hủy</Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Sort */}
      {st?.totalReviews > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="highest">Điểm cao nhất</SelectItem>
              <SelectItem value="lowest">Điểm thấp nhất</SelectItem>
              <SelectItem value="most_helpful">Hữu ích nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Review List */}
      {reviewsLoading ? (
        <LoadingSpinner className="py-8" />
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có đánh giá nào</p>
          <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đánh giá sản phẩm này</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {reviews.map((review: any) => {
            const user = review.userId || review.user;
            return (
              <div key={review._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-medium text-gray-500">
                    {(user?.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user?.fullName || 'Khách hàng'}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')} />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="text-sm font-medium mt-1">{review.title}</p>}
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img: string, i: number) => (
                          <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-50">
                            <Image src={img} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      {review.helpfulCount > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <ThumbsUp className="h-3 w-3" /> {review.helpfulCount}
                        </span>
                      )}
                    </div>
                    {review.adminNote && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2.5 py-1.5">
                        <span className="font-medium">Phản hồi từ cửa hàng:</span> {review.adminNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-4">
          <PaginationControl currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
