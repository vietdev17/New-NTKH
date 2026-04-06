'use client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-100">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-warning-500" />
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Co loi xay ra</h2>
        <p className="mt-2 text-gray-500">Xin loi, da co loi xay ra. Vui long thu lai.</p>
        <Button onClick={reset} className="mt-8"><RefreshCw className="mr-2 h-4 w-4" /> Thu lai</Button>
      </div>
    </div>
  );
}
