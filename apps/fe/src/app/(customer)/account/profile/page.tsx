import type { Metadata } from 'next';
import ProfileClient from './profile-client';

export const metadata: Metadata = {
  title: 'Hồ Sơ Cá Nhân',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfileClient />;
}
