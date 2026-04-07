import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import WishlistClient from './wishlist-client';

export const metadata: Metadata = {
  title: `Sản Phẩm Yêu Thích - ${STORE.name}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WishlistClient />;
}
