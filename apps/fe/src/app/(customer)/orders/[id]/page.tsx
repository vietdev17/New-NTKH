import type { Metadata } from 'next';
import OrderDetailClient from './order-detail-client';

export const metadata: Metadata = {
  title: 'Chi Tiết Đơn Hàng',
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: { id: string } }) {
  return <OrderDetailClient params={params} />;
}
