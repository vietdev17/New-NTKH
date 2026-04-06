'use client';
import { useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { getProvinces, getDistrictsByProvinceCode, getWardsByDistrictCode } from 'vn-provinces';

interface AddressValue {
  province: string;
  district: string;
  ward: string;
}

interface Props {
  value?: AddressValue;
  onChange: (value: AddressValue) => void;
  errors?: {
    province?: string;
    district?: string;
    ward?: string;
  };
}

export function VietnamAddressSelect({ value, onChange, errors }: Props) {
  const provinces = useMemo(() => getProvinces(), []);

  // Tim province code tu ten
  const selectedProvince = useMemo(
    () => provinces.find((p: any) => p.name === value?.province),
    [provinces, value?.province],
  );

  // Load districts theo province code
  const districts = useMemo(() => {
    if (!selectedProvince) return [];
    return getDistrictsByProvinceCode(selectedProvince.code);
  }, [selectedProvince]);

  // Tim district code tu ten
  const selectedDistrict = useMemo(
    () => districts.find((d: any) => d.name === value?.district),
    [districts, value?.district],
  );

  // Load wards theo district code
  const wards = useMemo(() => {
    if (!selectedDistrict) return [];
    return getWardsByDistrictCode(selectedDistrict.code);
  }, [selectedDistrict]);

  const handleProvince = useCallback(
    (code: string) => {
      const prov = provinces.find((p: any) => p.code === code);
      onChange({ province: prov?.name || '', district: '', ward: '' });
    },
    [provinces, onChange],
  );

  const handleDistrict = useCallback(
    (code: string) => {
      const dist = districts.find((d: any) => d.code === code);
      onChange({
        province: value?.province || '',
        district: dist?.name || '',
        ward: '',
      });
    },
    [districts, value?.province, onChange],
  );

  const handleWard = useCallback(
    (code: string) => {
      const ward = wards.find((w: any) => w.code === code);
      onChange({
        province: value?.province || '',
        district: value?.district || '',
        ward: ward?.name || '',
      });
    },
    [wards, value?.province, value?.district, onChange],
  );

  const selectClass = (hasError?: string) =>
    `w-full rounded-md border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
      hasError ? 'border-red-400' : 'border-gray-200'
    }`;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Tỉnh / Thành phố</Label>
        <select
          className={selectClass(errors?.province)}
          value={selectedProvince?.code || ''}
          onChange={(e) => handleProvince(e.target.value)}
        >
          <option value="">-- Chọn tỉnh/thành phố --</option>
          {provinces.map((p: any) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        {errors?.province && <p className="text-xs text-red-500">{errors.province}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Quận / Huyện</Label>
        <select
          className={selectClass(errors?.district)}
          value={selectedDistrict?.code || ''}
          onChange={(e) => handleDistrict(e.target.value)}
          disabled={!selectedProvince}
        >
          <option value="">-- Chọn quận/huyện --</option>
          {districts.map((d: any) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
        {errors?.district && <p className="text-xs text-red-500">{errors.district}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Phường / Xã</Label>
        <select
          className={selectClass(errors?.ward)}
          value={wards.find((w: any) => w.name === value?.ward)?.code || ''}
          onChange={(e) => handleWard(e.target.value)}
          disabled={!selectedDistrict}
        >
          <option value="">-- Chọn phường/xã --</option>
          {wards.map((w: any) => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
        {errors?.ward && <p className="text-xs text-red-500">{errors.ward}</p>}
      </div>
    </div>
  );
}
