'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressFormData } from '@/lib/validators';
import { VietnamAddressSelect } from '@/components/shared/vietnam-address-select';
import { LocationIQAutocomplete } from '@/components/shared/locationiq-autocomplete';
import { userService } from '@/services/user.service';
import { geocodeAddress } from '@/lib/geocoding';
import { useAuthStore } from '@/stores/use-auth-store';
import toast from 'react-hot-toast';
import type { GeocodingResult } from '@/lib/geocoding';

export default function AddressesPage() {
  const { user, setUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GeocodingResult | null>(null);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const addresses: any[] = user?.addresses || [];

  const openAdd = () => {
    setEditing(null);
    setSelectedPlace(null);
    form.reset({ fullName: '', phone: '', street: '', ward: '', district: '', province: '', isDefault: false });
    setOpen(true);
  };

  const openEdit = (addr: any) => {
    setEditing(addr);
    setSelectedPlace(addr.lat ? { lat: addr.lat, lon: addr.lng } as GeocodingResult : null);
    form.reset(addr);
    setOpen(true);
  };

  const onSubmit = async (data: AddressFormData) => {
    setSaving(true);
    try {
      // Geocode address if not already geocoded
      let coords = selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lon } : null;
      if (!coords && data.street && data.province) {
        toast.loading('Đang lấy tọa độ...', { id: 'geocode' });
        const result = await geocodeAddress(data);
        toast.remove('geocode');
        if (result) {
          coords = { lat: result.lat, lng: result.lon };
        }
      }

      const payload = {
        ...data,
        lat: coords?.lat,
        lng: coords?.lng,
      };
      let updated;
      if (editing?._id) {
        updated = await userService.updateAddress(editing._id, payload);
      } else {
        updated = await userService.addAddress(payload);
      }
      setUser(updated);
      toast.success(editing ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const updated = await userService.deleteAddress(deletingId);
      setUser(updated);
      toast.success('Đã xóa địa chỉ');
    } catch (e: any) {
      toast.error(e.message || 'Có lỗi xảy ra');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await userService.setDefaultAddress(id);
      setUser(updated);
      toast.success('Đã đặt làm địa chỉ mặc định');
    } catch (e: any) {
      toast.error(e.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="container-custom py-6 lg:py-10 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-bold">Địa Chỉ Giao Hàng</h1>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm địa chỉ
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có địa chỉ nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {addresses.map((addr: any) => (
              <motion.div
                key={addr._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`bg-white rounded-xl border p-4 shadow-card ${addr.isDefault ? 'border-primary-300' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{addr.fullName}</p>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!addr.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-gray-500"
                        onClick={() => handleSetDefault(addr._id)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Mặc định
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(addr)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-danger-400 hover:text-danger-600"
                      onClick={() => setDeletingId(addr._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-danger-500">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input type="tel" {...form.register('phone')} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-danger-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <Controller
              control={form.control}
              name="province"
              render={() => (
                <VietnamAddressSelect
                  value={{
                    province: form.watch('province') || '',
                    district: form.watch('district') || '',
                    ward: form.watch('ward') || '',
                  }}
                  onChange={({ province, district, ward }) => {
                    form.setValue('province', province);
                    form.setValue('district', district);
                    form.setValue('ward', ward);
                  }}
                  errors={{
                    province: form.formState.errors.province?.message,
                    district: form.formState.errors.district?.message,
                    ward: form.formState.errors.ward?.message,
                  }}
                />
              )}
            />

            <Controller
              control={form.control}
              name="street"
              render={() => (
                <LocationIQAutocomplete
                  street={form.watch('street') || ''}
                  ward={form.watch('ward') || ''}
                  district={form.watch('district') || ''}
                  province={form.watch('province') || ''}
                  onChange={(field, value) => form.setValue(field, value)}
                />
              )}
            />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" {...form.register('isDefault')} className="rounded" />
              <Label htmlFor="isDefault">Đặt làm địa chỉ mặc định</Label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu địa chỉ'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="Xóa địa chỉ"
        description="Bạn có chắc muốn xóa địa chỉ này không?"
        confirmLabel="Xóa"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
