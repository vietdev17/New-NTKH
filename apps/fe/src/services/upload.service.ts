import { apiUpload } from '@/lib/api';

export const uploadService = {
  uploadImage: async (file: File, category: string = 'general'): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const { data } = await apiUpload.post('/upload', formData);
    return data;
  },
  uploadMultipleImages: async (files: File[], category: string = 'general'): Promise<{ url: string; publicId: string }[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('category', category);
    const { data } = await apiUpload.post('/upload/multiple', formData);
    return data;
  },
  deleteImage: async (publicId: string): Promise<void> => {
    const api = (await import('@/lib/api')).default;
    await api.delete(`/upload/${encodeURIComponent(publicId)}`);
  },
};
