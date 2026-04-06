import { cn } from '@/lib/utils';
import { formatPrice, calculateDiscount } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  salePrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priceSize = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export function PriceDisplay({ price, originalPrice, salePrice, size = 'md', className }: PriceDisplayProps) {
  // salePrice < price means price is original, salePrice is discounted
  const displayPrice = salePrice && salePrice < price ? salePrice : price;
  const comparePrice = salePrice && salePrice < price ? price : originalPrice;

  const hasDiscount = comparePrice && comparePrice > displayPrice;
  const discountPercent = hasDiscount ? calculateDiscount(comparePrice, displayPrice) : 0;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className={cn('font-bold text-primary-500', priceSize[size])}>
        {formatPrice(displayPrice)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn('line-through text-gray-400', size === 'lg' ? 'text-sm' : 'text-xs')}>
            {formatPrice(comparePrice)}
          </span>
          <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-semibold text-danger-600">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
