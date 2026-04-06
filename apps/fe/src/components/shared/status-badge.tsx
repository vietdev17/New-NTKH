import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS, REVIEW_STATUS_LABELS, RETURN_STATUS_LABELS, SHIPPER_STATUS_LABELS } from '@/lib/constants';

type StatusType = 'order' | 'payment' | 'review' | 'return' | 'shipper';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const labelMaps: Record<StatusType, Record<string, string>> = {
  order: ORDER_STATUS_LABELS,
  payment: PAYMENT_STATUS_LABELS,
  review: REVIEW_STATUS_LABELS,
  return: RETURN_STATUS_LABELS,
  shipper: SHIPPER_STATUS_LABELS,
};

export function StatusBadge({ status, type = 'order', className }: StatusBadgeProps) {
  const labels = labelMaps[type];
  const label = labels[status] || status;
  const colorClass = type === 'order' ? ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-600' : ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', colorClass, className)}>
      {label}
    </span>
  );
}
