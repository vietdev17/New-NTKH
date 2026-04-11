import type { Metadata } from 'next';
import ProductDetailClient from './product-detail-client';

import { STORE } from '@/lib/store-info';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
const SITE_URL = STORE.url;
const SITE_NAME = STORE.name;

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) {
    return {
      title: 'Sản phẩm nội thất',
      description: `Xem chi tiết sản phẩm nội thất chất lượng tại ${SITE_NAME}, ${STORE.city} ${STORE.province}.`,
    };
  }

  const title = `${p.name} Đồng Xoài Bình Phước - Giá Tốt Tại ${SITE_NAME}`;
  const description = (
    p.shortDescription ||
    (typeof p.description === 'string' ? p.description.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').slice(0, 155) + '...' : '') ||
    `Mua ${p.name} chính hãng tại ${SITE_NAME}, ${STORE.city} ${STORE.province}. Nội thất đồng xoài bình phước, giao hàng toàn quốc, miễn phí vận chuyển.`
  ) as string;
  const image: string = p.images?.[0] || `${SITE_URL}/images/og-default.jpg`;
  const url = `${SITE_URL}/products/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'vi_VN',
      images: [{ url: image, width: 1200, height: 630, alt: p.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);

  // Helper: ensure image URLs are absolute
  const getImageUrl = (img: string) => {
    if (!img) return `${SITE_URL}/images/og-default.jpg`;
    if (img.startsWith('http')) return img;
    return `${SITE_URL}${img}`;
  };

  // Ensure categoryId is an object with name/slug
  const category = p?.categoryId && typeof p.categoryId === 'object' ? p.categoryId : null;

  // JSON-LD: Product schema — Google dùng để show giá, ảnh, rating trong kết quả tìm kiếm
  const productSchema = p
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.shortDescription || (typeof p.description === 'string' ? p.description.replace(/<[^>]*>/g, '').slice(0, 500) : ''),
        image: p.images?.length
          ? p.images.map(getImageUrl)
          : [`${SITE_URL}/images/og-default.jpg`],
        url: `${SITE_URL}/products/${params.slug}`,
        sku: p.sku || params.slug,
        brand: {
          '@type': 'Brand',
          name: p.brand || SITE_NAME,
        },
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/products/${params.slug}`,
          priceCurrency: 'VND',
          price: p.salePrice || p.basePrice || '0',
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          availability:
            p.status === 'active'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
          },
        },
        ...(p.rating?.count > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(p.rating.average),
            reviewCount: String(p.rating.count),
            bestRating: '5',
            worstRating: '1',
          },
        }),
      }
    : null;

  // JSON-LD: BreadcrumbList
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: `${SITE_URL}/products` },
  ];

  if (category?.name) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: category.name,
      item: `${SITE_URL}/categories/${category.slug}`,
    });
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: p?.name || 'Sản phẩm',
    item: `${SITE_URL}/products/${params.slug}`,
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient params={params} />
    </>
  );
}
