import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import ProductsClient from './products-client';

const SITE_URL = STORE.url;
const SITE_NAME = STORE.name;

const title = `Tất Cả Sản Phẩm Nội Thất - ${SITE_NAME}`;
const description = `Khám phá hàng trăm sản phẩm nội thất chất lượng tại ${SITE_NAME}, ${STORE.city} ${STORE.province}. Nội thất gỗ, nhựa giả mây, ga giường, bàn trang điểm. Giá tốt, giao hàng toàn quốc.`;
const url = `${SITE_URL}/products`;

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
    { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: url },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductsClient />
    </>
  );
}
