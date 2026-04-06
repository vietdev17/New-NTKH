import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-100">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-primary-500">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Trang khong ton tai</h2>
        <p className="mt-2 text-gray-500">Xin loi, trang ban dang tim khong ton tai hoac da bi xoa.</p>
        <Button asChild className="mt-8">
          <Link href="/"><Home className="mr-2 h-4 w-4" /> Tro ve trang chu</Link>
        </Button>
      </div>
    </div>
  );
}
