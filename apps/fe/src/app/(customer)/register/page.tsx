import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import RegisterClient from './register-client';

export const metadata: Metadata = {
  title: `Đăng Ký Tài Khoản - ${STORE.name}`,
  description: `Đăng ký tài khoản ${STORE.name} để mua sắm nội thất với giá ưu đãi, theo dõi đơn hàng và tích điểm.`,
  alternates: { canonical: `${STORE.url}/register` },
};

export default function Page() {
  return <RegisterClient />;
}
