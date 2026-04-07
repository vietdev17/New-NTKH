import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import ReviewsClient from './reviews-client';

export const metadata: Metadata = {
  title: `Đánh Giá Của Tôi - ${STORE.name}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReviewsClient />;
}
