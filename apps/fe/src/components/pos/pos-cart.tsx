'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, Tag, X, UserPlus, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePosStore } from '@/stores/use-pos-store';
import { formatPrice } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { couponService } from '@/services/coupon.service';
import { userService } from '@/services/user.service';
import { useDebounce } from '@/hooks/use-debounce';
import toast from 'react-hot-toast';

interface PosCartProps {
  onCheckout: () => void;
}

export function PosCart({ onCheckout }: PosCartProps) {
  const {
    cart, updateQuantity, removeFromCart,
    applyCoupon, coupon, removeCoupon,
    getTotal, getSubtotal,
    selectedCustomerId, setSelectedCustomer,
  } = usePosStore();

  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Customer search
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [customer, setCustomerData] = useState<any>(null);
  const debouncedSearch = useDebounce(searchInput, 400);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add new customer form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  // Fuzzy search when input changes
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const found = await userService.searchCustomers(debouncedSearch);
        if (!cancelled) {
          setResults(found);
          setShowResults(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: any) => {
    setCustomerData(c);
    setSelectedCustomer({ _id: c._id, fullName: c.fullName, phone: c.phone, email: c.email });
    setShowResults(false);
    setSearchInput('');
    setResults([]);
  };

  const clearCustomer = () => {
    setCustomerData(null);
    setSelectedCustomer(null);
    setSearchInput('');
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim()) {
      toast.error('Nhập tên khách hàng');
      return;
    }
    if (!newPhone.trim() && !newEmail.trim()) {
      toast.error('Nhập số điện thoại hoặc email');
      return;
    }
    setCreating(true);
    try {
      const created = await userService.createCustomer({
        fullName: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      });
      selectCustomer(created);
      setShowAddForm(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      toast.success(`Đã tạo khách hàng: ${created.fullName}`);
    } catch (e: any) {
      toast.error(e.message || 'Tạo khách hàng thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const result = await couponService.validateCoupon(couponCode.toUpperCase(), getSubtotal());
      applyCoupon(result as any);
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (e: any) {
      toast.error(e.message || 'Ma khong hop le');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const subtotal = getSubtotal();
  const total = getTotal();
  const discount = subtotal - total;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-primary-500" />
        <h2 className="font-semibold">Giỏ hàng</h2>
        {cart.length > 0 && (
          <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        )}
      </div>

      {/* Customer section */}
      <div className="px-3 py-2 border-b bg-gray-50">
        {customer ? (
          <div className="flex items-center gap-2 bg-white rounded-lg border border-primary-200 px-3 py-2">
            <User className="h-4 w-4 text-primary-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{customer.fullName}</p>
              <p className="text-xs text-gray-500">{customer.phone || customer.email}</p>
            </div>
            <button onClick={clearCustomer} className="text-gray-400 hover:text-danger-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : showAddForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-700">Tạo khách hàng mới</p>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <Label className="text-xs">Họ tên *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Số điện thoại</Label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0912 345 678"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs gap-1"
              onClick={handleCreateCustomer}
              disabled={creating}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {creating ? 'Đang tạo...' : 'Tạo khách hàng'}
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm SĐT, email, tên KH..."
                className="h-8 text-sm pl-8 pr-8"
                onFocus={() => results.length > 0 && setShowResults(true)}
              />
              {searching && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-primary-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Search results dropdown */}
            {showResults && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {results.length > 0 ? (
                  results.map((c: any) => (
                    <button
                      key={c._id}
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{c.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {[c.phone, c.email].filter(Boolean).join(' • ')}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-center text-sm text-gray-500">
                    Không tìm thấy khách hàng
                  </div>
                )}
              </div>
            )}

            {/* Add new customer button */}
            <button
              onClick={() => { setShowAddForm(true); setShowResults(false); }}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium py-0.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tạo khách hàng mới
            </button>
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Giỏ hàng trống</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-gray-400">{item.variantLabel}</p>
                    )}
                    <p className="text-sm font-semibold text-primary-600 mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId, item.variantId)} className="text-gray-300 hover:text-danger-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="h-6 w-6 rounded flex items-center justify-center bg-white border border-gray-200 hover:border-primary-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      className="h-6 w-6 rounded flex items-center justify-center bg-white border border-gray-200 hover:border-primary-300"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Coupon */}
      <div className="px-3 py-2 border-t">
        {coupon ? (
          <div className="flex items-center justify-between bg-success-50 border border-success-200 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-success-600" />
              <span className="font-mono text-success-700">{coupon.code}</span>
            </div>
            <button onClick={removeCoupon} className="text-gray-400 hover:text-danger-400 text-lg leading-none">&times;</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Mã giảm giá"
              className="h-8 text-sm flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
            />
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={handleApplyCoupon} disabled={applyingCoupon}>
              Áp dụng
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-t space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success-600">
            <span>Giảm giá</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Tổng cộng</span>
          <span className="text-primary-600">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="p-3 pt-0">
        <Button
          className="w-full h-12 text-base font-semibold"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          Thanh toán {cart.length > 0 && `• ${formatPrice(total)}`}
        </Button>
      </div>
    </div>
  );
}
