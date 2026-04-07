import type { Metadata } from 'next';
import CategoryClient from './category-client';

import { STORE } from '@/lib/store-info';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
const SITE_URL = STORE.url;
const SITE_NAME = STORE.name;

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = await getCategory(params.slug);
  if (!cat) {
    return {
      title: 'Danh mục sản phẩm',
      description: `Xem danh mục sản phẩm nội thất tại ${SITE_NAME}, ${STORE.city} ${STORE.province}.`,
    };
  }

  const title = `${cat.name} - Mua Ngay Tại ${SITE_NAME}`;
  const description =
    cat.description ||
    `Khám phá bộ sưu tập ${cat.name} phong phú tại ${SITE_NAME}, ${STORE.city} ${STORE.province}. Giá tốt, giao hàng toàn quốc, miễn phí vận chuyển.`;
  const url = `${SITE_URL}/categories/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'vi_VN',
      images: [{ url: cat.image || '/images/og-default.jpg', width: 1200, height: 630, alt: cat.name }],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: url },
  };
}

async function getProducts(categorySlug: string) {
  try {
    const res = await fetch(`${API_URL}/products?category=${categorySlug}&limit=20`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const [cat, products] = await Promise.all([
    getCategory(params.slug),
    getProducts(params.slug),
  ]);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Danh mục', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name: cat?.name || 'Danh mục', item: `${SITE_URL}/categories/${params.slug}` },
    ],
  };

  // ItemList schema — giúp Google hiểu đây là trang danh sách, không phải trang sản phẩm đơn lẻ
  const itemListSchema = products.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: cat?.name || 'Danh mục sản phẩm',
        numberOfItems: products.length,
        itemListElement: products.map((p: any, i: number) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/products/${p.slug}`,
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <CategoryClient />
    </>
  );
}
