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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); toast.success('Gui danh gia thanh cong!'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAdminReviews(params?: QueryParams) {
  return useQuery({ queryKey: ['admin', 'reviews', params], queryFn: () => reviewService.getAllReviews(params) });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminReply }: { id: string; status: 'approved' | 'rejected'; adminReply?: string }) =>
      reviewService.moderateReview(id, status, adminReply),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'reviews'] }); toast.success('Cap nhat thanh cong'); },
    onError: (e: any) => toast.error(e.message),
  });
}
