'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, CheckCircle, Truck, Package, Warehouse, Phone, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useOrder, useCancelOrder } from '@/hooks/use-orders';
import { formatDate, formatPrice } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';

const STATUS_STEPS = [
  { key: 'pending', label: 'Chờ xác nhận', icon: Clock },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
  { key: 'preparing', label: 'Đang chuẩn bị', icon: Package },
  { key: 'waiting_pickup', label: 'Chờ lấy hàng', icon: Warehouse },
  { key: 'in_transit', label: 'Đang giao', icon: Truck },
  { key: 'delivered', label: 'Đã giao', icon: CheckCircle },
];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order, isLoading } = useOrder(params.id);
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!order) return null;

  const o = order as any;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === o.status);
  const canTrack = !['cancelled', 'returned', 'refunded'].includes(o.status);
  const isDelivering = ['in_transit', 'shipping'].includes(o.status);

  return (
    <div className="container-custom py-6 lg:py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/orders"><ArrowLeft className="h-4 w-4" /> Trở về</Link>
        </Button>
        <h1 className="text-xl font-bold">Chi Tiết Đơn Hàng</h1>
      </div>

      {/* Status timeline */}
      {o.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0" />
            {STATUS_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = currentStepIndex >= i;
              const isCurrent = currentStepIndex === i;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white border-gray-200 text-gray-300'
                    } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs text-center hidden sm:block ${isCompleted ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Shipper info + tracking CTA */}
        {o.shipperName && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{o.shipperName}</p>
                {o.shipperPhone && (
                  <a href={`tel:${o.shipperPhone}`} className="text-sm text-blue-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {o.shipperPhone}
                  </a>
                )}
              </div>
              {canTrack && o.status !== 'delivered' && (
                <Button asChild size="sm" className="gap-1.5 bg-blue-500 hover:bg-blue-600 shrink-0">
                  <Link href={`/orders/${params.id}/tracking`}>
                    <Navigation className="h-3.5 w-3.5" />
                    {isDelivering ? 'Xem trên bản đồ' : 'Theo dõi'}
                  </Link>
                </Button>
              )}
            </div>
            {isDelivering && (
              <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Shipper đang trên đường giao hàng đến bạn
              </div>
            )}
          </div>
        )}

        {/* Tracking button when no shipper yet */}
        {!o.shipperName && canTrack && o.status !== 'delivered' && (
          <Button asChild variant="outline" className="w-full gap-2 h-12">
            <Link href={`/orders/${params.id}/tracking`}>
              <MapPin className="h-4 w-4" /> Theo dõi đơn hàng
            </Link>
          </Button>
        )}

        {/* Order info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Thông Tin Đơn Hàng</h2>
            <StatusBadge status={o.status} type="order" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Mã đơn hàng</p>
              <p className="font-mono font-medium">#{o.orderNumber || o.orderCode}</p>
            </div>
            <div>
              <p className="text-gray-500">Ngày đặt hàng</p>
              <p className="font-medium">{formatDate(o.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Thanh toán</p>
              <p className="font-medium">{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</p>
            </div>
            <div>
              <p className="text-gray-500">Trạng thái thanh toán</p>
              <StatusBadge status={o.paymentStatus} type="payment" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-4">Sản Phẩm ({o.items?.length})</h2>
          <div className="space-y-3">
            {o.items?.map((item: any, i: number) => (
              <div key={item._id || i} className="flex gap-3">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                  <Image
                    src={item.productImage || item.product?.images?.[0] || '/images/placeholder.svg'}
                    alt={item.productName || ''}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-1">{item.productName || item.product?.name}</p>
                  {(item.variantInfo?.colorName || item.variantInfo?.dimensionLabel || item.variant) && (
                    <p className="text-xs text-gray-500">
                      {[
                        item.variantInfo?.colorName || item.variant?.colorName,
                        item.variantInfo?.dimensionLabel || item.variant?.dimensionLabel,
                      ].filter(Boolean).join(' / ') || item.variantSku}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                    {item.unitPrice && (
                      <p className="text-xs text-gray-400">@ {formatPrice(item.unitPrice)}</p>
                    )}
                  </div>
                </div>
                <p className="font-medium text-sm shrink-0">{formatPrice(item.totalPrice || item.subtotal || item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tạm tính</span>
              <span>{formatPrice(o.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vận chuyển</span>
              <span>{o.shippingFee === 0 ? 'Miễn phí' : formatPrice(o.shippingFee)}</span>
            </div>
            {(o.discountAmount > 0 || o.discount > 0) && (
              <div className="flex justify-between text-success-600">
                <span>Giảm giá</span>
                <span>-{formatPrice(o.discountAmount || o.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{formatPrice(o.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-primary-500" />
            <h2 className="font-semibold">Địa Chỉ Giao Hàng</h2>
          </div>
          <p className="font-medium">{o.shippingFullName || o.shippingAddress?.fullName || o.customerName}</p>
          <p className="text-sm text-gray-500">{o.shippingPhone || o.shippingAddress?.phone || o.customerPhone}</p>
          <p className="text-sm text-gray-500">
            {[
              o.shippingStreet || o.shippingAddress?.street,
              o.shippingWard || o.shippingAddress?.ward,
              o.shippingDistrict || o.shippingAddress?.district,
              o.shippingProvince || o.shippingAddress?.province,
            ].filter(Boolean).join(', ')}
          </p>
          {o.shippingNote && (
            <p className="text-sm text-gray-400 mt-1 italic">Ghi chú: {o.shippingNote}</p>
          )}
        </div>

        {/* Cancel button */}
        {['pending', 'confirmed'].includes(o.status) && (
          <Button
            variant="outline"
            className="border-danger-300 text-danger-500 hover:bg-danger-50"
            onClick={() => setConfirmCancel(true)}
          >
            Hủy Đơn Hàng
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Hủy Đơn Hàng"
        description="Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."
        confirmLabel="Hủy đơn hàng"
        onConfirm={() => {
          cancelOrder.mutate({ id: o._id });
          setConfirmCancel(false);
        }}
        isLoading={cancelOrder.isPending}
      />
    </div>
  );
}
