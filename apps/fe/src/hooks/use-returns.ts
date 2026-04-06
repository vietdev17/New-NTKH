'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnService } from '@/services/return.service';
import type { QueryParams } from '@/types';
import toast from 'react-hot-toast';

export function useMyReturns(params?: QueryParams) {
  return useQuery({
    queryKey: ['returns', 'my', params],
    queryFn: () => returnService.getMyReturns(params),
  });
}

export function useReturns(params?: QueryParams) {
  return useQuery({
    queryKey: ['returns', params],
    queryFn: () => returnService.getAllReturns(params),
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: ['return', id],
    queryFn: () => returnService.getReturnById(id),
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: returnService.createReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Đã gửi yêu cầu đổi trả');
    },
    onError: (e: any) => toast.error(e.message || 'Gửi yêu cầu thất bại'),
  });
}

export function useProcessReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => returnService.processReturn(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Đã xử lý yêu cầu đổi trả');
    },
    onError: (e: any) => toast.error(e.message || 'Xử lý thất bại'),
  });
}
