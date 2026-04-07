import type { Metadata } from 'next';
import { HomePage } from '@/components/customer/home/home-page';
import { STORE } from '@/lib/store-info';

const SITE_URL = STORE.url;

export const metadata: Metadata = {
  title: `${STORE.name} - Nội Thất Giá Tốt Tại ${STORE.city} ${STORE.province}`,
  description: STORE.description,
  openGraph: {
    title: `${STORE.name} - Nội Thất Giá Tốt Tại ${STORE.city} ${STORE.province}`,
    description: STORE.description,
    url: SITE_URL,
    images: [{ url: STORE.ogImage, width: 1200, height: 630, alt: STORE.name }],
  },
  alternates: { canonical: SITE_URL },
};

export default function Page() {
  return <HomePage />;
}
