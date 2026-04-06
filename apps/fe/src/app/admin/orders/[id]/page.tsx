'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Clock, Truck, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useOrder, useUpdateOrderStatus } from '@/hooks/use-orders';
import { useSocketEvent } from '@/hooks/use-socket';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { shipperService } from '@/services/shipper.service';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'preparing', label: 'Đang chuẩn bị' },
  { value: 'waiting_pickup', label: 'Chờ lấy hàng' },
  { value: 'in_transit', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Hủy' },
];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const qc = useQueryClient();
  const [shippers, setShippers] = useState<any[]>([]);
  const [selectedShipper, setSelectedShipper] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [loadingShippers, setLoadingShippers] = useState(false);

  // Realtime: auto-refresh on status change
  const handleStatusUpdate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['order', id] });
  }, [qc, id]);
  useSocketEvent('order:statusUpdated', handleStatusUpdate);
  useSocketEvent('order:shipper-assigned', handleStatusUpdate);

  // Load shippers for assignment
  useEffect(() => {
    if (showAssignDialog) {
      setLoadingShippers(true);
      shipperService.getShippers({ limit: 50 })
        .then((res) => {
          const list = Array.isArray(res) ? res : (res.data || []);
          setShippers(list);
        })
        .catch(() => {})
        .finally(() => setLoadingShippers(false));
    }
  }, [showAssignDialog]);

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!order) return null;

  const o = order as any;

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id: o._id, status }, {
      onSuccess: () => toast.success('Đã cập nhật trạng thái'),
      onError: () => toast.error('Cập nhật thất bại'),
    });
  };

  const handleAssignShipper = async () => {
    if (!selectedShipper) return;
    setAssigning(true);
    try {
      await shipperService.adminAssignOrder(selectedShipper, o._id);
      toast.success('Đã gán shipper thành công');
      setShowAssignDialog(false);
      qc.invalidateQueries({ queryKey: ['order', id] });
    } catch {
      toast.error('Gán shipper thất bại');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
          </Button>
          <h1 className="text-xl font-bold">Đơn #{o.orderNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={o.status} type="order" />
          <Select value={o.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Order info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-3">Thông tin đơn hàng</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Mã đơn</dt>
              <dd className="font-mono font-medium">#{o.orderNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ngày đặt</dt>
              <dd>{formatDate(o.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Thanh toán</dt>
              <dd>{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">TT thanh toán</dt>
              <dd><StatusBadge status={o.paymentStatus} type="payment" /></dd>
            </div>
            {o.isPosOrder && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Loại</dt>
                <dd className="text-orange-600 font-medium">POS</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Customer + Shipping */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-3">Khách hàng</h2>
          <p className="font-medium">{o.customerName || o.customerId?.fullName}</p>
          <p className="text-sm text-gray-500">{o.customerEmail || o.customerId?.email}</p>
          <p className="text-sm text-gray-500">{o.customerPhone || o.customerId?.phone}</p>
          {o.shippingFullName && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="h-3.5 w-3.5 text-primary-500" />
                <span className="text-xs font-medium text-gray-600">Địa chỉ giao hàng</span>
              </div>
              <p className="text-sm font-medium">{o.shippingFullName}</p>
              <p className="text-sm text-gray-600">{o.shippingPhone}</p>
              <p className="text-sm text-gray-600">
                {[o.shippingStreet, o.shippingWard, o.shippingDistrict, o.shippingProvince].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shipper Assignment */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4" /> Shipper
          </h2>
          {!o.shipperId && ['confirmed', 'preparing', 'waiting_pickup'].includes(o.status) && (
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Gán shipper</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Chọn shipper</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {loadingShippers ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-primary-500 animate-spin mr-2" />
                      Đang tải danh sách shipper...
                    </div>
                  ) : shippers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">Không có shipper khả dụng</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-1">
                      {shippers.map((s: any) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setSelectedShipper(s._id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors ${
                            selectedShipper === s._id
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{s.fullName}</p>
                            <p className="text-gray-500 text-xs">{s.phone}</p>
                          </div>
                          {s.activeOrders > 0 && (
                            <span className="text-xs text-orange-500 shrink-0">{s.activeOrders} đơn</span>
                          )}
                          {selectedShipper === s._id && (
                            <div className="h-4 w-4 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleAssignShipper} disabled={!selectedShipper || assigning || loadingShippers} className="w-full">
                    {assigning ? 'Đang gán...' : 'Xác nhận gán shipper'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {o.shipperId ? (
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{o.shipperName || 'Shipper'}</p>
              {o.shipperPhone && (
                <a href={`tel:${o.shipperPhone}`} className="text-sm text-blue-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {o.shipperPhone}
                </a>
              )}
            </div>
            {o.status === 'in_transit' && (
              <Link href={`/admin/orders/${o._id}/tracking`} className="ml-auto">
                <Button size="sm" variant="outline">Theo dõi</Button>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Chưa gán shipper</p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="font-semibold mb-4">Sản phẩm ({o.items?.length})</h2>
        <div className="space-y-3 mb-4">
          {o.items?.map((item: any, i: number) => (
            <div key={item._id || i} className="flex gap-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                <Image src={item.productImage || '/images/placeholder.svg'} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                {(item.variantInfo?.colorName || item.variantInfo?.dimensionLabel) && (
                  <p className="text-xs text-gray-500">
                    {[item.variantInfo.colorName, item.variantInfo.dimensionLabel].filter(Boolean).join(' / ')}
                  </p>
                )}
                {item.variantSku && <p className="text-xs text-gray-400">SKU: {item.variantSku}</p>}
                <p className="text-xs text-gray-400">x{item.quantity}</p>
              </div>
              <p className="text-sm font-medium">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Tạm tính</span><span>{formatPrice(o.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Vận chuyển</span>
            <span>{o.shippingFee === 0 ? 'Miễn phí' : formatPrice(o.shippingFee)}</span>
          </div>
          {o.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá{o.discountReason ? ` (${o.discountReason})` : ''}</span>
              <span>-{formatPrice(o.discountAmount)}</span>
            </div>
          )}
          {o.couponCode && (
            <div className="flex justify-between text-gray-500">
              <span>Mã giảm giá</span><span className="font-mono">{o.couponCode}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1.5 border-t">
            <span>Tổng cộng</span>
            <span className="text-primary-600">{formatPrice(o.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Proof */}
      {o.deliveryProofImage && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-3">Ảnh xác nhận giao hàng</h2>
          <div className="relative h-48 w-full rounded-lg overflow-hidden">
            <Image src={o.deliveryProofImage} alt="Proof" fill className="object-contain" />
          </div>
        </div>
      )}

      {/* Status History */}
      {o.statusHistory?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-3">Lịch sử trạng thái</h2>
          <div className="space-y-3">
            {o.statusHistory.map((h: any, i: number) => (
              <div key={h._id || i} className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.status} type="order" />
                    <span className="text-gray-400 text-xs">{formatDateTime(h.changedAt)}</span>
                  </div>
                  {h.note && <p className="text-gray-500 mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {o.shippingNote && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-2">Ghi chú</h2>
          <p className="text-sm text-gray-600">{o.shippingNote}</p>
        </div>
      )}
    </div>
  );
}
