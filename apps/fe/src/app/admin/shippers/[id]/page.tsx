'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft, Phone, Mail, MapPin, Clock, Truck, Package,
  TrendingUp, Banknote, CheckCircle2, Calendar, Bike, Car, Van,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControl } from '@/components/shared/pagination-control';
import { shipperService } from '@/services/shipper.service';
import { orderService } from '@/services/order.service';
import { formatDate, formatDateTime, formatPrice, formatRelativeTime, getInitials } from '@/lib/utils';
import { SHIPPER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/constants';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'secondary'> = {
  available: 'success',
  busy: 'warning',
  offline: 'secondary',
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: 'Xe máy',
  car: 'Ô tô',
  van: 'Xe tải',
};

const VEHICLE_ICONS: Record<string, typeof Bike> = {
  motorcycle: Bike,
  car: Car,
  van: Van,
};

export default function AdminShipperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [orderPage, setOrderPage] = useState(1);

  const { data: shipper, isLoading } = useQuery({
    queryKey: ['admin-shipper', id],
    queryFn: () => shipperService.getShipperById(id),
    refetchInterval: 30000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-shipper-orders', id, orderPage],
    queryFn: () => shipperService.getShipperOrders(id, { page: orderPage, limit: 10 }),
  });

  const s = shipper as any;
  const stats = s?.stats || {};
  const location = s?.currentLocation;
  const orders = (ordersData as any)?.data || [];
  const ordersMeta = (ordersData as any)?.meta || {};

  if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!s) return null;

  const status = s.shipperStatus || s.status || 'offline';
  const VehicleIcon = VEHICLE_ICONS[s.vehicleType] || Bike;

  const currentCoords = location?.location?.coordinates;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/admin/shippers"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
        </Button>
        <h1 className="text-xl font-bold">Chi tiết shipper</h1>
        <Badge variant={STATUS_VARIANT[status] || 'secondary'}>
          {SHIPPER_STATUS_LABELS[status] || status}
        </Badge>
      </div>

      {/* Thông tin shipper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thẻ hồ sơ */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={s.avatar} />
              <AvatarFallback className="text-lg bg-secondary-100 text-secondary-600">{getInitials(s.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">{s.fullName}</h2>
              <p className="text-sm text-gray-400 font-mono">{s._id}</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <a href={`tel:${s.phone}`} className="text-primary-600 hover:underline">{s.phone || '—'}</a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{s.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <VehicleIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">
                {VEHICLE_LABELS[s.vehicleType] || s.vehicleType || '—'}
                {s.licensePlate && <span className="text-gray-400 ml-1">— {s.licensePlate}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-500">Tham gia: {formatDate(s.createdAt)}</span>
            </div>
            {s.isActive === false && (
              <Badge variant="destructive">Tài khoản bị khóa</Badge>
            )}
          </dl>
        </div>

        {/* Thẻ thống kê */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-4">Thống kê</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{stats.totalDelivered || 0}</p>
              <p className="text-xs text-gray-500">Đã giao</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <Package className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-600">{stats.totalAssigned || 0}</p>
              <p className="text-xs text-gray-500">Tổng được giao</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-3 text-center">
              <Banknote className="h-5 w-5 text-primary-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary-600">{formatPrice(stats.totalEarnings || 0)}</p>
              <p className="text-xs text-gray-500">Doanh thu (phí ship)</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{stats.completionRate || 0}%</p>
              <p className="text-xs text-gray-500">Tỷ lệ hoàn thành</p>
            </div>
          </div>
          {stats.totalCodCollected > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-500">
              <Banknote className="h-3.5 w-3.5" />
              <span>Tổng COD thu hộ: {formatPrice(stats.totalCodCollected)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Vị trí hiện tại */}
      {currentCoords && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-500" /> Vị trí hiện tại
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Kinh độ</span>
              <p className="font-mono font-medium">{currentCoords[0].toFixed(6)}</p>
            </div>
            <div>
              <span className="text-gray-400">Vĩ độ</span>
              <p className="font-mono font-medium">{currentCoords[1].toFixed(6)}</p>
            </div>
            <div>
              <span className="text-gray-400">Cập nhật</span>
              <p className="font-medium">{location.updatedAt ? formatRelativeTime(location.updatedAt) : '—'}</p>
            </div>
          </div>
          <div className="mt-3">
            <a
              href={`https://www.google.com/maps?q=${currentCoords[1]},${currentCoords[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 text-sm hover:underline"
            >
              Xem trên Google Maps &rarr;
            </a>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Đơn hàng ({ordersMeta.total || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
            {orders.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Shipper chưa có đơn hàng</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <Link key={order._id} href={`/admin/orders/${order._id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-medium text-sm">#{order.orderNumber}</span>
                        <StatusBadge status={order.status} type="order" />
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {[order.shippingStreet, order.shippingDistrict, order.shippingProvince].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                        {order.deliveredAt && ` → giao ${formatDate(order.deliveredAt)}`}
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
      </Tabs>
    </div>
  );
}
