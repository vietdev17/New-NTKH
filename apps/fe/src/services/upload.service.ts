import { apiUpload } from '@/lib/api';

export const uploadService = {
  uploadImage: async (file: File, category: string = 'general'): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiUpload.post('/upload/product', formData);
    return { url: data.url, publicId: data.googleDriveFileId };
  },
  uploadMultipleImages: async (files: File[], category: string = 'general'): Promise<{ url: string; publicId: string }[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const { data } = await apiUpload.post('/upload/products', formData);
    return data.map((item: any) => ({ url: item.url, publicId: item.googleDriveFileId }));
  },
  deleteImage: async (publicId: string): Promise<void> => {
    const api = (await import('@/lib/api')).default;
    await api.delete(`/upload/${encodeURIComponent(publicId)}`);
  },
};
