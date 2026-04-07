import type { Metadata } from 'next';
import CheckoutSuccessClient from './success-client';

export const metadata: Metadata = {
  title: 'Đặt Hàng Thành Công',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckoutSuccessClient />;
}
