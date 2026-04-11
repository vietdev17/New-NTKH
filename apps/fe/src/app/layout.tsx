import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { STORE } from '@/lib/store-info';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = STORE.url;
const SITE_NAME = STORE.name;

const defaultTitle = `${SITE_NAME} - Nội Thất Giá Tốt Tại ${STORE.city} ${STORE.province}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: defaultTitle, template: `%s | ${SITE_NAME}` },
  description: STORE.description,
  keywords: [...STORE.keywords],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: defaultTitle,
    description: STORE.description,
    images: [{ url: STORE.ogImage, width: 1200, height: 630, alt: defaultTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: STORE.description,
    images: [STORE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  alternates: { canonical: SITE_URL },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#8B4513',
};

// JSON-LD: FurnitureStore (Local Business — rất quan trọng cho Google Maps & local search)
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'FurnitureStore',
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/logo.png`,
    width: 200,
    height: 60,
  },
  image: `${SITE_URL}${STORE.ogImage}`,
  description: STORE.description,
  address: {
    '@type': 'PostalAddress',
    addressLocality: STORE.city,
    addressRegion: STORE.province,
    addressCountry: STORE.countryCode,
  },
  areaServed: [
    { '@type': 'State', name: STORE.province },
    { '@type': 'Country', name: STORE.country },
  ],
  priceRange: '₫₫',
  currenciesAccepted: 'VND',
  paymentAccepted: 'Tiền mặt, Chuyển khoản',
};

// JSON-LD: WebSite (Google Sitelinks Search Box)
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'vi-VN',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        {/* Favicon - required by Google for SERP favicon display */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
