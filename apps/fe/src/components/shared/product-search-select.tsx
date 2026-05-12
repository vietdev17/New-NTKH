'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { Check } from 'lucide-react';

interface ProductSearchSelectProps {
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}

export function ProductSearchSelect({ value, onChange, excludeId }: ProductSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['products-search-combo', search],
    queryFn: () => productService.getProducts({ page: 1, limit: 10, search }),
    enabled: open,
  });

  const items = (products as any)?.data || [];

  const filtered = items.filter((p: any) => p._id !== excludeId);
  const selected = items.find((p: any) => p._id === value);

  return (
    <div className="relative">
      <div
        className="h-10 px-3 border border-gray-200 rounded-md bg-white text-sm cursor-pointer flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected?.name || 'Chọn sản phẩm...'}
        </span>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary-500"
                autoFocus
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy sản phẩm</div>
              )}
              {filtered.map((p: any) => (
                <div
                  key={p._id}
                  className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    onChange(p._id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-gray-400 text-xs">{(p.basePrice || 0).toLocaleString('vi-VN')}đ</span>
                  {p._id === value && <Check className="h-4 w-4 text-primary-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
