import type { Metadata } from 'next';
import CartClient from './cart-client';

export const metadata: Metadata = {
  title: 'Giỏ Hàng',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CartClient />;
}
