import type { Metadata } from 'next';
import { HomePage } from '@/components/customer/home/home-page';
import { STORE } from '@/lib/store-info';

const SITE_URL = STORE.url;

export const metadata: Metadata = {
  title: `Nội Thất Đồng Xoài Bình Phước - ${STORE.name} Giá Tốt`,
  description: `Nội thất đồng xoài bình phước giá tốt nhất - ${STORE.description}`,
  openGraph: {
    title: `Nội Thất Đồng Xoài Bình Phước - ${STORE.name} Giá Tốt`,
    description: `Nội thất đồng xoài bình phước giá tốt nhất - ${STORE.description}`,
    url: SITE_URL,
    images: [{ url: STORE.ogImage, width: 1200, height: 630, alt: STORE.name }],
  },
  alternates: { canonical: SITE_URL },
};

export default function Page() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Nội thất đồng xoài bình phước có giao hàng không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Có, ${STORE.name} giao hàng nội thất đồng xoài bình phước toàn quốc, miễn phí vận chuyển trong bán kính 150km.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Nội thất gỗ đồng xoài bình phước giá bao nhiêu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${STORE.name} cam kết giá tốt nhất thị trường nội thất đồng xoài bình phước. Liên hệ ${STORE.phone} để được báo giá chi tiết.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Cửa hàng nội thất đồng xoài bình phước ở đâu?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${STORE.name} là cửa hàng nội thất tại ${STORE.address}. Quý khách có thể đến trực tiếp xem và đặt mua nội thất đồng xoài bình phước.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Nội thất đồng xoài bình phước có bảo hành không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Có, tất cả nội thất đồng xoài bình phước tại ${STORE.name} đều được bảo hành theo nhà sản xuất, hàng chính hãng chất lượng đảm bảo.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Mua nội thất đồng xoài bình phước online có tin được không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${STORE.name} là địa chỉ uy tín mua nội thất đồng xoài bình phước online với hình ảnh chụp thật, che chắn cẩn thận và đổi trả trong 30 ngày.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomePage />
    </>
  );
}
