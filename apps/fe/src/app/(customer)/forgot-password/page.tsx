import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import ForgotPasswordClient from './forgot-password-client';

export const metadata: Metadata = {
  title: `Quên Mật Khẩu - ${STORE.name}`,
  description: `Khôi phục mật khẩu tài khoản ${STORE.name}.`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ForgotPasswordClient />;
}
