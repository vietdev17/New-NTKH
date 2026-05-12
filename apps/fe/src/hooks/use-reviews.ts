'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/review.service';
import type { QueryParams } from '@/types';
import toast from 'react-hot-toast';

export function useProductReviews(productId: string, params?: QueryParams) {
  return useQuery({
    queryKey: ['reviews', 'product', productId, params],
    queryFn: () => reviewService.getProductReviews(productId, params),
    enabled: !!productId,
  });
}

export function useMyReviews(params?: QueryParams) {
  return useQuery({ queryKey: ['reviews', 'my', params], queryFn: () => reviewService.getMyReviews(params) });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); toast.success('Gửi đánh giá thành công!'); },
    onError: (e: any) => toast.error(e?.message || 'Gửi đánh giá thất bại'),
  });
}

export function useAdminReviews(params?: QueryParams) {
  return useQuery({ queryKey: ['admin', 'reviews', params], queryFn: () => reviewService.getReviews(params) });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: 'approved' | 'rejected' | 'flagged'; adminNote?: string }) =>
      reviewService.moderateReview(id, status, adminNote),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); toast.success('Cập nhật thành công'); },
    onError: (e: any) => toast.error(e?.message || 'Thao tác thất bại'),
  });
}
