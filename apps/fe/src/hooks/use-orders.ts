'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import type { CreateOrderDto, QueryParams } from '@/types';
import { useCartStore } from '@/stores/use-cart-store';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useMyOrders(params?: QueryParams) {
  return useQuery({ queryKey: ['orders', 'my', params], queryFn: () => orderService.getMyOrders(params) });
}

// Generic orders hook (works for both admin and customer)
export function useOrders(params?: QueryParams) {
  return useQuery({ queryKey: ['orders', params], queryFn: () => orderService.getAllOrders(params) });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['order', id], queryFn: () => orderService.getOrderById(id), enabled: !!id });
}

export function useMyOrder(id: string) {
  return useQuery({ queryKey: ['order', 'my', id], queryFn: () => orderService.getMyOrderById(id), enabled: !!id });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();
  return useMutation({
    mutationFn: (data: CreateOrderDto) => orderService.createOrder(data),
    onSuccess: (order) => {
      clearCart();
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đặt hàng thành công!');
      router.push(`/checkout/success?orderId=${order._id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => orderService.cancelOrder(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Hủy đơn hàng thành công'); },
    onError: (e: any) => toast.error(e.message),
  });
}

// Admin hooks
export function useAdminOrders(params?: QueryParams) {
  return useQuery({ queryKey: ['admin', 'orders', params], queryFn: () => orderService.getAllOrders(params) });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) => orderService.updateOrderStatus(id, status, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); qc.invalidateQueries({ queryKey: ['order'] }); toast.success('Cập nhật trạng thái thành công'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAssignShipper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, shipperId }: { orderId: string; shipperId: string }) => orderService.assignShipper(orderId, shipperId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); toast.success('Gán shipper thành công'); },
    onError: (e: any) => toast.error(e.message),
  });
}
