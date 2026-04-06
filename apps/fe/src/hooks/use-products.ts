'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import type { ProductFilter } from '@/types';
import toast from 'react-hot-toast';

export function useProducts(params?: ProductFilter) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useFeaturedProducts(limit?: number) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
  });
}

export function useNewArrivals(limit?: number) {
  return useQuery({
    queryKey: ['products', 'new-arrivals', limit],
    queryFn: () => productService.getNewArrivals(limit),
  });
}

export function useSaleProducts(limit?: number) {
  return useQuery({
    queryKey: ['products', 'sale', limit],
    queryFn: () => productService.getSaleProducts(limit),
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productService.searchProducts(query),
    enabled: query.length >= 2,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Tao san pham thanh cong!');
    },
    onError: (error: any) => toast.error(error.message),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Cap nhat san pham thanh cong!');
    },
    onError: (error: any) => toast.error(error.message),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Xoa san pham thanh cong!');
    },
    onError: (error: any) => toast.error(error.message),
  });
}
