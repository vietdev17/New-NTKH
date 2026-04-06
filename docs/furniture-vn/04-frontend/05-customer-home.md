# CUSTOMER HOME PAGE

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/app/(customer)/page.tsx`, `apps/fe/src/components/customer/home/`
> Bao gom: HomePage (SSR), HeroBanner, FeaturedCategories, BestSellers, NewArrivals, ComboShowcase, WhyChooseUs, ProductCard
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + React Query
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [HomePage - Server Component](#1-homepage---server-component)
2. [HeroBanner](#2-herobanner)
3. [FeaturedCategories](#3-featuredcategories)
4. [BestSellers](#4-bestsellers)
5. [NewArrivals](#5-newarrivals)
6. [ComboShowcase](#6-comboshowcase)
7. [WhyChooseUs](#7-whychooseus)
8. [ProductCard (Reusable)](#8-productcard-reusable)
9. [Responsive & Animation Summary](#9-responsive--animation-summary)

---

## 1. HomePage - Server Component

> File: `apps/fe/src/app/(customer)/page.tsx`
> Server component fetch du lieu ban dau (SSR) de toi uu SEO.
> Du lieu: banners, featured categories, best sellers, new arrivals, combo categories.

### 1.1 Cau truc trang

```
┌─────────────────────────────────────────┐
│  HeroBanner (full-width carousel)       │  60vh desktop / 40vh mobile
├─────────────────────────────────────────┤
│  FeaturedCategories (6 cards grid)      │  Section: "Danh muc noi bat"
├─────────────────────────────────────────┤
│  BestSellers (product grid/scroll)      │  Section: "San pham ban chay"
├─────────────────────────────────────────┤
│  NewArrivals (product grid)             │  Section: "San pham moi"
├─────────────────────────────────────────┤
│  ComboShowcase (large cards)            │  Section: "Combo noi that"
├─────────────────────────────────────────┤
│  WhyChooseUs (4 feature cards)          │  Section: "Tai sao chon chung toi"
└─────────────────────────────────────────┘
```

### 1.2 Code

```tsx
// ============================================================
// apps/fe/src/app/(customer)/page.tsx
// ============================================================
import { Metadata } from 'next';
import { HeroBanner } from '@/components/customer/home/hero-banner';
import { FeaturedCategories } from '@/components/customer/home/featured-categories';
import { BestSellers } from '@/components/customer/home/best-sellers';
import { NewArrivals } from '@/components/customer/home/new-arrivals';
import { ComboShowcase } from '@/components/customer/home/combo-showcase';
import { WhyChooseUs } from '@/components/customer/home/why-choose-us';
import { bannerService } from '@/services/banner-service';
import { productService } from '@/services/product-service';
import { categoryService } from '@/services/category-service';

// ----- SEO Metadata -----
export const metadata: Metadata = {
  title: 'Noi That Viet - Noi That Go Chat Luong Cao',
  description:
    'Noi That Viet cung cap noi that go tu nhien chat luong cao. Sofa, ban an, giuong ngu, tu quan ao voi thiet ke hien dai, gia tot nhat thi truong.',
  keywords: [
    'noi that',
    'noi that go',
    'sofa',
    'ban an go',
    'giuong ngu',
    'tu quan ao',
    'noi that viet nam',
  ],
  openGraph: {
    title: 'Noi That Viet - Noi That Go Chat Luong Cao',
    description:
      'Noi That Viet cung cap noi that go tu nhien chat luong cao voi thiet ke hien dai.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Noi That Viet',
      },
    ],
  },
};

// ----- Server Component - fetch data SSR -----
export default async function HomePage() {
  // Fetch song song tat ca data can thiet
  const [banners, featuredCategories, bestSellers, newArrivals, comboCategories] =
    await Promise.all([
      bannerService.getActiveBanners().catch(() => []),
      categoryService.getFeaturedCategories().catch(() => []),
      productService.getBestSellers({ limit: 8 }).catch(() => []),
      productService.getNewArrivals({ limit: 8 }).catch(() => []),
      categoryService.getComboCategories().catch(() => []),
    ]);

  return (
    <div className="flex flex-col">
      {/* Hero Banner - full width */}
      <HeroBanner banners={banners} />

      {/* Featured Categories */}
      <section className="py-12 lg:py-16">
        <FeaturedCategories categories={featuredCategories} />
      </section>

      {/* Best Sellers */}
      <section className="py-12 lg:py-16 bg-surface-200/50">
        <BestSellers products={bestSellers} />
      </section>

      {/* New Arrivals */}
      <section className="py-12 lg:py-16">
        <NewArrivals products={newArrivals} />
      </section>

      {/* Combo Showcase */}
      <section className="py-12 lg:py-16 bg-primary-900 text-white">
        <ComboShowcase categories={comboCategories} />
      </section>

      {/* Why Choose Us */}
      <section className="py-12 lg:py-16">
        <WhyChooseUs />
      </section>
    </div>
  );
}
```

### 1.3 Ket noi API

| Data | API Service | Endpoint |
|---|---|---|
| Banners | `bannerService.getActiveBanners()` | `GET /banners?isActive=true` |
| Featured Categories | `categoryService.getFeaturedCategories()` | `GET /categories?isFeatured=true` |
| Best Sellers | `productService.getBestSellers({ limit })` | `GET /products?sort=bestSeller&limit=8` |
| New Arrivals | `productService.getNewArrivals({ limit })` | `GET /products?sort=newest&limit=8` |
| Combo Categories | `categoryService.getComboCategories()` | `GET /categories/combo` |

---

## 2. HeroBanner

> File: `apps/fe/src/components/customer/home/hero-banner.tsx`
> Full-width carousel/slider voi 3-5 slides.
> Auto-play voi pause on hover.
> Framer Motion transitions giua cac slides.

### 2.1 Cau truc

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│          [Background Image - full width]                        │
│                                                                 │
│     ┌─────────────────────┐                                     │
│     │  Overline text       │                                     │
│     │  TIEU DE CHINH       │                                     │
│     │  Mo ta ngan          │                                     │
│     │  [CTA Button]        │                                     │
│     └─────────────────────┘                                     │
│                                                                 │
│  [◄]                                                      [►]  │
│                     ● ○ ○ ○ ○                                   │
└─────────────────────────────────────────────────────────────────┘
Height: 60vh desktop / 40vh mobile
```

### 2.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/home/hero-banner.tsx
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  overline?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  textPosition?: 'left' | 'center' | 'right';
}

interface HeroBannerProps {
  banners: Banner[];
}

// ----- Animation variants cho slide transition -----
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const AUTO_PLAY_INTERVAL = 5000; // 5 giay

export function HeroBanner({ banners }: HeroBannerProps) {
  const [[currentIndex, direction], setSlide] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  // ----- Fallback neu khong co banner -----
  if (!banners || banners.length === 0) {
    return (
      <div className="relative h-[40vh] lg:h-[60vh] bg-gradient-to-r from-primary-800
                      to-primary-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-display font-bold mb-4">Noi That Viet</h1>
          <p className="text-body-lg mb-6">Noi that go chat luong cao</p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/products">Kham pha ngay</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  // ----- Navigation -----
  const goToSlide = useCallback(
    (index: number) => {
      const newDirection = index > currentIndex ? 1 : -1;
      setSlide([index, newDirection]);
    },
    [currentIndex],
  );

  const goNext = useCallback(() => {
    setSlide(([prev]) => [
      prev === banners.length - 1 ? 0 : prev + 1,
      1,
    ]);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setSlide(([prev]) => [
      prev === 0 ? banners.length - 1 : prev - 1,
      -1,
    ]);
  }, [banners.length]);

  // ----- Auto-play -----
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    const timer = setInterval(goNext, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goNext, banners.length]);

  // ----- Text position class -----
  const getTextPositionClass = (pos?: string) => {
    switch (pos) {
      case 'center':
        return 'items-center text-center';
      case 'right':
        return 'items-end text-right';
      default:
        return 'items-start text-left';
    }
  };

  return (
    <div
      className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ===== SLIDES ===== */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <Image
            src={currentBanner.image}
            alt={currentBanner.title}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="100vw"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

          {/* Content */}
          <div
            className={cn(
              'relative z-10 flex h-full flex-col justify-center',
              'mx-auto max-w-7xl px-4 lg:px-6',
              getTextPositionClass(currentBanner.textPosition),
            )}
          >
            <div className="max-w-xl">
              {/* Overline */}
              {currentBanner.overline && (
                <motion.p
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                  className="text-overline uppercase tracking-widest text-accent-300 mb-3"
                >
                  {currentBanner.overline}
                </motion.p>
              )}

              {/* Title */}
              <motion.h1
                variants={textVariants}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="text-h1 sm:text-display font-bold text-white mb-4
                           leading-tight"
              >
                {currentBanner.title}
              </motion.h1>

              {/* Subtitle */}
              {currentBanner.subtitle && (
                <motion.p
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                  className="text-body-lg text-white/80 mb-6"
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}

              {/* CTA Button */}
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
                custom={0.3}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-accent-300 text-primary-900 hover:bg-accent-200
                             font-semibold text-body px-8"
                >
                  <Link href={currentBanner.ctaLink}>
                    {currentBanner.ctaText}
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ===== ARROW NAVIGATION ===== */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20
                       flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center
                       rounded-full bg-white/20 text-white backdrop-blur-sm
                       hover:bg-white/40 transition-colors"
            aria-label="Slide truoc"
          >
            <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20
                       flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center
                       rounded-full bg-white/20 text-white backdrop-blur-sm
                       hover:bg-white/40 transition-colors"
            aria-label="Slide tiep"
          >
            <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
          </button>
        </>
      )}

      {/* ===== DOTS NAVIGATION ===== */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20
                        flex items-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Chuyen den slide ${index + 1}`}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2.5 bg-white/50 hover:bg-white/75',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2.3 Responsive

| Breakpoint | Height | Chi tiet |
|---|---|---|
| Default (<640px) | `40vh` | Title: `text-h1`, CTA nho hon |
| `sm` (640px) | `50vh` | Title: `text-display` |
| `lg` (1024px+) | `60vh` | Arrow buttons lon hon |

---

## 3. FeaturedCategories

> File: `apps/fe/src/components/customer/home/featured-categories.tsx`
> Grid 6 category cards voi hover effect.
> StaggerContainer animation khi scroll vao view.

### 3.1 Cau truc

```
         Danh muc noi bat
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Img  │ │ Img  │ │ Img  │ │ Img  │ │ Img  │ │ Img  │
│      │ │      │ │      │ │      │ │      │ │      │
│ Name │ │ Name │ │ Name │ │ Name │ │ Name │ │ Name │
│ (42) │ │ (38) │ │ (25) │ │ (31) │ │ (19) │ │ (56) │
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘

Desktop: 6 cols | Tablet: 3 cols | Mobile: 2 cols
```

### 3.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/home/featured-categories.tsx
// ============================================================
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';
import type { Category } from '@/types';

interface FeaturedCategoriesProps {
  categories: Category[];
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6">
      {/* Section header */}
      <div className="mb-8 text-center">
        <h2 className="text-h2 font-bold text-foreground mb-2">
          Danh muc noi bat
        </h2>
        <p className="text-body text-muted-foreground max-w-2xl mx-auto">
          Kham pha cac dong san pham noi that da dang, tu phong ngu den phong khach
        </p>
      </div>

      {/* Category grid */}
      <StaggerContainer
        className="grid grid-cols-2 gap-4
                   sm:grid-cols-3
                   lg:grid-cols-6 lg:gap-6"
      >
        {categories.slice(0, 6).map((cat) => (
          <StaggerItem key={cat._id}>
            <Link
              href={`/categories/${cat.slug}`}
              className="group block rounded-xl overflow-hidden bg-white
                         shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Category image */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={cat.image || '/images/placeholder.webp'}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500
                             group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10
                                transition-colors duration-300" />
              </div>

              {/* Category info */}
              <div className="p-3 text-center">
                <h3 className="text-body-sm font-semibold text-foreground
                               group-hover:text-primary-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-caption text-muted-foreground mt-0.5">
                  {cat.productCount} san pham
                </p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
```

---

## 4. BestSellers

> File: `apps/fe/src/components/customer/home/best-sellers.tsx`
> Section "San pham ban chay".
> Desktop: 4-col grid. Mobile: horizontal scroll.

### 4.1 Cau truc

```
     San pham ban chay                    [Xem tat ca →]
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Product  │ │ Product  │ │ Product  │ │ Product  │
│  Card 1  │ │  Card 2  │ │  Card 3  │ │  Card 4  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Product  │ │ Product  │ │ Product  │ │ Product  │
│  Card 5  │ │  Card 6  │ │  Card 7  │ │  Card 8  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

Desktop: 4-col grid (2 rows x 4)
Tablet: 3-col grid
Mobile: horizontal scroll (snap)
```

### 4.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/home/best-sellers.tsx
// ============================================================
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { ProductCard } from '@/components/customer/product-card';
import type { Product } from '@/types';

interface BestSellersProps {
  products: Product[];
}

export function BestSellers({ products }: BestSellersProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6">
      {/* Section header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-bold text-foreground">
            San pham ban chay
          </h2>
          <p className="text-body text-muted-foreground mt-1">
            Nhung san pham duoc yeu thich nhat
          </p>
        </div>
        <Link
          href="/products?sort=bestSeller"
          className="hidden sm:flex items-center gap-1 text-body-sm font-medium
                     text-primary-500 hover:text-primary-600 transition-colors"
        >
          Xem tat ca
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* === Desktop/Tablet: Grid | Mobile: Horizontal scroll === */}

      {/* Desktop grid (an tren mobile) */}
      <StaggerContainer
        className="hidden sm:grid grid-cols-2 gap-4
                   md:grid-cols-3
                   lg:grid-cols-4 lg:gap-6"
      >
        {products.slice(0, 8).map((product) => (
          <StaggerItem key={product._id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Mobile horizontal scroll */}
      <div className="sm:hidden -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
                        scrollbar-hide">
          {products.slice(0, 8).map((product) => (
            <div
              key={product._id}
              className="flex-shrink-0 w-[70vw] max-w-[280px] snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile "Xem tat ca" link */}
      <div className="sm:hidden mt-4 text-center">
        <Link
          href="/products?sort=bestSeller"
          className="inline-flex items-center gap-1 text-body-sm font-medium
                     text-primary-500 hover:text-primary-600"
        >
          Xem tat ca san pham ban chay
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
```

---

## 5. NewArrivals

> File: `apps/fe/src/components/customer/home/new-arrivals.tsx`
> Section "San pham moi" - tuong tu BestSellers nhung 4-col grid ca desktop va tablet.

### 5.1 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/home/new-arrivals.tsx
// ============================================================
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { ProductCard } from '@/components/customer/product-card';
import type { Product } from '@/types';

interface NewArrivalsProps {
  products: Product[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6">
      {/* Section header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-bold text-foreground">
            San pham moi
          </h2>
          <p className="text-body text-muted-foreground mt-1">
            Nhung thiet ke moi nhat vua cap ben
          </p>
        </div>
        <Link
          href="/products?sort=newest"
          className="hidden sm:flex items-center gap-1 text-body-sm font-medium
                     text-primary-500 hover:text-primary-600 transition-colors"
        >
          Xem tat ca
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Product grid */}
      <StaggerContainer
        className="grid grid-cols-2 gap-4
                   md:grid-cols-3
                   lg:grid-cols-4 lg:gap-6"
      >
        {products.slice(0, 8).map((product) => (
          <StaggerItem key={product._id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Mobile "Xem tat ca" */}
      <div className="sm:hidden mt-6 text-center">
        <Link
          href="/products?sort=newest"
          className="inline-flex items-center gap-1 text-body-sm font-medium
                     text-primary-500 hover:text-primary-600"
        >
          Xem tat ca san pham moi
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
```

---

## 6. ComboShowcase

> File: `apps/fe/src/components/customer/home/combo-showcase.tsx`
> Section "Combo noi that" tren nen toi (primary-900).
> Large cards voi room images, ten combo, khoang gia, CTA.

### 6.1 Cau truc

```
          Combo noi that
   Tiet kiem hon khi mua tron bo

┌─────────────────┐ ┌─────────────────┐
│                  │ │                  │
│  [Room Image]    │ │  [Room Image]    │
│                  │ │                  │
│  Phong ngu       │ │  Phong khach     │
│  Tu 15.000.000₫  │ │  Tu 25.000.000₫  │
│  [Xem combo →]   │ │  [Xem combo →]   │
└─────────────────┘ └─────────────────┘
┌─────────────────┐ ┌─────────────────┐
│  [Room Image]    │ │  [Room Image]    │
│  Phong bep       │ │  Van phong       │
│  Tu 8.000.000₫   │ │  Tu 12.000.000₫  │
│  [Xem combo →]   │ │  [Xem combo →]   │
└─────────────────┘ └─────────────────┘

Desktop: 2 cols (large cards) | Mobile: 1 col
```

### 6.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/home/combo-showcase.tsx
// ============================================================
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ComboCategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  minPrice: number; // Gia combo thap nhat trong danh muc nay
  comboCount: number;
}

interface ComboShowcaseProps {
  categories: ComboCategory[];
}

export function ComboShowcase({ categories }: ComboShowcaseProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6">
      {/* Section header */}
      <div className="mb-8 text-center">
        <h2 className="text-h2 font-bold text-white mb-2">
          Combo noi that
        </h2>
        <p className="text-body text-primary-200 max-w-2xl mx-auto">
          Tiet kiem hon khi mua tron bo. Moi combo duoc thiet ke dong bo, phoi mau hai hoa.
        </p>
      </div>

      {/* Combo cards grid */}
      <StaggerContainer
        className="grid grid-cols-1 gap-6
                   md:grid-cols-2"
      >
        {categories.map((combo) => (
          <StaggerItem key={combo._id}>
            <Link
              href={`/combo/${combo.slug}`}
              className="group block rounded-xl overflow-hidden bg-primary-800/50
                         border border-primary-700 hover:border-accent-300/50
                         transition-all duration-300"
            >
              {/* Room image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={combo.image}
                  alt={combo.name}
                  fill
                  className="object-cover transition-transform duration-700
                             group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80
                                via-transparent to-transparent" />

                {/* Combo count badge */}
                <div className="absolute top-4 right-4 rounded-full bg-accent-300
                                px-3 py-1 text-caption font-semibold text-primary-900">
                  {combo.comboCount} combo
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-h4 font-semibold text-white
                               group-hover:text-accent-300 transition-colors">
                  {combo.name}
                </h3>
                {combo.description && (
                  <p className="text-body-sm text-primary-300 mt-1 line-clamp-2">
                    {combo.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-body-sm text-primary-200">
                    Tu{' '}
                    <span className="text-h5 font-bold text-accent-300">
                      {formatCurrency(combo.minPrice)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-body-sm font-medium
                                   text-accent-300 group-hover:translate-x-1 transition-transform">
                    Xem combo
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* View all combos */}
      <div className="mt-8 text-center">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-accent-300 text-accent-300 hover:bg-accent-300
                     hover:text-primary-900"
        >
          <Link href="/combo">
            Xem tat ca combo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## 7. WhyChooseUs

> File: `apps/fe/src/components/customer/home/why-choose-us.tsx`
> 4 feature cards + stats counter.
> AnimatedCounter cho so lieu thong ke.

### 7.1 Cau truc

```
          Tai sao chon chung toi?

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  [Icon]  │ │  [Icon]  │ │  [Icon]  │ │  [Icon]  │
│ Giao hang│ │Chat luong│ │ Doi tra  │ │ Ho tro   │
│ tan noi  │ │dam bao   │ │ de dang  │ │ 24/7     │
│ Mo ta... │ │ Mo ta... │ │ Mo ta... │ │ Mo ta... │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

   10,000+         500+          99%          24/7
  Khach hang    San pham     Hai long      Ho tro
```

### 7.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/home/why-choose-us.tsx
// ============================================================
'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/animations';

// ----- Feature data -----
const FEATURES = [
  {
    icon: Truck,
    title: 'Giao hang tan noi',
    description: 'Giao hang mien phi noi thanh. Van chuyen can than, lap dat tai nha.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ShieldCheck,
    title: 'Chat luong dam bao',
    description: 'San pham go tu nhien, kiem dinh chat luong. Bao hanh tu 12-24 thang.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: RefreshCw,
    title: 'Doi tra de dang',
    description: 'Doi tra trong 30 ngay neu san pham loi. Hoan tien nhanh chong.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Headphones,
    title: 'Ho tro 24/7',
    description: 'Doi ngu tu van nhiet tinh, san sang ho tro ban moi luc moi noi.',
    color: 'bg-purple-50 text-purple-600',
  },
] as const;

// ----- Stats data -----
const STATS = [
  { value: 10000, suffix: '+', label: 'Khach hang' },
  { value: 500, suffix: '+', label: 'San pham' },
  { value: 99, suffix: '%', label: 'Hai long' },
  { value: 24, suffix: '/7', label: 'Ho tro' },
] as const;

// ----- AnimatedCounter component -----
function AnimatedCounter({
  value,
  suffix,
  duration = 2,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const tick = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);

      // Easing function: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));

      if (now < endTime) {
        requestAnimationFrame(tick);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(tick);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString('vi-VN')}
      {suffix}
    </span>
  );
}

export function WhyChooseUs() {
  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6">
      {/* Section header */}
      <div className="mb-10 text-center">
        <h2 className="text-h2 font-bold text-foreground mb-2">
          Tai sao chon chung toi?
        </h2>
        <p className="text-body text-muted-foreground max-w-2xl mx-auto">
          Noi That Viet cam ket mang den trai nghiem mua sam noi that tot nhat cho ban
        </p>
      </div>

      {/* Feature cards */}
      <StaggerContainer
        className="grid grid-cols-1 gap-6
                   sm:grid-cols-2
                   lg:grid-cols-4"
      >
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.title}>
            <div className="rounded-xl bg-white p-6 shadow-card text-center
                            hover:shadow-card-hover transition-shadow duration-300">
              {/* Icon */}
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center
                            rounded-xl ${feature.color}`}
              >
                <feature.icon className="h-7 w-7" />
              </div>

              {/* Title */}
              <h3 className="text-h5 font-semibold text-foreground mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-body-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Stats counter */}
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-display font-bold text-primary-500">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-body-sm text-muted-foreground mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. ProductCard (Reusable)

> File: `apps/fe/src/components/customer/product-card.tsx`
> Component reusable cho tat ca trang hien thi san pham (home, listing, search, etc.).
> Bao gom: image hover, wishlist, add to cart, compare, price format.

### 8.1 Cau truc

```
┌──────────────────────────┐
│ [♡]            [Category]│ ← Wishlist (top-left), Badge (top-right)
│                          │
│      [Product Image]     │ ← Hover → show second image
│                          │
│   [Them vao gio]         │ ← Hien khi hover (desktop)
├──────────────────────────┤
│  Ten san pham (max 2     │
│  dong, truncate)         │
│                          │
│  ★★★★☆ (4.2) - 12       │ ← Rating + review count
│                          │
│  1.200.000₫              │ ← Gia (VND format)
│  ~~1.500.000₫~~ -20%    │ ← Gia goc (neu co giam gia)
│                          │
│  [☐ So sanh]             │ ← Compare checkbox
└──────────────────────────┘
```

### 8.2 Code

```tsx
// ============================================================
// apps/fe/src/components/customer/product-card.tsx
// ============================================================
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/use-cart-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import { useComparisonStore } from '@/stores/use-comparison-store';
import { useAuthStore } from '@/stores/use-auth-store';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HoverLift } from '@/components/ui/animations';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addProduct, removeProduct, isInComparison } = useComparisonStore();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const isWished = isInWishlist(product._id);
  const isComparing = isInComparison(product._id);

  // ----- Tinh gia hien thi -----
  // Lay variant re nhat (minPrice) va variant co gia goc (neu co giam gia)
  const displayPrice = product.minPrice;
  const originalPrice = product.maxOriginalPrice;
  const hasDiscount = originalPrice && originalPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  // ----- Xu ly them vao gio hang -----
  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Them variant dau tien (default)
      if (product.variants && product.variants.length > 0) {
        const defaultVariant = product.variants[0];
        addItem(
          {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            thumbnail: product.thumbnail,
          },
          defaultVariant,
        );
        toast({
          title: 'Da them vao gio hang',
          description: product.name,
        });
      } else {
        // Khong co variant -> chuyen den trang chi tiet
        toast({
          title: 'Vui long chon phien ban san pham',
          description: 'Chuyen den trang chi tiet de chon mau va kich thuoc.',
        });
      }
    },
    [product, addItem, toast],
  );

  // ----- Xu ly wishlist -----
  const handleToggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) {
        toast({
          title: 'Vui long dang nhap',
          description: 'Ban can dang nhap de them san pham vao danh sach yeu thich.',
          variant: 'destructive',
        });
        return;
      }

      toggleWishlist(product._id);
      toast({
        title: isWished
          ? 'Da xoa khoi yeu thich'
          : 'Da them vao yeu thich',
        description: product.name,
      });
    },
    [product, isAuthenticated, isWished, toggleWishlist, toast],
  );

  // ----- Xu ly compare -----
  const handleToggleCompare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isComparing) {
        removeProduct(product._id);
      } else {
        const added = addProduct(product);
        if (!added) {
          toast({
            title: 'Toi da 4 san pham',
            description: 'Ban chi co the so sanh toi da 4 san pham cung luc.',
            variant: 'destructive',
          });
        }
      }
    },
    [product, isComparing, addProduct, removeProduct, toast],
  );

  // ----- Images -----
  const primaryImage = product.thumbnail || '/images/placeholder.webp';
  const secondaryImage = product.images?.[1] || primaryImage;

  return (
    <HoverLift className={cn('h-full', className)}>
      <div
        className="group relative flex h-full flex-col rounded-xl bg-white
                   shadow-card overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ===== IMAGE SECTION ===== */}
        <Link
          href={`/products/${product.slug}`}
          className="relative aspect-square overflow-hidden"
        >
          {/* Primary image */}
          <Image
            src={imageError ? '/images/placeholder.webp' : primaryImage}
            alt={product.name}
            fill
            className={cn(
              'object-cover transition-opacity duration-500',
              isHovered ? 'opacity-0' : 'opacity-100',
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />

          {/* Secondary image (show on hover) */}
          <Image
            src={secondaryImage}
            alt={`${product.name} - Anh 2`}
            fill
            className={cn(
              'object-cover transition-opacity duration-500',
              isHovered ? 'opacity-100' : 'opacity-0',
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Discount badge */}
          {hasDiscount && discountPercent > 0 && (
            <div className="absolute top-2 left-2 rounded-md bg-danger-500 px-2 py-0.5
                            text-caption font-bold text-white">
              -{discountPercent}%
            </div>
          )}

          {/* Category badge */}
          {product.category && (
            <div className="absolute top-2 right-2 rounded-md bg-white/90 px-2 py-0.5
                            text-caption font-medium text-foreground backdrop-blur-sm">
              {product.category.name}
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center',
              'rounded-full bg-white/90 backdrop-blur-sm shadow-sm',
              'transition-all duration-200 hover:scale-110',
              hasDiscount ? 'top-10' : 'top-2', // Dich xuong neu co discount badge
              isWished
                ? 'text-danger-500'
                : 'text-muted-foreground hover:text-danger-500',
            )}
            aria-label={isWished ? 'Xoa khoi yeu thich' : 'Them vao yeu thich'}
          >
            <Heart
              className="h-4 w-4"
              fill={isWished ? 'currentColor' : 'none'}
            />
          </button>

          {/* Add to cart overlay (desktop hover) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10,
            }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t
                       from-black/50 to-transparent
                       hidden sm:block"
          >
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="w-full bg-white text-foreground hover:bg-primary-500
                         hover:text-white font-medium"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Them vao gio
            </Button>
          </motion.div>
        </Link>

        {/* ===== INFO SECTION ===== */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          {/* Product name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-body-sm sm:text-body font-medium text-foreground
                           line-clamp-2 hover:text-primary-500 transition-colors
                           min-h-[2.5rem] sm:min-h-[3rem]">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i < Math.round(product.averageRating)
                        ? 'text-warning-500 fill-warning-500'
                        : 'text-surface-400',
                    )}
                  />
                ))}
              </div>
              <span className="text-caption text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-body sm:text-h5 font-bold text-primary-500">
              {formatCurrency(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-caption text-muted-foreground line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          {/* Compare checkbox + Mobile add-to-cart */}
          <div className="mt-auto pt-3 flex items-center justify-between">
            {/* Compare */}
            <label
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isComparing}
                onCheckedChange={() =>
                  handleToggleCompare({
                    preventDefault: () => {},
                    stopPropagation: () => {},
                  } as React.MouseEvent)
                }
                className="h-4 w-4"
              />
              <span className="text-caption text-muted-foreground">
                So sanh
              </span>
            </label>

            {/* Mobile add to cart button */}
            <button
              onClick={handleAddToCart}
              className="sm:hidden flex items-center gap-1 rounded-md bg-primary-50
                         px-2 py-1 text-caption font-medium text-primary-500
                         hover:bg-primary-100 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Them
            </button>
          </div>
        </div>
      </div>
    </HoverLift>
  );
}
```

### 8.3 Ket noi API / Stores

| Thanh phan | Store | Muc dich |
|---|---|---|
| Add to cart | `useCartStore.addItem()` | Them san pham (variant dau tien) vao gio |
| Wishlist | `useWishlistStore.toggleWishlist()` | Them/xoa yeu thich |
| Compare | `useComparisonStore.addProduct()` / `removeProduct()` | Them/xoa so sanh |
| Auth check | `useAuthStore.isAuthenticated` | Kiem tra dang nhap truoc khi wishlist |
| Toast | `useToast()` | Hien thi thong bao hanh dong |

### 8.4 Responsive Behavior

| Breakpoint | Thay doi |
|---|---|
| Default (<640px) | Name: `text-body-sm`, Price: `text-body`, "Them" button thay vi overlay, 2 cols |
| `sm` (640px+) | Name: `text-body`, Price: `text-h5`, hover overlay add-to-cart, 2-3 cols |
| `lg` (1024px+) | 4 cols, larger spacing |

### 8.5 Animation

| Effect | Trigger | Config |
|---|---|---|
| `HoverLift` | Mouse hover | `y: -4, shadow: card-hover`, spring transition |
| Image swap | Mouse hover | `opacity: 0 ↔ 1`, 500ms duration |
| Add-to-cart overlay | Mouse hover | `opacity + y: 10 → 0`, 200ms |
| Wishlist heart scale | Click | `scale: 1 → 1.1 → 1`, CSS `hover:scale-110` |

---

## 9. Responsive & Animation Summary

### 9.1 Page Section Breakpoints

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| HeroBanner | 40vh, text-h1 | 50vh | 60vh, text-display |
| FeaturedCategories | 2 cols | 3 cols | 6 cols |
| BestSellers | Horizontal scroll | 3-col grid | 4-col grid (2 rows) |
| NewArrivals | 2 cols | 3 cols | 4 cols |
| ComboShowcase | 1 col | 2 cols | 2 cols (large) |
| WhyChooseUs | 1 col features, 2 col stats | 2 cols both | 4 cols both |
| ProductCard | Compact, text nho, "Them" button | Medium | Full, hover overlay |

### 9.2 Animation Summary

| Component | Animation Type | Library |
|---|---|---|
| HeroBanner slides | Slide left/right + fade | Framer Motion `AnimatePresence` |
| Banner text | Stagger fade up | Framer Motion `variants` |
| Auto-play | `setInterval` + pause on hover | React `useEffect` |
| FeaturedCategories | Stagger on scroll | `StaggerContainer` + `useInView` |
| Category cards | Scale + shadow on hover | CSS `group-hover:scale-110` |
| BestSellers / NewArrivals | Stagger on scroll | `StaggerContainer` |
| ProductCard | HoverLift (y: -4) | Framer Motion |
| ComboShowcase cards | Stagger on scroll | `StaggerContainer` |
| Room images | Slow zoom on hover | CSS `group-hover:scale-105` + 700ms |
| WhyChooseUs | Stagger on scroll | `StaggerContainer` |
| AnimatedCounter | Count up on scroll | `requestAnimationFrame` + `useInView` |

### 9.3 Data Flow

```
Server (SSR)
  │
  ├─ bannerService.getActiveBanners()     → HeroBanner (props)
  ├─ categoryService.getFeaturedCategories() → FeaturedCategories (props)
  ├─ productService.getBestSellers()       → BestSellers (props)
  ├─ productService.getNewArrivals()       → NewArrivals (props)
  └─ categoryService.getComboCategories()  → ComboShowcase (props)
                                            ↓
                                      Client Components
                                            │
                                      ├─ useCartStore (add to cart)
                                      ├─ useWishlistStore (toggle wishlist)
                                      ├─ useComparisonStore (toggle compare)
                                      └─ useToast (notifications)
```

---

> **Lien ket tai lieu:**
> - Layout & Navigation: `04-frontend/04-customer-layout.md`
> - Types: `04-frontend/01-shared-types.md`
> - API Client & Stores: `04-frontend/02-shared-api-client.md`
> - UI Components: `04-frontend/03-shared-ui-components.md`
> - Tiep theo: `04-frontend/06-customer-products.md` (Products & Comparison)
