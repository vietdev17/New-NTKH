'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Search, Truck, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PosCart } from '@/components/pos/pos-cart';
import { PaymentModal } from '@/components/pos/payment-modal';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { usePosStore } from '@/stores/use-pos-store';
import { useProducts } from '@/hooks/use-products';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { orderService } from '@/services/order.service';
import { STORE } from '@/lib/store-info';
import toast from 'react-hot-toast';

interface CustomerAddress {
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  ward?: string;
  district?: string;
  province: string;
  isDefault?: boolean;
  label?: string;
}

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const {
    addToCart, clearCart, getTotal, cart, coupon,
    selectedCustomerId, selectedCustomer,
  } = usePosStore();
  const queryClient = useQueryClient();

  // Shipping address
  const [shipName, setShipName] = useState('');
  const [shipPhone, setShipPhone] = useState('');
  const [shipStreet, setShipStreet] = useState('');
  const [shipWard, setShipWard] = useState('');
  const [shipDistrict, setShipDistrict] = useState('');
  const [shipProvince, setShipProvince] = useState<string>(STORE.province);
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(-1); // -1 = nhap tay

  // Auto-fill from customer + default address when switching to delivery
  useEffect(() => {
    if (!isDelivery) return;
    const cust = selectedCustomer as any;
    setShipName(cust?.fullName || '');
    setShipPhone(cust?.phone || '');
    const addrs: CustomerAddress[] = cust?.addresses || [];
    if (addrs.length > 0) {
      const def = addrs.findIndex((a) => a.isDefault);
      const idx = def >= 0 ? def : 0;
      setSelectedAddrIdx(idx);
      const addr = addrs[idx];
      setShipStreet(addr.street || '');
      setShipWard(addr.ward || '');
      setShipDistrict(addr.district || '');
      setShipProvince(addr.province || STORE.province);
    } else {
      setSelectedAddrIdx(-1);
      setShipStreet('');
      setShipWard('');
      setShipDistrict('');
      setShipProvince(STORE.province);
    }
  }, [isDelivery, selectedCustomer]);

  const handleSelectAddress = (idx: number) => {
    setSelectedAddrIdx(idx);
    if (idx < 0) return;
    const cust = selectedCustomer as any;
    const addrs: CustomerAddress[] = cust?.addresses || [];
    const addr = addrs[idx];
    if (addr) {
      setShipName(addr.fullName || cust?.fullName || '');
      setShipPhone(addr.phone || cust?.phone || '');
      setShipStreet(addr.street || '');
      setShipWard(addr.ward || '');
      setShipDistrict(addr.district || '');
      setShipProvince(addr.province || STORE.province);
    }
  };

  const [orderResult, setOrderResult] = useState<any>(null);

  const createOrder = useMutation({
    mutationFn: (data: any) => orderService.createPosOrder(data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
      setOrderResult(result);
      setPaymentOpen(true);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-pos'],
    queryFn: () => categoryService.getCategories({ limit: 100 }),
  });

  const { data, isLoading } = useProducts({
    search: debouncedSearch,
    category: category === 'all' ? undefined : category,
    limit: 24,
    page: 1,
  });
  const products = (data as any)?.data || [];

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product._id,
      variantId: undefined,
      name: product.name,
      price: product.salePrice || product.basePrice,
      quantity: 1,
      image: product.images?.[0],
    });
    toast.success(`Da them ${product.name}`, { duration: 1000 });
  };

  const cartItems = cart.map((item) => ({
    name: item.name,
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    unitPrice: item.price,
    total: item.price * item.quantity,
  }));

  const cust = selectedCustomer as any;
  const customerAddresses: CustomerAddress[] = cust?.addresses || [];
  const showSavedAddresses = customerAddresses.length > 0;
  const showManualFields = !showSavedAddresses || selectedAddrIdx === -1;

  const handlePayment = async (
    paymentMethod: string,
    cashReceived?: number,
    depositAmount?: number
  ) => {
    const baseCustomerName = cust?.fullName || shipName || 'Khach le';
    const baseCustomerPhone = cust?.phone || shipPhone || '0000000000';

    const orderData: any = isDelivery
      ? {
          items: cart.map((item) => ({
            productId: item.productId,
            variantSku: item.variantId || undefined,
            quantity: item.quantity,
          })),
          customerId: selectedCustomerId || undefined,
          customerName: baseCustomerName,
          customerPhone: baseCustomerPhone,
          paymentMethod: paymentMethod.startsWith('deposit') ? 'cod' : paymentMethod,
          couponCode: coupon?.code,
          shippingFullName: shipName || baseCustomerName,
          shippingPhone: shipPhone || baseCustomerPhone,
          shippingStreet: shipStreet,
          shippingWard: shipWard,
          shippingDistrict: shipDistrict,
          shippingProvince: shipProvince,
          depositAmount: depositAmount,
        }
      : {
          items: cart.map((item) => ({
            productId: item.productId,
            variantSku: item.variantId || undefined,
            quantity: item.quantity,
          })),
          customerId: selectedCustomerId || undefined,
          customerName: baseCustomerName,
          customerPhone: baseCustomerPhone,
          paymentMethod: paymentMethod.startsWith('deposit') ? 'cash' : paymentMethod,
          couponCode: coupon?.code,
          cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
          depositAmount: depositAmount,
        };

    try {
      const result = await orderService.createPosOrder(orderData);
      setOrderResult(result);
    } catch (e: any) {
      toast.error(e.message || 'Thanh toan that bai');
      throw e;
    }
  };

  const handlePaymentClose = (open: boolean) => {
    setPaymentOpen(open);
    if (!open && orderResult) {
      clearCart();
      setOrderResult(null);
      setIsDelivery(false);
      setShipName('');
      setShipPhone('');
      setShipStreet('');
      setShipWard('');
      setShipDistrict('');
      setShipProvince(STORE.province);
    }
  };

  const customerDisplayAddr = showSavedAddresses && selectedAddrIdx >= 0
    ? customerAddresses[selectedAddrIdx]
    : null;

  return (
    <div className="flex h-full gap-0">
      {/* Product grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        <div className="bg-white border-b px-4 py-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tim san pham..." className="pl-9 h-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Danh muc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tat ca</SelectItem>
              {((categories as any)?.data || []).map((c: any) => (
                <SelectItem key={c._id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <LoadingSpinner className="py-16" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product: any) => (
                <button
                  key={product._id}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white rounded-xl border border-gray-100 p-3 text-left hover:border-primary-300 hover:shadow-card-hover transition-all active:scale-95"
                >
                  <div className="relative h-24 w-full rounded-lg overflow-hidden bg-gray-50 mb-2">
                    <Image src={product.images?.[0] || '/images/placeholder.svg'} alt={product.name} fill className="object-cover" unoptimized />
                    {product.salePrice && product.salePrice < product.basePrice && (
                      <div className="absolute top-1 left-1 bg-danger-500 text-white text-[10px] px-1 rounded">
                        -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-sm font-bold text-primary-600">{formatPrice(product.salePrice || product.basePrice)}</p>
                </button>
              ))}
              {products.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12 text-gray-400">Khong tim thay san pham</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart - right panel */}
      <div className="w-80 shrink-0 border-l flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Delivery toggle */}
        <div className="px-3 pt-3 pb-2 border-b bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setIsDelivery(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isDelivery ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Tai quay
            </button>
            <button
              onClick={() => setIsDelivery(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDelivery ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Truck className="h-4 w-4" />
              Giao hang
            </button>
          </div>

          {/* Shipping address form */}
          {isDelivery && (
            <div className="mt-2 space-y-2 bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Dia chi giao hang</p>

              {/* Saved addresses */}
              {showSavedAddresses && (
                <div className="space-y-1.5">
                  {customerAddresses.map((addr, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectAddress(idx)}
                      className={`w-full text-left rounded-lg border p-2.5 text-xs transition-colors ${
                        selectedAddrIdx === idx
                          ? 'border-primary-400 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {addr.label || 'Dia chi ' + (idx + 1)}
                            {addr.isDefault && <span className="ml-1 text-primary-500">(Mac dinh)</span>}
                          </p>
                          <p className="text-gray-500 mt-0.5 line-clamp-2">
                            {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                          </p>
                          <p className="text-gray-400">{addr.phone}</p>
                        </div>
                        {selectedAddrIdx === idx && (
                          <div className="h-4 w-4 rounded-full bg-primary-500 shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => handleSelectAddress(-1)}
                    className={`w-full text-left rounded-lg border p-2.5 text-xs transition-colors ${
                      selectedAddrIdx === -1
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Nhap dia chi khac...
                  </button>
                </div>
              )}

              {/* Manual address fields */}
              {showManualFields && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Ho ten *</Label>
                      <Input value={shipName} onChange={(e) => setShipName(e.target.value)} placeholder="Nguyen Van A" className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">So dien thoai *</Label>
                      <Input value={shipPhone} onChange={(e) => setShipPhone(e.target.value)} placeholder="0912 345 678" className="h-7 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Dia chi cu the</Label>
                    <Input value={shipStreet} onChange={(e) => setShipStreet(e.target.value)} placeholder="So nha, duong..." className="h-7 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Phuong/Xa</Label>
                      <Input value={shipWard} onChange={(e) => setShipWard(e.target.value)} placeholder="Phuong 1" className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Quan/Huyen</Label>
                      <Input value={shipDistrict} onChange={(e) => setShipDistrict(e.target.value)} placeholder="Quan 1" className="h-7 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Tinh/TP</Label>
                    <Input value={shipProvince} onChange={(e) => setShipProvince(e.target.value)} placeholder="TP Ho Chi Minh" className="h-7 text-xs" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <PosCart onCheckout={() => {
            setOrderResult(null);
            setPaymentOpen(true);
          }} />
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={handlePaymentClose}
        total={getTotal()}
        onConfirm={handlePayment}
        isLoading={createOrder.isPending}
        customer={cust ? {
          fullName: cust.fullName,
          phone: cust.phone || shipPhone,
          address: isDelivery ? [shipStreet, shipWard, shipDistrict, shipProvince].filter(Boolean).join(', ') : undefined,
        } : isDelivery ? {
          fullName: shipName,
          phone: shipPhone,
          address: [shipStreet, shipWard, shipDistrict, shipProvince].filter(Boolean).join(', '),
        } : null}
        cashierName=""
        cartItems={cartItems}
      />
    </div>
  );
}
