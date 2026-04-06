import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: { default: 'Furniture VN - Noi That Chat Luong', template: '%s | Furniture VN' },
  description: 'He thong thuong mai dien tu noi that hang dau Viet Nam. Mua sam noi that online voi gia tot nhat, giao hang tan noi.',
  keywords: ['noi that', 'furniture', 'mua noi that online', 'ban ghe', 'giuong tu', 'trang tri nha cua'],
  openGraph: { type: 'website', locale: 'vi_VN', siteName: 'Furniture VN' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#8B4513',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
