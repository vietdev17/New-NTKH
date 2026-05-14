'use client';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/shared/image-upload';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';

const RichTextEditor = dynamic(
  () => import('@/components/shared/rich-text-editor').then(m => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-[200px] bg-gray-50 animate-pulse rounded-lg" /> },
);

const ProductSearchSelect = dynamic(
  () => import('@/components/shared/product-search-select').then(m => ({ default: m.ProductSearchSelect })),
  { ssr: false },
);

interface ProductFormProps {
  defaultValues?: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ defaultValues, onSubmit, isLoading }: ProductFormProps) {
  const [isCombo, setIsCombo] = useState(!!defaultValues?.comboItems?.length);

  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoryService.getCategories({ limit: 100 }),
  });
  const cats = (categories as any)?.data || [];

  const normalizedDefaults = {
    images: [],
    dimensions: [],
    comboItems: [],
    comboDiscountPercent: 0,
    ...defaultValues,
    categoryId: typeof defaultValues?.categoryId === 'object' ? defaultValues?.categoryId?._id : defaultValues?.categoryId,
    colors: Array.isArray(defaultValues?.colors)
      ? defaultValues.colors.map((c: any) => ({ ...c, hexCode: c.hexCode || c.hex || '#000000' }))
      : [],
  };

  const { register, handleSubmit, setValue, watch, formState: { errors }, control } = useForm<any>({
    defaultValues: normalizedDefaults,
  });

  const images = watch('images') || [];
  const description = watch('description') || '';
  const { fields: colorFields, append: addColor, remove: removeColor } = useFieldArray({ control, name: 'colors' });
  const { fields: dimFields, append: addDim, remove: removeDim } = useFieldArray({ control, name: 'dimensions' });
  const { fields: comboFields, append: addComboItem, remove: removeComboItem } = useFieldArray({ control, name: 'comboItems' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Thông tin cơ bản</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1.5 lg:col-span-2">
            <Label>Tên sản phẩm *</Label>
            <Input {...register('name', { required: true })} placeholder="VD: Bàn ăn gỗ teak cao cấp" />
          </div>
          <div className="space-y-1.5">
            <Label>Danh mục *</Label>
            <Select onValueChange={(v) => setValue('categoryId', v)} defaultValue={typeof defaultValues?.categoryId === 'object' ? defaultValues?.categoryId?._id : defaultValues?.categoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Giá gốc (VND) *</Label>
            <Input type="number" {...register('basePrice', { required: true, valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Giá khuyến mãi (VND)</Label>
            <Input type="number" {...register('salePrice', { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Chất liệu</Label>
            <Input {...register('material')} placeholder="VD: Gỗ teak tự nhiên" />
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select onValueChange={(v) => setValue('status', v)} defaultValue={defaultValues?.status || 'active'}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Ẩn</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                <SelectItem value="discontinued">Ngừng kinh doanh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Mô tả chi tiết</Label>
          <RichTextEditor
            value={description}
            onChange={(html) => setValue('description', html)}
            placeholder="Nhập mô tả chi tiết sản phẩm..."
          />
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Hình ảnh sản phẩm</h3>
        <ImageUpload
          value={images}
          onChange={(urls) => setValue('images', urls)}
          maxFiles={8}
        />
      </div>

      {/* Colors with images */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Màu sắc</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => addColor({ name: '', hexCode: '#000000', images: [], priceModifier: 0 })}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm màu
          </Button>
        </div>
        <div className="space-y-3">
          {colorFields.map((field, i) => (
            <div key={field.id} className="border border-gray-200 rounded-xl p-3 space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Tên màu</Label>
                  <Input {...register(`colors.${i}.name`)} placeholder="VD: Nâu tối" />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Màu</Label>
                  <Input type="color" {...register(`colors.${i}.hexCode`)} className="h-10 p-1" />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Phụ phí (VND)</Label>
                  <Input type="number" {...register(`colors.${i}.priceModifier`, { valueAsNumber: true })} />
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 text-danger-400" onClick={() => removeColor(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Hình ảnh cho màu này</Label>
                <ImageUpload
                  value={watch(`colors.${i}.images`) || []}
                  onChange={(urls) => setValue(`colors.${i}.images`, urls)}
                  maxFiles={5}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Kích thước</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => addDim({ label: '', width: 0, height: 0, depth: 0, priceModifier: 0 })}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm kích thước
          </Button>
        </div>
        <div className="space-y-3">
          {dimFields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-3 sm:grid-cols-6 gap-2 items-end">
              <div className="col-span-3 sm:col-span-2 space-y-1">
                <Label className="text-xs">Nhãn</Label>
                <Input {...register(`dimensions.${i}.label`)} placeholder="VD: Nhỏ" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">R (cm)</Label>
                <Input type="number" {...register(`dimensions.${i}.width`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">C (cm)</Label>
                <Input type="number" {...register(`dimensions.${i}.height`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">D (cm)</Label>
                <Input type="number" {...register(`dimensions.${i}.depth`, { valueAsNumber: true })} />
              </div>
              <div className="flex gap-1 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Phụ phí</Label>
                  <Input type="number" {...register(`dimensions.${i}.priceModifier`, { valueAsNumber: true })} />
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 text-danger-400 shrink-0" onClick={() => removeDim(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combo */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Sản phẩm combo
          </h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isCombo}
              onChange={(e) => {
                setIsCombo(e.target.checked);
                if (!e.target.checked) {
                  setValue('comboItems', []);
                  setValue('comboDiscountPercent', 0);
                }
              }}
              className="rounded border-gray-300"
            />
            Là sản phẩm combo
          </label>
        </div>
        {isCombo && (
          <div className="space-y-3">
            {comboFields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Sản phẩm</Label>
                  <ProductSearchSelect
                    value={watch(`comboItems.${i}.productId`)}
                    onChange={(id) => setValue(`comboItems.${i}.productId`, id)}
                    excludeId={defaultValues?._id}
                  />
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Số lượng</Label>
                  <Input type="number" {...register(`comboItems.${i}.quantity`, { valueAsNumber: true, min: 1 })} />
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 text-danger-400" onClick={() => removeComboItem(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => addComboItem({ productId: '', quantity: 1 })}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thêm thành phần
            </Button>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label>Giảm giá combo (%)</Label>
                <Input type="number" {...register('comboDiscountPercent', { valueAsNumber: true, min: 0, max: 100 })} placeholder="VD: 10" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {isLoading ? 'Đang lưu...' : 'Lưu sản phẩm'}
        </Button>
      </div>
    </form>
  );
}
