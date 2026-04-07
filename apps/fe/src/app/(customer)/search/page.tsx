import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import SearchClient from './search-client';

const SITE_NAME = STORE.name;

export const metadata: Metadata = {
  title: `Tìm Kiếm Sản Phẩm - ${SITE_NAME}`,
  description: `Tìm kiếm sản phẩm nội thất tại ${SITE_NAME}, ${STORE.city} ${STORE.province}. Nội thất gỗ, nhựa giả mây, ga giường, bàn trang điểm và nhiều hơn nữa.`,
  alternates: { canonical: `${STORE.url}/search` },
};

export default function Page() {
  return <SearchClient />;
}
