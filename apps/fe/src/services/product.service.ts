import api from '@/lib/api';
import type { Product, ProductFilter, PaginatedResponse, CreateProductDto, UpdateProductDto } from '@/types';

export const productService = {
  getProducts: async (params?: ProductFilter): Promise<{ data: Product[]; meta: any }> => {
    const response = await api.get('/products', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getProductBySlug: async (slug: string): Promise<Product> => {
    const { data } = await api.get(`/products/${slug}`);
    return data;
  },
  getProductById: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },
  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    const { data } = await api.get('/products', { params: { isFeatured: true, limit } });
    return data;
  },
  getNewArrivals: async (limit: number = 8): Promise<Product[]> => {
    const { data } = await api.get('/products', { params: { sort: 'createdAt:desc', limit } });
    return data;
  },
  getSaleProducts: async (limit: number = 8): Promise<Product[]> => {
    const { data } = await api.get('/products', { params: { sale: true, limit } });
    return data;
  },
  searchProducts: async (query: string, limit: number = 10): Promise<Product[]> => {
    const { data } = await api.get('/products', { params: { search: query, limit } });
    return data;
  },
  create: async (payload: CreateProductDto): Promise<Product> => {
    const { data } = await api.post('/products', payload);
    return data;
  },
  update: async (id: string, payload: UpdateProductDto): Promise<Product> => {
    const { data } = await api.patch(`/products/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
