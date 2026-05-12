'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Phone, Mail, MapPin, Clock, ShoppingBag,
  Plus, Trash2, Check, Award, TrendingUp, Calendar,
  Edit3, Ban, Unlock,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { userService } from '@/services/user.service';
import { formatDate, formatPrice, formatRelativeTime, getInitials } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [loyaltyAction, setLoyaltyAction] = useState<'add' | 'deduct'>('add');
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [loyaltyReason, setLoyaltyReason] = useState('');
  const [loyaltySaving, setLoyaltySaving] = useState(false);

  const [addressOpen, setAddressOpen] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '', fullName: '', phone: '', street: '', ward: '', district: '', province: '', isDefault: false,
  });

  const [orderPage, setOrderPage] = useState(1);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => userService.getCustomerById(id),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-customer-stats', id],
    queryFn: () => userService.getCustomerStats(id),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-customer-orders', id, orderPage],
    queryFn: () => userService.getCustomerOrders(id, { page: orderPage, limit: 10 }),
  });

  const c = customer as any;
  const s = stats as any;
  const orders = (ordersData as any)?.items || [];
  const ordersMeta = (ordersData as any)?.meta || {};

  useEffect(() => {
    if (c) {
      setEditForm({ fullName: c.fullName || '', phone: c.phone || '', email: c.email || '' });
    }
  }, [c]);

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!c) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await userService.updateCustomer(id, editForm);
      toast.success('Cập nhật thông tin thành công');
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await userService.updateCustomer(id, { isActive: !c.isActive });
      toast.success(c.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleLoyalty = async () => {
    const pts = parseInt(loyaltyPoints);
    if (!pts || pts <= 0) { toast.error('Điểm phải lớn hơn 0'); return; }
    if (!loyaltyReason.trim()) { toast.error('Vui lòng nhập lý do'); return; }

    setLoyaltySaving(true);
    try {
      if (loyaltyAction === 'add') {
        await userService.addLoyaltyPoints(id, pts, loyaltyReason);
      } else {
        await userService.deductLoyaltyPoints(id, pts, loyaltyReason);
      }
      toast.success(loyaltyAction === 'add' ? `Đã cộng ${pts} điểm` : `Đã trừ ${pts} điểm`);
      setLoyaltyOpen(false);
      setLoyaltyPoints('');
      setLoyaltyReason('');
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setLoyaltySaving(false);
    }
  };

  const openAddressDialog = (index?: number) => {
    if (index !== undefined && c.addresses?.[index]) {
      const addr = c.addresses[index];
      setAddressForm({
        label: addr.label || '', fullName: addr.fullName || '', phone: addr.phone || '',
        street: addr.street || '', ward: addr.ward || '', district: addr.district || '',
        province: addr.province || '', isDefault: addr.isDefault || false,
      });
      setEditingAddressIndex(index);
    } else {
      setAddressForm({ label: '', fullName: c.fullName || '', phone: c.phone || '', street: '', ward: '', district: '', province: '', isDefault: false });
      setEditingAddressIndex(null);
    }
    setAddressOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.ward || !addressForm.district || !addressForm.province) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      if (editingAddressIndex !== null) {
        await userService.updateCustomerAddress(id, editingAddressIndex, addressForm);
        toast.success('Cập nhật địa chỉ thành công');
      } else {
        await userService.addCustomerAddress(id, addressForm);
        toast.success('Thêm địa chỉ thành công');
      }
      setAddressOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const handleDeleteAddress = async (index: number) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
      await userService.deleteCustomerAddress(id, index);
      toast.success('Đã xóa địa chỉ');
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handleSetDefaultAddress = async (index: number) => {
    try {
      await userService.setCustomerDefaultAddress(id, index);
      toast.success('Đã đặt mặc định');
      qc.invalidateQueries({ queryKey: ['admin-customer', id] });
    } catch {
      toast.error('Thao tác thất bại');
    }
  };

  const defaultAddress = c.addresses?.find((a: any) => a.isDefault) || c.addresses?.[0];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link href="/admin/customers"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
          </Button>
          <h1 className="text-xl font-bold">Chi tiết khách hàng</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={c.isActive !== false ? 'success' : 'destructive'}>
            {c.isActive !== false ? 'Hoạt động' : 'Bị khóa'}
          </Badge>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5"><Edit3 className="h-3.5 w-3.5" /> Sửa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Sửa thông tin</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Họ tên</Label>
                  <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" onClick={() => setEditOpen(false)}>Hủy</Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant={c.isActive !== false ? 'destructive' : 'default'} onClick={handleToggleActive}>
            {c.isActive !== false ? <><Ban className="h-3.5 w-3.5 mr-1" /> Khóa</> : <><Unlock className="h-3.5 w-3.5 mr-1" /> Mở khóa</>}
          </Button>
        </div>
      </div>

      {/* Thông tin khách hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thẻ hồ sơ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={c.avatar} />
              <AvatarFallback className="text-lg bg-primary-100 text-primary-600">{getInitials(c.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">{c.fullName}</h2>
              <p className="text-sm text-gray-400 font-mono">{c._id}</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{c.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{c.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-700 truncate">
                {defaultAddress
                  ? [defaultAddress.street, defaultAddress.ward, defaultAddress.district, defaultAddress.province].filter(Boolean).join(', ')
                  : 'Chưa có địa chỉ'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-500">Tham gia: {formatDate(c.createdAt)}</span>
            </div>
            {c.lastLoginAt && (
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-500">Đăng nhập gần nhất: {formatRelativeTime(c.lastLoginAt)}</span>
              </div>
            )}
            {c.isGoogleAuth && (
              <Badge variant="info" className="mt-1">Đăng nhập Google</Badge>
            )}
          </dl>
        </div>

        {/* Thẻ thống kê */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-4">Thống kê</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-50 rounded-lg p-3 text-center">
              <ShoppingBag className="h-5 w-5 text-primary-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary-600">{c.totalOrders || 0}</p>
              <p className="text-xs text-gray-500">Đơn hàng</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{formatPrice(c.totalSpent || 0)}</p>
              <p className="text-xs text-gray-500">Tổng chi tiêu</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <Award className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-600">{(c.loyaltyPoints || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Điểm tích lũy</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{s?.avgOrderValue ? formatPrice(s.avgOrderValue) : '—'}</p>
              <p className="text-xs text-gray-500">TB/đơn hàng</p>
            </div>
          </div>
          {s?.lastOrderDate && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Đơn hàng cuối: {formatDate(s.lastOrderDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Đơn hàng ({ordersMeta.total || c.totalOrders || 0})</TabsTrigger>
          <TabsTrigger value="addresses">Địa chỉ ({c.addresses?.length || 0})</TabsTrigger>
          <TabsTrigger value="loyalty">Điểm tích lũy</TabsTrigger>
        </TabsList>

        {/* Tab Đơn hàng */}
        <TabsContent value="orders">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Khách hàng chưa có đơn hàng</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <Link key={order._id} href={`/admin/orders/${order._id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-medium text-sm">#{order.orderNumber}</span>
                        <StatusBadge status={order.status} type="order" />
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.createdAt)} &middot; {order.items?.length || 0} sản phẩm
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-400">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {ordersMeta.totalPages > 1 && (
              <div className="p-4 border-t">
                <PaginationControl currentPage={orderPage} totalPages={ordersMeta.totalPages} onPageChange={setOrderPage} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Địa chỉ */}
        <TabsContent value="addresses">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" onClick={() => openAddressDialog()}><Plus className="h-3.5 w-3.5" /> Thêm địa chỉ</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAddressIndex !== null ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Nhãn (VD: Nhà, Công ty)</Label>
                      <Input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder="Nhà, Công ty..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Họ tên</Label>
                        <Input value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                      </div>
                      <div>
                        <Label>Số điện thoại</Label>
                        <Input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Địa chỉ (Số nhà, đường)</Label>
                      <Input value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Phường/Xã</Label>
                        <Input value={addressForm.ward} onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })} />
                      </div>
                      <div>
                        <Label>Quận/Huyện</Label>
                        <Input value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} />
                      </div>
                      <div>
                        <Label>Tỉnh/Thành phố</Label>
                        <Input value={addressForm.province} onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="ghost" onClick={() => setAddressOpen(false)}>Hủy</Button>
                      <Button onClick={handleSaveAddress}>{editingAddressIndex !== null ? 'Cập nhật' : 'Thêm'}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!c.addresses || c.addresses.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-card py-12 text-center text-gray-400 text-sm">
                Chưa có địa chỉ nào
              </div>
            ) : (
              <div className="space-y-3">
                {c.addresses.map((addr: any, i: number) => (
                  <div key={addr._id || i} className={`bg-white rounded-xl border p-4 ${addr.isDefault ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'} shadow-card`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{addr.fullName || c.fullName}</span>
                          <span className="text-gray-400 text-sm">{addr.phone}</span>
                          {addr.isDefault && <Badge variant="default" className="text-[10px] px-1.5">Mặc định</Badge>}
                          {addr.label && <span className="text-gray-400 text-xs">({addr.label})</span>}
                        </div>
                        <p className="text-sm text-gray-600">
                          {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {!addr.isDefault && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleSetDefaultAddress(i)} title="Đặt mặc định">
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openAddressDialog(i)} title="Sửa">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500 hover:text-red-600" onClick={() => handleDeleteAddress(i)} title="Xóa">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Điểm tích lũy */}
        <TabsContent value="loyalty">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Điểm tích lũy</h3>
                <p className="text-3xl font-bold text-primary-600 mt-1">{(c.loyaltyPoints || 0).toLocaleString()} điểm</p>
              </div>
              <Dialog open={loyaltyOpen} onOpenChange={setLoyaltyOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Điều chỉnh</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Điều chỉnh điểm tích lũy</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={loyaltyAction === 'add' ? 'default' : 'outline'}
                        onClick={() => setLoyaltyAction('add')}
                        className="flex-1"
                      >
                        + Cộng điểm
                      </Button>
                      <Button
                        size="sm"
                        variant={loyaltyAction === 'deduct' ? 'destructive' : 'outline'}
                        onClick={() => setLoyaltyAction('deduct')}
                        className="flex-1"
                      >
                        - Trừ điểm
                      </Button>
                    </div>
                    <div>
                      <Label>Số điểm</Label>
                      <Input type="number" min="1" value={loyaltyPoints} onChange={(e) => setLoyaltyPoints(e.target.value)} placeholder="Nhập số điểm..." />
                    </div>
                    <div>
                      <Label>Lý do</Label>
                      <Input value={loyaltyReason} onChange={(e) => setLoyaltyReason(e.target.value)} placeholder="VD: Thưởng đơn hàng #ORD-001" />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="ghost" onClick={() => setLoyaltyOpen(false)}>Hủy</Button>
                      <Button
                        onClick={handleLoyalty}
                        disabled={loyaltySaving}
                        variant={loyaltyAction === 'deduct' ? 'destructive' : 'default'}
                      >
                        {loyaltySaving ? 'Đang xử lý...' : loyaltyAction === 'add' ? 'Cộng điểm' : 'Trừ điểm'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-gray-400">Điều chỉnh điểm tích lũy cho khách hàng. Hành động sẽ được ghi nhận.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
