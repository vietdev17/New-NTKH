'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  isLoading?: boolean;
}

const icons = {
  danger: <Trash2 className="h-6 w-6 text-danger-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-warning-500" />,
  info: <Info className="h-6 w-6 text-info-500" />,
};

const confirmStyles = {
  danger: 'bg-danger-500 hover:bg-danger-600 text-white',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white',
  info: 'bg-info-500 hover:bg-info-600 text-white',
};

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Xac nhan', cancelLabel = 'Huy', variant = 'danger', onConfirm, isLoading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', variant === 'danger' ? 'bg-danger-50' : variant === 'warning' ? 'bg-warning-50' : 'bg-info-50')}>
              {icons[variant]}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{cancelLabel}</Button>
          <Button className={confirmStyles[variant]} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Dang xu ly...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
