import type { Metadata } from 'next';
import TrackingClient from './tracking-client';

export const metadata: Metadata = {
  title: 'Theo Dõi Đơn Hàng',
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: { id: string } }) {
  return <TrackingClient params={params} />;
}
