import type { Metadata } from 'next';
import NotificationsClient from './notifications-client';

export const metadata: Metadata = {
  title: 'Thông Báo',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NotificationsClient />;
}
