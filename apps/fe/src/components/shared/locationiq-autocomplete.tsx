'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationIQAutocompleteProps {
  street: string;
  ward: string;
  district: string;
  province: string;
  onChange: (field: 'street' | 'ward' | 'district' | 'province', value: string) => void;
  disabled?: boolean;
}

export function LocationIQAutocomplete({
  street,
  onChange,
  disabled,
}: LocationIQAutocompleteProps) {
  return (
    <div className="space-y-1.5">
      <Label>Địa chỉ cụ thể</Label>
      <Input
        value={street}
        onChange={(e) => onChange('street', e.target.value)}
        placeholder="Số nhà, tên đường..."
        disabled={disabled}
      />
    </div>
  );
}
