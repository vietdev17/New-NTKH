import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import CompareClient from './compare-client';

export const metadata: Metadata = {
  title: `So Sánh Sản Phẩm - ${STORE.name}`,
  description: `So sánh các sản phẩm nội thất tại ${STORE.name} để chọn sản phẩm phù hợp nhất với nhu cầu của bạn.`,
};

export default function Page() {
  return <CompareClient />;
}
