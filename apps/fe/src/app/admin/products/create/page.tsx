'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin/product-form';
import { useCreateProduct } from '@/hooks/use-products';
import toast from 'react-hot-toast';

export default function CreateProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: any) => {
    await new Promise<void>((resolve, reject) => {
      createProduct.mutate(data, {
        onSuccess: () => {
          toast.success('Tạo sản phẩm thành công');
          router.push('/admin/products');
          resolve();
        },
        onError: (e: any) => {
          toast.error(e.message || 'Tạo thất bại');
          reject(e);
        },
      });
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/admin/products"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
        </Button>
        <h1 className="text-2xl font-bold">Thêm Sản Phẩm Mới</h1>
      </div>
      <ProductForm onSubmit={handleSubmit} isLoading={createProduct.isPending} />
    </div>
  );
}
