'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressFormData } from '@/lib/validators';
import { userService } from '@/services/user.service';
import { VietnamAddressSelect } from '@/components/shared/vietnam-address-select';
import { useCartStore } from '@/stores/use-cart-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { useCreateOrder } from '@/hooks/use-orders';
import { formatPrice } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { items, getSubtotal, getShippingFee, getTotal, couponCode, couponDiscount } = useCartStore();
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cod'>('cod');
  const [note, setNote] = useState('');
  const [addAddrOpen, setAddAddrOpen] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const createOrder = useCreateOrder();

  const addrForm = useForm<AddressFormData>({ resolver: zodResolver(addressSchema) });

  const handleAddAddress = async (data: AddressFormData) => {
    setSavingAddr(true);
    try {
      const updated = await userService.addAddress(data);
      setUser(updated);
      setSelectedAddressIndex((updated.addresses?.length ?? 1) - 1);
      toast.success('Đã thêm địa chỉ');
      setAddAddrOpen(false);
      addrForm.reset();
    } catch (e: any) {
      toast.error(e.message || 'Có lỗi xảy ra');
    } finally {
      setSavingAddr(false);
    }
  };

  if (!user) {
    router.push('/login?callbackUrl=/checkout');
    return null;
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const addresses = user.addresses || [];
  const selectedAddress = addresses[selectedAddressIndex];

  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    createOrder.mutate({
      items: items.map((item) => ({
        productId: item.productId,
        variantSku: item.variant?.sku || undefined,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        street: selectedAddress.street,
        ward: selectedAddress.ward,
        district: selectedAddress.district,
        province: selectedAddress.province,
      },
      paymentMethod,
      couponCode: couponCode || undefined,
      note: note || undefined,
    });
  };

  return (
    <div className="container-custom py-6 lg:py-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Thanh Toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold">Địa Chỉ Giao Hàng</h2>
            </div>
            {addresses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Bạn chưa có địa chỉ giao hàng nào</p>
                <Button variant="outline" size="sm" onClick={() => setAddAddrOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Thêm địa chỉ mới
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={() => setAddAddrOpen(true)} className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline mb-1">
                  <Plus className="h-3.5 w-3.5" /> Thêm địa chỉ mới
                </button>
                {addresses.map((addr, i) => (
                  <label
                    key={i}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                      i === selectedAddressIndex ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={i === selectedAddressIndex}
                      onChange={() => setSelectedAddressIndex(i)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{addr.fullName} - {addr.phone}</p>
                      <p className="text-sm text-gray-500">{addr.street}, {addr.ward}, {addr.district}, {addr.province}</p>
                      {addr.isDefault && <span className="text-xs text-primary-600 font-medium">Mặc định</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold">Phương Thức Thanh Toán</h2>
            </div>
            <div className="space-y-3">
              {(['cod', 'bank_transfer', 'cash'] as const).map((method) => (
                <label
                  key={method}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    paymentMethod === method ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  <span className="text-sm font-medium">{PAYMENT_METHOD_LABELS[method]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary-500" />
              <h2 className="font-semibold">Ghi Chú Đơn Hàng</h2>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho người giao hàng (tùy chọn)..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 sticky top-24 space-y-4">
            <h2 className="font-bold">Tóm Tắt ({items.length} sản phẩm)</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1 flex-1">{item.product.name} x{item.quantity}</span>
                  <span className="font-medium ml-2 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vận chuyển</span>
                <span className={getShippingFee() === 0 ? 'text-success-600' : ''}>
                  {getShippingFee() === 0 ? 'Miễn phí' : formatPrice(getShippingFee())}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Tổng</span>
                <span className="text-primary-600">{formatPrice(getTotal())}</span>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full h-11"
              disabled={createOrder.isPending || !selectedAddress}
            >
              {createOrder.isPending ? 'Đang xử lý...' : 'Đặt Hàng'}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của chúng tôi
            </p>
          </div>
        </div>
      </div>
      {/* Dialog thêm địa chỉ */}
      <Dialog open={addAddrOpen} onOpenChange={setAddAddrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm địa chỉ giao hàng</DialogTitle>
          </DialogHeader>
          <form onSubmit={addrForm.handleSubmit(handleAddAddress)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Họ và tên</Label>
                <Input {...addrForm.register('fullName')} />
                {addrForm.formState.errors.fullName && (
                  <p className="text-xs text-red-500">{addrForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input type="tel" {...addrForm.register('phone')} />
                {addrForm.formState.errors.phone && (
                  <p className="text-xs text-red-500">{addrForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Địa chỉ cụ thể</Label>
              <Input placeholder="Số nhà, tên đường..." {...addrForm.register('street')} />
              {addrForm.formState.errors.street && (
                <p className="text-xs text-red-500">{addrForm.formState.errors.street.message}</p>
              )}
            </div>
            <Controller
              control={addrForm.control}
              name="province"
              render={() => (
                <VietnamAddressSelect
                  value={{
                    province: addrForm.watch('province') || '',
                    district: addrForm.watch('district') || '',
                    ward: addrForm.watch('ward') || '',
                  }}
                  onChange={({ province, district, ward }) => {
                    addrForm.setValue('province', province);
                    addrForm.setValue('district', district);
                    addrForm.setValue('ward', ward);
                  }}
                  errors={{
                    province: addrForm.formState.errors.province?.message,
                    district: addrForm.formState.errors.district?.message,
                    ward: addrForm.formState.errors.ward?.message,
                  }}
                />
              )}
            />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefaultCheckout" {...addrForm.register('isDefault')} className="rounded" />
              <Label htmlFor="isDefaultCheckout">Đặt làm địa chỉ mặc định</Label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setAddAddrOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={savingAddr}>{savingAddr ? 'Đang lưu...' : 'Lưu địa chỉ'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
