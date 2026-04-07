import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import LoginClient from './login-client';

export const metadata: Metadata = {
  title: `Đăng Nhập - ${STORE.name}`,
  description: `Đăng nhập tài khoản ${STORE.name} để mua sắm nội thất, theo dõi đơn hàng và nhận ưu đãi.`,
  alternates: { canonical: `${STORE.url}/login` },
};

export default function Page() {
  return <LoginClient />;
}
