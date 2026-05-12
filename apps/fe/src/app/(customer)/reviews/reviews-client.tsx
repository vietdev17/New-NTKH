'use client';

import Image from 'next/image';
import { Star, Edit3, Trash2, X, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyReviews } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useMyReviews } from '@/hooks/use-reviews';
import { reviewService } from '@/services/review.service';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  flagged: 'Đã báo cáo',
};

export default function ReviewsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyReviews({ limit: 50 });
  const reviews = (data as any)?.data || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (review: any) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await reviewService.updateReview(editingId, { rating: editRating, comment: editComment });
      toast.success('Cập nhật đánh giá thành công');
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['reviews', 'my'] });
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await reviewService.deleteReview(id);
      toast.success('Đã xóa đánh giá');
      qc.invalidateQueries({ queryKey: ['reviews', 'my'] });
    } catch (e: any) {
      toast.error(e?.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="container-custom py-6 lg:py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Star className="h-6 w-6 text-primary-500" />
        <h1 className="text-2xl font-bold">Đánh giá của tôi</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const product = review.productId || review.product;
            const isEditing = editingId === review._id;
            const canEdit = review.status === 'pending';

            return (
              <div key={review._id} className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                <div className="flex gap-4">
                  {product && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                      <Image
                        src={product.images?.[0] || '/images/placeholder.svg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{product?.name || '—'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn('h-4 w-4', s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')}
                            />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusBadge status={review.status} type="review" />
                        {canEdit && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(review)}>
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={() => handleDelete(review._id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        <div>
                          <Label>Số sao</Label>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setEditRating(s)}
                                className="p-0.5"
                              >
                                <Star
                                  className={cn('h-6 w-6 transition-colors', s <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-300')}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Nội dung</Label>
                          <textarea
                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 min-h-[60px] resize-y"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Viết đánh giá của bạn..."
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>Hủy</Button>
                          <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mt-2">{review.comment || '—'}</p>
                        {review.adminNote && (
                          <div className="mt-2 text-xs text-gray-400 bg-gray-50 rounded px-2 py-1">
                            <span className="font-medium">Phản hồi admin:</span> {review.adminNote}
                          </div>
                        )}
                        {review.images?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.images.map((img: string, i: number) => (
                              <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-50">
                                <Image src={img} alt="" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
