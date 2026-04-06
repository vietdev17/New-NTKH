'use client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin/product-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useProduct, useUpdateProduct } from '@/hooks/use-products';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();

  const handleSubmit = async (data: any) => {
    await new Promise<void>((resolve, reject) => {
      updateProduct.mutate({ id, data }, {
        onSuccess: () => {
          toast.success('Cập nhật thành công');
          router.push('/admin/products');
          resolve();
        },
        onError: (e: any) => {
          toast.error(e.message || 'Cập nhật thất bại');
          reject(e);
        },
      });
    });
  };

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/admin/products"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
        </Button>
        <h1 className="text-2xl font-bold">Chỉnh Sửa Sản Phẩm</h1>
      </div>
      <ProductForm
        defaultValues={product as any}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
      />
    </div>
  );
}
