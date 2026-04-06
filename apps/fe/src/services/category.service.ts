import api from '@/lib/api';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';

export const categoryService = {
  getCategories: async (params?: any): Promise<any> => {
    const response = await api.get('/categories', { params });
    return { data: response.data, meta: (response as any).meta };
  },
  getCategoryTree: async (): Promise<Category[]> => {
    const { data } = await api.get('/categories/tree');
    return data;
  },
  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const { data } = await api.get(`/categories/${slug}`);
    return data;
  },
  getCategoryById: async (id: string): Promise<Category> => {
    const { data } = await api.get(`/categories/${id}`);
    return data;
  },
  create: async (payload: CreateCategoryDto): Promise<Category> => {
    const { data } = await api.post('/categories', payload);
    return data;
  },
  createCategory: async (payload: any): Promise<Category> => {
    const { data } = await api.post('/categories', payload);
    return data;
  },
  update: async (id: string, payload: UpdateCategoryDto): Promise<Category> => {
    const { data } = await api.patch(`/categories/${id}`, payload);
    return data;
  },
  updateCategory: async (id: string, payload: any): Promise<Category> => {
    const { data } = await api.patch(`/categories/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
