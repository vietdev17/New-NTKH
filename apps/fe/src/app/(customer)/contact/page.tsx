import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import ContactClient from './contact-client';

const SITE_URL = STORE.url;
const SITE_NAME = STORE.name;

const title = `Liên Hệ - ${SITE_NAME}`;
const description = `Liên hệ ${SITE_NAME} tại ${STORE.address}. Hotline: ${STORE.phone}. Email: ${STORE.email}. Tư vấn miễn phí, hỗ trợ 24/7.`;
const url = `${SITE_URL}/contact`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    siteName: SITE_NAME,
    locale: 'vi_VN',
    type: 'website',
    images: [{ url: STORE.ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: { card: 'summary_large_image', title, description },
  alternates: { canonical: url },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Liên hệ', item: url },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ContactClient />
    </>
  );
}
