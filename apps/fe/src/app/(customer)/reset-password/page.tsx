import type { Metadata } from 'next';
import { STORE } from '@/lib/store-info';
import ResetPasswordClient from './reset-password-client';

export const metadata: Metadata = {
  title: `Đặt Lại Mật Khẩu - ${STORE.name}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordClient />;
}
