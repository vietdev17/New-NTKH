import type { Metadata } from 'next';
import CheckoutClient from './checkout-client';

export const metadata: Metadata = {
  title: 'Thanh Toán',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckoutClient />;
}
