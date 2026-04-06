import type { Metadata } from 'next';
import { HomePage } from '@/components/customer/home/home-page';

export const metadata: Metadata = {
  title: 'Furniture VN - Noi That Chat Luong Cao',
  description:
    'Furniture VN cung cap noi that go tu nhien chat luong cao. Sofa, ban an, giuong ngu, tu quan ao voi thiet ke hien dai, gia tot nhat thi truong.',
};

export default function Page() {
  return <HomePage />;
}
