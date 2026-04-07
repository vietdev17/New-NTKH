import type { Metadata } from 'next';
import AddressesClient from './addresses-client';

export const metadata: Metadata = {
  title: 'Sổ Địa Chỉ',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AddressesClient />;
}
