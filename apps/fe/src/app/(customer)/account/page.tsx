import type { Metadata } from 'next';
import AccountClient from './account-client';

export const metadata: Metadata = {
  title: 'Tài Khoản',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountClient />;
}
