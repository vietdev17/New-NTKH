import type { Metadata } from 'next';
import OrdersClient from './orders-client';

export const metadata: Metadata = {
  title: 'Đơn Hàng Của Tôi',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <OrdersClient />;
}
