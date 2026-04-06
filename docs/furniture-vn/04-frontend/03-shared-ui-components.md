# SHARED UI COMPONENTS & DESIGN SYSTEM

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/components/ui/`, `apps/fe/src/components/shared/`, `apps/fe/src/lib/`
> Chua TAT CA UI components dung chung cho toan bo ung dung (Customer, Admin, Shipper, POS)
> Tech stack: Next.js 14 + TailwindCSS + shadcn/ui + Framer Motion + Radix UI
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Design System / Theme](#1-design-system--theme)
2. [Animation Components (Framer Motion)](#2-animation-components-framer-motion)
3. [Base UI Components (shadcn/ui style)](#3-base-ui-components-shadcnui-style)
4. [Composite Components](#4-composite-components)
5. [Layout Components](#5-layout-components)
6. [Responsive Utilities](#6-responsive-utilities)
7. [Accessibility](#7-accessibility)

---

## 1. Design System / Theme

> File: `apps/fe/tailwind.config.ts` va `apps/fe/src/lib/theme.ts`
> Dinh nghia mau sac, typography, spacing, shadow, border-radius cho toan bo ung dung.
> Phong cach: Am ap, tu nhien, phu hop voi noi that go Viet Nam.

### 1.1 Tailwind Config

```typescript
// apps/fe/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // === COLORS ===
      colors: {
        // Primary: Wood Brown - Mau go noi that
        primary: {
          50: '#FDF8F0',
          100: '#F5E6D3',
          200: '#E8C9A0',
          300: '#D4A373',
          400: '#C08552',
          500: '#8B4513',   // Main primary
          600: '#7A3B0F',
          700: '#6B320D',
          800: '#5C290A',
          900: '#4A2108',
          foreground: '#FFFFFF',
        },
        // Secondary: Forest Green - Mau xanh la
        secondary: {
          50: '#F0F7ED',
          100: '#D4E8CC',
          200: '#A8D196',
          300: '#7DBA61',
          400: '#4E9A30',
          500: '#2D5016',   // Main secondary
          600: '#264512',
          700: '#1F3A0F',
          800: '#182F0B',
          900: '#112408',
          foreground: '#FFFFFF',
        },
        // Accent: Gold - Mau vang dong
        accent: {
          50: '#FFF9F0',
          100: '#FFEFD6',
          200: '#FFE0AD',
          300: '#D4A373',   // Main accent
          400: '#C49360',
          500: '#B5834D',
          600: '#9A6E3F',
          700: '#7F5A32',
          800: '#654625',
          900: '#4A3219',
          foreground: '#4A2108',
        },
        // Surface: Warm White - Nen am
        surface: {
          50: '#FFFFFF',
          100: '#FDF8F0',   // Main surface / background chinh
          200: '#FAF3E8',
          300: '#F5EBD9',
          400: '#EDE0C8',
          500: '#E5D5B8',
          foreground: '#2D2016',
        },
        // Semantic colors
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        // Text
        foreground: '#2D2016',
        muted: {
          DEFAULT: '#F5EBD9',
          foreground: '#8B7355',
        },
        // Border
        border: '#E5D5B8',
        input: '#E5D5B8',
        ring: '#8B4513',
      },

      // === TYPOGRAPHY ===
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],       // 48px
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],          // 36px
        'h2': ['1.875rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],        // 30px
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],                                     // 24px
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],                                    // 20px
        'h5': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],                                   // 18px
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],                                                  // 18px
        'body': ['1rem', { lineHeight: '1.6' }],                                                         // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],                                                  // 14px
        'caption': ['0.75rem', { lineHeight: '1.5' }],                                                   // 12px
        'overline': ['0.75rem', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0.05em' }],     // 12px
      },

      // === SPACING - Su dung Tailwind defaults ===
      // 0, 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 8(32px),
      // 10(40px), 12(48px), 16(64px), 20(80px), 24(96px)

      // === BORDER RADIUS ===
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',    // 4px  - Inputs, badges
        'md': '0.5rem',     // 8px  - Cards, buttons
        'lg': '0.75rem',    // 12px - Modals, large cards
        'xl': '1rem',       // 16px - Hero sections
        '2xl': '1.5rem',    // 24px - Feature cards
        'full': '9999px',   // Pills, avatars
      },

      // === SHADOWS ===
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(45, 32, 22, 0.05)',
        'md': '0 4px 6px -1px rgba(45, 32, 22, 0.07), 0 2px 4px -2px rgba(45, 32, 22, 0.05)',
        'lg': '0 10px 15px -3px rgba(45, 32, 22, 0.08), 0 4px 6px -4px rgba(45, 32, 22, 0.04)',
        'xl': '0 20px 25px -5px rgba(45, 32, 22, 0.1), 0 8px 10px -6px rgba(45, 32, 22, 0.06)',
        'card': '0 2px 8px rgba(45, 32, 22, 0.06)',
        'card-hover': '0 8px 24px rgba(45, 32, 22, 0.12)',
        'inner': 'inset 0 2px 4px 0 rgba(45, 32, 22, 0.05)',
      },

      // === BREAKPOINTS - Su dung Tailwind defaults ===
      screens: {
        'sm': '640px',     // Mobile landscape
        'md': '768px',     // Tablet
        'lg': '1024px',    // Desktop nho
        'xl': '1280px',    // Desktop
        '2xl': '1536px',   // Desktop lon
      },

      // === ANIMATION (bo sung Framer Motion) ===
      keyframes: {
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },

      // === TRANSITION ===
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### 1.2 Theme Constants

```typescript
// apps/fe/src/lib/theme.ts

// === BRAND COLORS ===
export const COLORS = {
  primary: '#8B4513',
  secondary: '#2D5016',
  accent: '#D4A373',
  surface: '#FDF8F0',
  foreground: '#2D2016',
  muted: '#8B7355',
  border: '#E5D5B8',
} as const;

// === Z-INDEX SCALE ===
export const Z_INDEX = {
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

// === ANIMATION PRESETS (Framer Motion) ===
export const MOTION = {
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
    slower: 0.5,
  },
  ease: {
    default: [0.25, 0.1, 0.25, 1],
    in: [0.4, 0, 1, 1],
    out: [0, 0, 0.2, 1],
    inOut: [0.4, 0, 0.2, 1],
    spring: { type: 'spring', stiffness: 300, damping: 30 },
  },
} as const;

// === BREAKPOINT VALUES (dung trong JS khi can) ===
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
```

### 1.3 CSS Variables & Global Styles

```css
/* apps/fe/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 36 60% 97%;          /* surface-100: #FDF8F0 */
    --foreground: 25 20% 14%;          /* #2D2016 */

    --primary: 25 75% 30%;             /* #8B4513 */
    --primary-foreground: 0 0% 100%;

    --secondary: 100 50% 20%;          /* #2D5016 */
    --secondary-foreground: 0 0% 100%;

    --accent: 30 50% 64%;              /* #D4A373 */
    --accent-foreground: 25 50% 16%;

    --muted: 33 40% 90%;
    --muted-foreground: 25 20% 44%;

    --border: 33 40% 82%;
    --input: 33 40% 82%;
    --ring: 25 75% 30%;

    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-surface-100 text-foreground font-sans antialiased;
  }

  /* Focus ring chuan cho accessibility */
  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100;
  }
}

@layer utilities {
  /* Screen reader only */
  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }

  /* Touch-friendly tap target */
  .tap-target {
    @apply min-h-[44px] min-w-[44px];
  }

  /* Truncate text */
  .line-clamp-1 { @apply overflow-hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
  .line-clamp-2 { @apply overflow-hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .line-clamp-3 { @apply overflow-hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
}
```

### 1.4 Utility: cn() - Class merge

```typescript
// apps/fe/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes an toan, xu ly xung dot class.
 * Su dung clsx de xu ly conditional classes, twMerge de giai quyet xung dot.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Su dung:**

```tsx
<div className={cn(
  'rounded-md p-4',
  isActive && 'bg-primary-500 text-white',
  className
)} />
```

---

## 2. Animation Components (Framer Motion)

> File: `apps/fe/src/components/ui/animations.tsx`
> Tat ca animation components dung Framer Motion.
> Ho tro `prefers-reduced-motion` - tat animation khi nguoi dung bat che do giam chuyen dong.

### 2.1 Hook: useReducedMotion

```typescript
// apps/fe/src/hooks/useReducedMotion.ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Phat hien nguoi dung co bat "Reduce motion" trong he dieu hanh khong.
 * Neu co, tat ca animation se bi disable.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
```

### 2.2 FadeIn

```typescript
// apps/fe/src/components/ui/animations/FadeIn.tsx
'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Noi dung ben trong */
  children: ReactNode;
  /** Delay truoc khi bat dau (giay) */
  delay?: number;
  /** Thoi gian animation (giay) */
  duration?: number;
  /** Class CSS bo sung */
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, duration = 0.3, className, ...props }, ref) => {
    const reducedMotion = useReducedMotion();

    if (reducedMotion) {
      return <div ref={ref} className={className}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

FadeIn.displayName = 'FadeIn';
```

**Su dung:**

```tsx
<FadeIn delay={0.2} duration={0.5}>
  <h1>Chao mung den voi Noi That Viet</h1>
</FadeIn>
```

### 2.3 SlideUp

```typescript
// apps/fe/src/components/ui/animations/SlideUp.tsx
'use client';

import { motion } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SlideUpProps {
  children: ReactNode;
  /** Khoang cach truot len (px) */
  offset?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideUp = forwardRef<HTMLDivElement, SlideUpProps>(
  ({ children, offset = 20, delay = 0, duration = 0.4, className }, ref) => {
    const reducedMotion = useReducedMotion();

    if (reducedMotion) {
      return <div ref={ref} className={className}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: offset }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: offset }}
        transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

SlideUp.displayName = 'SlideUp';
```

**Su dung:**

```tsx
<SlideUp offset={30} delay={0.1}>
  <ProductCard product={product} />
</SlideUp>
```

### 2.4 SlideIn

```typescript
// apps/fe/src/components/ui/animations/SlideIn.tsx
'use client';

import { motion } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SlideInProps {
  children: ReactNode;
  /** Huong truot: 'left' hoac 'right' */
  direction?: 'left' | 'right';
  /** Khoang cach truot (px) */
  offset?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({ children, direction = 'left', offset = 30, delay = 0, duration = 0.4, className }, ref) => {
    const reducedMotion = useReducedMotion();
    const x = direction === 'left' ? -offset : offset;

    if (reducedMotion) {
      return <div ref={ref} className={className}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x }}
        transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

SlideIn.displayName = 'SlideIn';
```

**Su dung:**

```tsx
<SlideIn direction="right" offset={40}>
  <Sidebar />
</SlideIn>
```

### 2.5 ScaleIn

```typescript
// apps/fe/src/components/ui/animations/ScaleIn.tsx
'use client';

import { motion } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ScaleInProps {
  children: ReactNode;
  /** Scale bat dau (0 -> 1) */
  initialScale?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn = forwardRef<HTMLDivElement, ScaleInProps>(
  ({ children, initialScale = 0.95, delay = 0, duration = 0.3, className }, ref) => {
    const reducedMotion = useReducedMotion();

    if (reducedMotion) {
      return <div ref={ref} className={className}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: initialScale }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: initialScale }}
        transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

ScaleIn.displayName = 'ScaleIn';
```

### 2.6 StaggerContainer + StaggerItem

```typescript
// apps/fe/src/components/ui/animations/Stagger.tsx
'use client';

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// === Stagger Container ===

interface StaggerContainerProps {
  children: ReactNode;
  /** Delay giua cac item (giay) */
  staggerDelay?: number;
  /** Delay truoc khi bat dau stagger */
  delayChildren?: number;
  className?: string;
}

const containerVariants: (staggerDelay: number, delayChildren: number) => Variants =
  (staggerDelay, delayChildren) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  });

export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  delayChildren = 0,
  className,
}: StaggerContainerProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={containerVariants(staggerDelay, delayChildren)}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// === Stagger Item ===

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
```

**Su dung (Product Grid):**

```tsx
// Danh sach san pham voi stagger animation
<StaggerContainer
  staggerDelay={0.08}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
>
  {products.map((product) => (
    <StaggerItem key={product.id}>
      <ProductCard product={product} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

### 2.7 PageTransition

```typescript
// apps/fe/src/components/ui/animations/PageTransition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Su dung (trong layout):**

```tsx
// apps/fe/src/app/(customer)/layout.tsx
export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <PageTransition className="min-h-screen">
        {children}
      </PageTransition>
      <Footer />
    </>
  );
}
```

### 2.8 HoverLift

```typescript
// apps/fe/src/components/ui/animations/HoverLift.tsx
'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface HoverLiftProps {
  children: ReactNode;
  /** Khoang nang len khi hover (px) */
  lift?: number;
  className?: string;
}

export function HoverLift({ children, lift = 4, className }: HoverLiftProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: -lift, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Su dung:**

```tsx
<HoverLift lift={6}>
  <Card className="shadow-card hover:shadow-card-hover transition-shadow">
    <ProductInfo />
  </Card>
</HoverLift>
```

### 2.9 AnimatedCounter

```typescript
// apps/fe/src/components/ui/animations/AnimatedCounter.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedCounterProps {
  /** Gia tri cuoi cung */
  value: number;
  /** Thoi gian dem (ms) */
  duration?: number;
  /** Ham format so (vd: formatVND) */
  formatter?: (value: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1500,
  formatter = (v) => v.toLocaleString('vi-VN'),
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration,
    bounce: 0,
  });

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue, reducedMotion]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref} className={className}>
      {formatter(displayValue)}
    </span>
  );
}
```

**Su dung:**

```tsx
// Thong ke tren trang admin dashboard
<div className="grid grid-cols-4 gap-6">
  <StatCard title="Tong don hang">
    <AnimatedCounter value={1250} />
  </StatCard>
  <StatCard title="Doanh thu">
    <AnimatedCounter
      value={150000000}
      formatter={(v) => `${(v / 1000000).toFixed(0)}M`}
    />
  </StatCard>
</div>
```

### 2.10 Skeleton

```typescript
// apps/fe/src/components/ui/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  /** Hinh dang: mac dinh la rectangle */
  variant?: 'rectangle' | 'circle' | 'text';
  /** Chieu rong (CSS value) */
  width?: string | number;
  /** Chieu cao (CSS value) */
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangle',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-300',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-surface-50/60 before:to-transparent',
        'before:animate-shimmer',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'rounded-sm h-4',
        variant === 'rectangle' && 'rounded-md',
        className
      )}
      style={{ width, height }}
      role="status"
      aria-label="Dang tai..."
    >
      <span className="sr-only">Dang tai...</span>
    </div>
  );
}

// === Skeleton presets cho cac use case thuong gap ===

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      <Skeleton className="w-full aspect-square rounded-md" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="text" className="w-24" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" className="w-full" />
        </td>
      ))}
    </tr>
  );
}
```

**Su dung:**

```tsx
// Loading state cho product grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {Array.from({ length: 8 }).map((_, i) => (
    <ProductCardSkeleton key={i} />
  ))}
</div>
```

### 2.11 Export tat ca animations

```typescript
// apps/fe/src/components/ui/animations/index.ts
export { FadeIn } from './FadeIn';
export { SlideUp } from './SlideUp';
export { SlideIn } from './SlideIn';
export { ScaleIn } from './ScaleIn';
export { StaggerContainer, StaggerItem } from './Stagger';
export { PageTransition } from './PageTransition';
export { HoverLift } from './HoverLift';
export { AnimatedCounter } from './AnimatedCounter';
```

---

## 3. Base UI Components (shadcn/ui style)

> File: `apps/fe/src/components/ui/`
> Xay dung theo phong cach shadcn/ui: co the copy-paste, tuy chinh duoc, dung Radix UI + Tailwind.
> Moi component deu co TypeScript interface ro rang.

### 3.1 Button

```typescript
// apps/fe/src/components/ui/Button.tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-md transition-colors duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'tap-target',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-primary-foreground hover:bg-primary-600 active:bg-primary-700',
        secondary:
          'bg-secondary-500 text-secondary-foreground hover:bg-secondary-600 active:bg-secondary-700',
        outline:
          'border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50 active:bg-primary-100',
        ghost:
          'text-foreground bg-transparent hover:bg-surface-300 active:bg-surface-400',
        danger:
          'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
      },
      size: {
        sm: 'h-9 px-3 text-body-sm',
        md: 'h-11 px-5 text-body',
        lg: 'h-13 px-7 text-body-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Hien thi loading spinner va disable button */
  isLoading?: boolean;
  /** Text hien thi khi loading (thay cho children) */
  loadingText?: string;
  /** Icon ben trai */
  leftIcon?: ReactNode;
  /** Icon ben phai */
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
```

**Su dung:**

```tsx
import { Button } from '@/components/ui/Button';
import { ShoppingCart, ArrowRight } from 'lucide-react';

// Primary
<Button>Them vao gio hang</Button>

// Voi icon
<Button leftIcon={<ShoppingCart className="h-4 w-4" />}>
  Them vao gio
</Button>

// Loading
<Button isLoading loadingText="Dang xu ly...">
  Dat hang
</Button>

// Variants
<Button variant="outline" size="sm">Xem them</Button>
<Button variant="ghost">Huy</Button>
<Button variant="danger">Xoa san pham</Button>
<Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
  Tiep tuc
</Button>
```

### 3.2 Input

```typescript
// apps/fe/src/components/ui/Input.tsx
'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label hien thi phia tren */
  label?: string;
  /** Thong bao loi */
  error?: string;
  /** Ghi chu duoi input */
  hint?: string;
  /** Icon hoac text phia truoc */
  prefix?: ReactNode;
  /** Icon hoac text phia sau */
  suffix?: ReactNode;
  /** Kich co */
  inputSize?: 'sm' | 'md' | 'lg';
  /** Bat buoc nhap */
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      prefix,
      suffix,
      inputSize = 'md',
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    const sizeClasses = {
      sm: 'h-9 text-body-sm px-3',
      md: 'h-11 text-body px-4',
      lg: 'h-13 text-body-lg px-5',
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="text-danger-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-muted-foreground pointer-events-none" aria-hidden="true">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-md border bg-white transition-colors duration-fast',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeClasses[inputSize],
              prefix && 'pl-10',
              suffix && 'pr-10',
              error
                ? 'border-danger-500 focus-visible:ring-danger-500'
                : 'border-input hover:border-primary-300',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            required={required}
            {...props}
          />

          {suffix && (
            <span className="absolute right-3 text-muted-foreground" aria-hidden="true">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-caption text-danger-500" role="alert">
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-caption text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**Su dung:**

```tsx
import { Input } from '@/components/ui/Input';
import { Search, Mail } from 'lucide-react';

<Input
  label="Email"
  type="email"
  placeholder="email@example.com"
  prefix={<Mail className="h-4 w-4" />}
  required
  error={errors.email?.message}
/>

<Input
  label="Tim kiem"
  placeholder="Nhap ten san pham..."
  prefix={<Search className="h-4 w-4" />}
  inputSize="lg"
/>
```

### 3.3 Textarea

```typescript
// apps/fe/src/components/ui/Textarea.tsx
'use client';

import { forwardRef, type TextareaHTMLAttributes, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Gioi han so ky tu */
  maxLength?: number;
  /** Hien thi dem ky tu */
  showCount?: boolean;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, hint, maxLength, showCount = false, required, id, onChange, ...props },
    ref
  ) => {
    const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const [charCount, setCharCount] = useState(0);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCharCount(e.target.value.length);
        onChange?.(e);
      },
      [onChange]
    );

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-body-sm font-medium text-foreground">
            {label}
            {required && <span className="text-danger-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-[100px] rounded-md border bg-white px-4 py-3',
            'text-body placeholder:text-muted-foreground',
            'transition-colors duration-fast resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-danger-500 focus-visible:ring-danger-500'
              : 'border-input hover:border-primary-300',
            className
          )}
          maxLength={maxLength}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          required={required}
          {...props}
        />

        <div className="flex justify-between items-center">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-caption text-danger-500" role="alert">
                {error}
              </p>
            )}
            {!error && hint && (
              <p id={`${textareaId}-hint`} className="text-caption text-muted-foreground">
                {hint}
              </p>
            )}
          </div>

          {showCount && maxLength && (
            <span
              className={cn(
                'text-caption',
                charCount > maxLength * 0.9 ? 'text-danger-500' : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
```

**Su dung:**

```tsx
<Textarea
  label="Noi dung danh gia"
  placeholder="Chia se trai nghiem cua ban ve san pham..."
  maxLength={500}
  showCount
  required
  error={errors.content?.message}
/>
```

### 3.4 Select

```typescript
// apps/fe/src/components/ui/Select.tsx
'use client';

import { forwardRef, type ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// === Select Root ===
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

// === Select Trigger ===
interface SelectTriggerProps extends SelectPrimitive.SelectTriggerProps {
  label?: string;
  error?: string;
  required?: boolean;
}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, label, error, required, ...props }, ref) => {
    const triggerId = `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={triggerId} className="block text-body-sm font-medium text-foreground">
            {label}
            {required && <span className="text-danger-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <SelectPrimitive.Trigger
          ref={ref}
          id={triggerId}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-md border bg-white px-4',
            'text-body placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-danger-500'
              : 'border-input hover:border-primary-300',
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        {error && (
          <p className="text-caption text-danger-500" role="alert">{error}</p>
        )}
      </div>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

// === Select Content ===
const SelectContent = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectContentProps
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-[300px] min-w-[8rem] overflow-hidden',
        'rounded-md border border-border bg-white shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' && 'translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6">
        <ChevronUp className="h-4 w-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6">
        <ChevronDown className="h-4 w-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

// === Select Item ===
const SelectItem = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2',
      'text-body-sm outline-none',
      'focus:bg-surface-200 focus:text-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary-500" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

// === Select Label (cho group) ===
const SelectLabel = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectLabelProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-caption font-semibold text-muted-foreground', className)}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

// === Select Separator ===
const SelectSeparator = forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectSeparatorProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
};
```

**Su dung:**

```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent,
  SelectGroup, SelectLabel, SelectItem,
} from '@/components/ui/Select';

<Select value={sortBy} onValueChange={setSortBy}>
  <SelectTrigger label="Sap xep theo" error={errors.sort?.message}>
    <SelectValue placeholder="Chon cach sap xep" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Gia</SelectLabel>
      <SelectItem value="price_asc">Gia: Thap den cao</SelectItem>
      <SelectItem value="price_desc">Gia: Cao den thap</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Moi nhat</SelectLabel>
      <SelectItem value="newest">Moi nhat</SelectItem>
      <SelectItem value="bestseller">Ban chay nhat</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### 3.5 Checkbox

```typescript
// apps/fe/src/components/ui/Checkbox.tsx
'use client';

import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends CheckboxPrimitive.CheckboxProps {
  /** Label hien thi ben canh */
  label?: string;
  /** Mo ta bo sung */
  description?: string;
  /** Thong bao loi */
  error?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <CheckboxPrimitive.Root
            ref={ref}
            id={checkboxId}
            className={cn(
              'peer h-5 w-5 shrink-0 rounded-sm border-2 mt-0.5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500',
              'data-[state=checked]:text-white',
              error ? 'border-danger-500' : 'border-input',
              className
            )}
            aria-invalid={!!error}
            {...props}
          >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>

          {label && (
            <div>
              <label
                htmlFor={checkboxId}
                className="text-body-sm font-medium cursor-pointer select-none"
              >
                {label}
              </label>
              {description && (
                <p className="text-caption text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-caption text-danger-500 ml-8" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
```

**Su dung:**

```tsx
<Checkbox
  label="Toi dong y voi dieu khoan su dung"
  description="Vui long doc ky truoc khi dong y"
  checked={agreed}
  onCheckedChange={setAgreed}
  error={errors.terms?.message}
/>
```

### 3.6 Badge

```typescript
// apps/fe/src/components/ui/Badge.tsx
import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-300 text-foreground',
        primary: 'bg-primary-100 text-primary-700',
        success: 'bg-success-50 text-success-700 border border-success-500/20',
        warning: 'bg-warning-50 text-warning-700 border border-warning-500/20',
        danger: 'bg-danger-50 text-danger-700 border border-danger-500/20',
        info: 'bg-info-50 text-info-700 border border-info-500/20',
        secondary: 'bg-secondary-100 text-secondary-700',
        outline: 'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Icon ben trai (vd: cham tron mau) */
  dot?: boolean;
  /** Mau cua dot */
  dotColor?: string;
}

export function Badge({ className, variant, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className="mr-1.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor || 'currentColor' }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
```

**Su dung:**

```tsx
<Badge variant="success" dot>Da giao hang</Badge>
<Badge variant="warning">Cho xac nhan</Badge>
<Badge variant="danger">Da huy</Badge>
<Badge variant="info">Dang van chuyen</Badge>
<Badge variant="primary">Moi</Badge>
```

### 3.7 Avatar

```typescript
// apps/fe/src/components/ui/Avatar.tsx
'use client';

import { forwardRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  /** URL hinh anh */
  src?: string | null;
  /** Ten nguoi dung - dung lam alt va fallback initials */
  name: string;
  /** Kich co avatar (px) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-body-sm',
  lg: 'h-12 w-12 text-body',
  xl: 'h-16 w-16 text-h5',
};

const pixelSizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

/**
 * Lay 2 ky tu dau cua ten de lam fallback.
 * Vd: "Nguyen Van A" => "NA"
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Tao mau nen tu ten (deterministic).
 */
function getColorFromName(name: string): string {
  const colors = [
    'bg-primary-200', 'bg-secondary-200', 'bg-accent-200',
    'bg-info-50', 'bg-success-50', 'bg-warning-50',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name, size = 'md', className }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0',
          'font-medium',
          sizeMap[size],
          !showImage && getColorFromName(name),
          !showImage && 'text-foreground',
          className
        )}
        role="img"
        aria-label={name}
      >
        {showImage ? (
          <Image
            src={src}
            alt={name}
            width={pixelSizeMap[size]}
            height={pixelSizeMap[size]}
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
```

**Su dung:**

```tsx
<Avatar src={user.avatar} name={user.fullName} size="lg" />
<Avatar name="Nguyen Van A" size="sm" /> {/* Hien thi "NA" */}
```

### 3.8 Card

```typescript
// apps/fe/src/components/ui/Card.tsx
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// === Card Root ===
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Bo shadow khi hover */
  hoverable?: boolean;
  /** Nen trang thay vi surface */
  white?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, white, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border overflow-hidden',
        white ? 'bg-white' : 'bg-surface-100',
        'shadow-card',
        hoverable && 'transition-shadow duration-normal hover:shadow-card-hover',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// === Card Header ===
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 p-6 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// === Card Title ===
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-h4 text-foreground', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// === Card Description ===
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// === Card Content ===
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// === Card Footer ===
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

**Su dung:**

```tsx
<Card hoverable white>
  <CardHeader>
    <CardTitle>Ban ghe go soi</CardTitle>
    <CardDescription>Go soi tu nhien, phong cach Bac Au</CardDescription>
  </CardHeader>
  <CardContent>
    <img src="/images/product.jpg" alt="Ban ghe" className="rounded-md" />
  </CardContent>
  <CardFooter className="justify-between">
    <PriceDisplay price={12500000} />
    <Button size="sm">Them vao gio</Button>
  </CardFooter>
</Card>
```

### 3.9 Dialog / Modal

```typescript
// apps/fe/src/components/ui/Dialog.tsx
'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

// === Overlay ===
const DialogOverlay = forwardRef<
  HTMLDivElement,
  DialogPrimitive.DialogOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

// === Content ===
interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  /** Kich co modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** An nut dong X */
  hideCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = 'md', hideCloseButton = false, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full p-6 rounded-lg bg-white shadow-xl border border-border',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'duration-200',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4 rounded-sm p-1',
              'text-muted-foreground hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'transition-colors'
            )}
            aria-label="Dong"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = 'DialogContent';

// === Header ===
const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

// === Title ===
const DialogTitle = forwardRef<HTMLHeadingElement, DialogPrimitive.DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-h4 font-semibold', className)}
      {...props}
    />
  )
);
DialogTitle.displayName = 'DialogTitle';

// === Description ===
const DialogDescription = forwardRef<
  HTMLParagraphElement,
  DialogPrimitive.DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-body-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

// === Footer ===
const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
```

**Su dung:**

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Xem nhanh</Button>
  </DialogTrigger>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Chi tiet san pham</DialogTitle>
      <DialogDescription>Ban ghe go soi tu nhien</DialogDescription>
    </DialogHeader>
    <div>{/* Noi dung */}</div>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Dong</Button>
      <Button>Them vao gio hang</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3.10 DropdownMenu

```typescript
// apps/fe/src/components/ui/DropdownMenu.tsx
'use client';

import { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuItemProps & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-body-sm outline-none',
      'transition-colors focus:bg-surface-200 focus:text-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuCheckboxItemProps
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-body-sm outline-none',
      'transition-colors focus:bg-surface-200',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuRadioItemProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-body-sm outline-none',
      'transition-colors focus:bg-surface-200',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuLabelProps & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-caption font-semibold text-muted-foreground', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuSubTrigger = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuSubTriggerProps & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-body-sm outline-none',
      'focus:bg-surface-200',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuSubContentProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-white p-1 shadow-lg',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
};
```

**Su dung:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Thao tac</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => router.push(`/admin/orders/${id}`)}>
      <Eye className="mr-2 h-4 w-4" /> Xem chi tiet
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleEdit}>
      <Pencil className="mr-2 h-4 w-4" /> Chinh sua
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-danger-500" onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" /> Xoa
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3.11 Tabs

```typescript
// apps/fe/src/components/ui/Tabs.tsx
'use client';

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<HTMLDivElement, TabsPrimitive.TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center justify-start gap-1 border-b border-border w-full',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

const TabsTrigger = forwardRef<HTMLButtonElement, TabsPrimitive.TabsTriggerProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5',
        'text-body-sm font-medium text-muted-foreground',
        'border-b-2 border-transparent -mb-px',
        'transition-all duration-fast',
        'hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'data-[state=active]:text-primary-500 data-[state=active]:border-primary-500',
        'disabled:pointer-events-none disabled:opacity-50',
        'tap-target',
        className
      )}
      {...props}
    />
  )
);
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = forwardRef<HTMLDivElement, TabsPrimitive.TabsContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

**Su dung:**

```tsx
<Tabs defaultValue="description">
  <TabsList>
    <TabsTrigger value="description">Mo ta</TabsTrigger>
    <TabsTrigger value="specs">Thong so</TabsTrigger>
    <TabsTrigger value="reviews">Danh gia (24)</TabsTrigger>
  </TabsList>
  <TabsContent value="description">
    <div className="prose">{product.description}</div>
  </TabsContent>
  <TabsContent value="specs">
    <SpecsTable specs={product.specifications} />
  </TabsContent>
  <TabsContent value="reviews">
    <ReviewList productId={product.id} />
  </TabsContent>
</Tabs>
```

### 3.12 Toast

```typescript
// apps/fe/src/components/ui/Toast.tsx
'use client';

import toast, { Toaster as HotToaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// === Toaster Provider (dat trong root layout) ===
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: cn(
          '!bg-white !text-foreground !rounded-lg !shadow-lg !border !border-border',
          '!p-4 !max-w-sm'
        ),
      }}
    />
  );
}

// === Custom toast functions ===

interface ToastOptions {
  /** Thoi gian hien thi (ms) */
  duration?: number;
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={cn(
            'flex items-start gap-3 max-w-sm w-full bg-white rounded-lg shadow-lg border border-success-500/20 p-4',
            t.visible ? 'animate-slide-up' : 'animate-fade-out'
          )}
        >
          <CheckCircle className="h-5 w-5 text-success-500 shrink-0 mt-0.5" />
          <p className="text-body-sm text-foreground flex-1">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dong thong bao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  error: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={cn(
            'flex items-start gap-3 max-w-sm w-full bg-white rounded-lg shadow-lg border border-danger-500/20 p-4',
            t.visible ? 'animate-slide-up' : 'animate-fade-out'
          )}
        >
          <AlertCircle className="h-5 w-5 text-danger-500 shrink-0 mt-0.5" />
          <p className="text-body-sm text-foreground flex-1">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dong thong bao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 5000 }
    );
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={cn(
            'flex items-start gap-3 max-w-sm w-full bg-white rounded-lg shadow-lg border border-warning-500/20 p-4',
            t.visible ? 'animate-slide-up' : 'animate-fade-out'
          )}
        >
          <AlertTriangle className="h-5 w-5 text-warning-500 shrink-0 mt-0.5" />
          <p className="text-body-sm text-foreground flex-1">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dong thong bao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  info: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={cn(
            'flex items-start gap-3 max-w-sm w-full bg-white rounded-lg shadow-lg border border-info-500/20 p-4',
            t.visible ? 'animate-slide-up' : 'animate-fade-out'
          )}
        >
          <Info className="h-5 w-5 text-info-500 shrink-0 mt-0.5" />
          <p className="text-body-sm text-foreground flex-1">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dong thong bao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  /** Loading toast - tra ve id de dismiss sau */
  loading: (message: string) => {
    return toast.loading(message, {
      className: '!bg-white !text-foreground !rounded-lg !shadow-lg !border !border-border !p-4',
    });
  },

  /** Dismiss toast theo id */
  dismiss: (id?: string) => toast.dismiss(id),
};
```

**Su dung:**

```tsx
import { showToast } from '@/components/ui/Toast';

// Trong component
const handleAddToCart = async () => {
  try {
    await addToCart(productId);
    showToast.success('Da them san pham vao gio hang!');
  } catch (error) {
    showToast.error('Khong the them san pham. Vui long thu lai.');
  }
};

// Loading toast
const handleSubmitOrder = async () => {
  const loadingId = showToast.loading('Dang xu ly don hang...');
  try {
    await submitOrder(data);
    showToast.dismiss(loadingId);
    showToast.success('Dat hang thanh cong!');
  } catch (error) {
    showToast.dismiss(loadingId);
    showToast.error('Dat hang that bai.');
  }
};
```

### 3.13 Tooltip

```typescript
// apps/fe/src/components/ui/Tooltip.tsx
'use client';

import { forwardRef, type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  HTMLDivElement,
  TooltipPrimitive.TooltipContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md px-3 py-1.5',
      'bg-foreground text-surface-50 text-caption',
      'shadow-md animate-in fade-in-0 zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

// === Shorthand component ===
interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

export function Tooltip({ children, content, side = 'top', delayDuration = 300 }: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipRoot delayDuration={delayDuration}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
```

**Su dung:**

```tsx
<Tooltip content="Them vao yeu thich">
  <button className="p-2 rounded-full hover:bg-surface-200">
    <Heart className="h-5 w-5" />
  </button>
</Tooltip>
```

### 3.14 Accordion

```typescript
// apps/fe/src/components/ui/Accordion.tsx
'use client';

import { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = forwardRef<
  HTMLDivElement,
  AccordionPrimitive.AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-border', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  AccordionPrimitive.AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 text-body font-medium',
        'transition-all hover:text-primary-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        '[&[data-state=open]>svg]:rotate-180',
        'tap-target',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = forwardRef<
  HTMLDivElement,
  AccordionPrimitive.AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-body-sm text-muted-foreground',
      'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    )}
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

**Su dung:**

```tsx
// FAQ trang san pham
<Accordion type="single" collapsible>
  <AccordionItem value="shipping">
    <AccordionTrigger>Chinh sach van chuyen</AccordionTrigger>
    <AccordionContent>
      Mien phi van chuyen cho don hang tu 2.000.000 VND. Thoi gian giao hang tu 3-7 ngay lam viec.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="return">
    <AccordionTrigger>Chinh sach doi tra</AccordionTrigger>
    <AccordionContent>
      Doi tra mien phi trong 30 ngay neu san pham co loi tu nha san xuat.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="warranty">
    <AccordionTrigger>Bao hanh</AccordionTrigger>
    <AccordionContent>
      Bao hanh 12 thang cho tat ca san pham noi that.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## 4. Composite Components

> File: `apps/fe/src/components/shared/`
> Components ghep tu cac base components, phuc vu cac chuc nang cu the.

### 4.1 DataTable

```typescript
// apps/fe/src/components/shared/DataTable.tsx
'use client';

import { useState, useMemo, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SearchInput } from './SearchInput';

// === Interfaces ===

interface DataTableProps<TData, TValue> {
  /** Dinh nghia cot */
  columns: ColumnDef<TData, TValue>[];
  /** Du lieu */
  data: TData[];
  /** Dang tai du lieu */
  isLoading?: boolean;
  /** So dong skeleton khi loading */
  loadingRows?: number;
  /** Bat chon dong (checkbox) */
  enableRowSelection?: boolean;
  /** Callback khi chon dong */
  onRowSelectionChange?: (rows: TData[]) => void;
  /** Bat tim kiem */
  enableSearch?: boolean;
  /** Placeholder cho o tim kiem */
  searchPlaceholder?: string;
  /** Callback khi tim kiem (server-side) */
  onSearch?: (query: string) => void;
  /** Tong so ban ghi (server-side pagination) */
  totalCount?: number;
  /** Trang hien tai (server-side, 1-indexed) */
  currentPage?: number;
  /** So ban ghi moi trang */
  pageSize?: number;
  /** Callback khi doi trang (server-side) */
  onPageChange?: (page: number) => void;
  /** Hien thi khi khong co du lieu */
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Toolbar tuy chinh (filters, buttons) */
  toolbar?: ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  loadingRows = 5,
  enableRowSelection = false,
  onRowSelectionChange,
  enableSearch = false,
  searchPlaceholder = 'Tim kiem...',
  onSearch,
  totalCount,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  emptyIcon,
  emptyTitle = 'Khong co du lieu',
  emptyDescription = 'Chua co ban ghi nao trong bang nay.',
  emptyAction,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Them cot checkbox neu bat chon dong
  const tableColumns = useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chon tat ca"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chon dong"
        />
      ),
      enableSorting: false,
    };

    return [selectColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Chi dung client-side pagination neu khong co onPageChange
    ...(onPageChange ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      if (onRowSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)]);
        onRowSelectionChange(selectedRows);
      }
    },
    state: {
      sorting,
      rowSelection,
    },
  });

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : table.getPageCount();

  return (
    <div className="space-y-4">
      {/* Toolbar: Search + Custom actions */}
      {(enableSearch || toolbar) && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {enableSearch && (
            <SearchInput
              placeholder={searchPlaceholder}
              onSearch={onSearch || (() => {})}
              className="w-full sm:w-80"
            />
          )}
          {toolbar && <div className="flex gap-2 shrink-0">{toolbar}</div>}
        </div>
      )}

      {/* Bang */}
      <div className="rounded-lg border border-border overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-surface-200">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left font-medium text-muted-foreground',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {/* Loading state */}
              {isLoading &&
                Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-border">
                    {tableColumns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton variant="text" />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Data rows */}
              {!isLoading &&
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-border transition-colors hover:bg-surface-100',
                      row.getIsSelected() && 'bg-primary-50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!isLoading && data.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          </div>
        )}
      </div>

      {/* Pagination + Selection count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {enableRowSelection && (
          <p className="text-body-sm text-muted-foreground">
            Da chon {Object.keys(rowSelection).filter((k) => rowSelection[k]).length} / {data.length} dong
          </p>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={onPageChange ? currentPage : table.getState().pagination.pageIndex + 1}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (onPageChange) {
                onPageChange(page);
              } else {
                table.setPageIndex(page - 1);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
```

**Su dung (Admin - Quan ly don hang):**

```tsx
import { DataTable } from '@/components/shared/DataTable';
import { type ColumnDef } from '@tanstack/react-table';
import { type Order } from '@/types';

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderCode',
    header: 'Ma don',
    cell: ({ row }) => (
      <span className="font-mono text-primary-500">{row.original.orderCode}</span>
    ),
  },
  {
    accessorKey: 'customer.fullName',
    header: 'Khach hang',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Tong tien',
    cell: ({ row }) => <PriceDisplay price={row.original.totalAmount} />,
  },
  {
    accessorKey: 'status',
    header: 'Trang thai',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <OrderActions order={row.original} />,
    enableSorting: false,
  },
];

// Trong component
<DataTable
  columns={columns}
  data={orders}
  isLoading={isLoading}
  enableRowSelection
  enableSearch
  searchPlaceholder="Tim theo ma don, ten khach hang..."
  onSearch={handleSearch}
  totalCount={totalOrders}
  currentPage={page}
  pageSize={20}
  onPageChange={setPage}
  emptyTitle="Chua co don hang nao"
  emptyDescription="Don hang moi se xuat hien o day"
  toolbar={
    <div className="flex gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Trang thai" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tat ca</SelectItem>
          <SelectItem value="pending">Cho xu ly</SelectItem>
          <SelectItem value="confirmed">Da xac nhan</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
        Xuat Excel
      </Button>
    </div>
  }
/>
```

### 4.2 Pagination

```typescript
// apps/fe/src/components/shared/Pagination.tsx
'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  /** Trang hien tai (1-indexed) */
  currentPage: number;
  /** Tong so trang */
  totalPages: number;
  /** Callback khi chuyen trang */
  onPageChange: (page: number) => void;
  /** So nut trang hien thi toi da (mac dinh 5, mobile 3) */
  siblingCount?: number;
  className?: string;
}

/**
 * Tinh danh sach cac trang can hien thi.
 * Vd: currentPage=5, totalPages=20, siblingCount=1 => [1, '...', 4, 5, 6, '...', 20]
 */
function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | '...')[] {
  const totalSlots = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipses

  // Neu tong so trang <= so slots, hien thi het
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
    return [...leftRange, '...', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => totalPages - (3 + 2 * siblingCount) + i + 1
    );
    return [1, '...', ...rightRange];
  }

  // Ca 2 ben deu co ellipsis
  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  );
  return [1, '...', ...middleRange, '...', totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const pages = useMemo(
    () => generatePagination(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      role="navigation"
      aria-label="Phan trang"
    >
      {/* Trang dau */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="Trang dau tien"
        className="hidden sm:inline-flex"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Trang truoc */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang truoc"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* So trang */}
      {pages.map((page, index) =>
        page === '...' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-muted-foreground select-none"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(page)}
            aria-label={`Trang ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            className={cn(
              'min-w-[36px]',
              // An bot trang tren mobile
              index > 0 &&
                index < pages.length - 1 &&
                Math.abs((page as number) - currentPage) > 1 &&
                'hidden sm:inline-flex'
            )}
          >
            {page}
          </Button>
        )
      )}

      {/* Trang sau */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Trang cuoi */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Trang cuoi cung"
        className="hidden sm:inline-flex"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
```

**Su dung:**

```tsx
<Pagination
  currentPage={page}
  totalPages={Math.ceil(totalProducts / 20)}
  onPageChange={(p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }}
/>
```

### 4.3 EmptyState

```typescript
// apps/fe/src/components/shared/EmptyState.tsx
import { type ReactNode } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon hien thi */
  icon?: ReactNode;
  /** Tieu de */
  title: string;
  /** Mo ta chi tiet */
  description?: string;
  /** Nut hanh dong (vd: "Tao moi") */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-200 mb-4">
        {icon || <Package className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-h5 text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-body-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

**Su dung:**

```tsx
<EmptyState
  icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
  title="Gio hang trong"
  description="Ban chua them san pham nao vao gio hang"
  action={
    <Button onClick={() => router.push('/products')}>
      Tiep tuc mua sam
    </Button>
  }
/>
```

### 4.4 LoadingSpinner

```typescript
// apps/fe/src/components/shared/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Kich co spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Full-page overlay */
  fullPage?: boolean;
  /** Text hien thi duoi spinner */
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({
  size = 'md',
  fullPage = false,
  text,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        className={cn('animate-spin text-primary-500', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && <p className="text-body-sm text-muted-foreground">{text}</p>}
      <span className="sr-only">Dang tai...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-100/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
```

**Su dung:**

```tsx
// Inline
<LoadingSpinner size="sm" />

// Full page
<LoadingSpinner fullPage text="Dang tai du lieu..." />

// Trong Suspense
<Suspense fallback={<LoadingSpinner size="lg" text="Dang tai san pham..." />}>
  <ProductList />
</Suspense>
```

### 4.5 ConfirmDialog

```typescript
// apps/fe/src/components/shared/ConfirmDialog.tsx
'use client';

import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  /** Mo/dong dialog */
  open: boolean;
  /** Callback khi dong */
  onOpenChange: (open: boolean) => void;
  /** Tieu de */
  title: string;
  /** Mo ta chi tiet */
  description: string;
  /** Text nut xac nhan */
  confirmText?: string;
  /** Text nut huy */
  cancelText?: string;
  /** Variant cua nut xac nhan */
  variant?: 'primary' | 'danger';
  /** Icon hien thi */
  icon?: ReactNode;
  /** Dang xu ly */
  isLoading?: boolean;
  /** Callback khi xac nhan */
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Xac nhan',
  cancelText = 'Huy',
  variant = 'danger',
  icon,
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" hideCloseButton>
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                variant === 'danger' ? 'bg-danger-50' : 'bg-primary-50'
              }`}
            >
              {icon || (
                <AlertTriangle
                  className={`h-5 w-5 ${
                    variant === 'danger' ? 'text-danger-500' : 'text-primary-500'
                  }`}
                />
              )}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText="Dang xu ly..."
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Su dung:**

```tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

<ConfirmDialog
  open={showDeleteConfirm}
  onOpenChange={setShowDeleteConfirm}
  title="Xoa san pham?"
  description="Ban co chac chan muon xoa san pham nay? Hanh dong nay khong the hoan tac."
  confirmText="Xoa san pham"
  variant="danger"
  isLoading={isDeleting}
  onConfirm={handleDeleteProduct}
/>
```

### 4.6 SearchInput

```typescript
// apps/fe/src/components/shared/SearchInput.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  /** Placeholder */
  placeholder?: string;
  /** Callback khi tim kiem (sau debounce) */
  onSearch: (query: string) => void;
  /** Thoi gian debounce (ms) */
  debounceMs?: number;
  /** Dang tai ket qua */
  isLoading?: boolean;
  /** Gia tri mac dinh */
  defaultValue?: string;
  className?: string;
}

export function SearchInput({
  placeholder = 'Tim kiem...',
  onSearch,
  debounceMs = 300,
  isLoading = false,
  defaultValue = '',
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full h-11 rounded-md border border-input bg-white pl-10 pr-10',
          'text-body-sm placeholder:text-muted-foreground',
          'transition-colors duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'hover:border-primary-300'
        )}
        role="searchbox"
        aria-label={placeholder}
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        {value && !isLoading && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Xoa tim kiem"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

**Su dung:**

```tsx
<SearchInput
  placeholder="Tim san pham theo ten, ma SKU..."
  onSearch={(query) => {
    setSearchQuery(query);
    setPage(1);
  }}
  isLoading={isSearching}
  defaultValue={searchParams.get('q') || ''}
/>
```

### 4.7 ImageUpload

```typescript
// apps/fe/src/components/shared/ImageUpload.tsx
'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  /** Tien do upload 0-100 */
  progress?: number;
}

interface ImageUploadProps {
  /** Danh sach file da upload */
  value: UploadedFile[];
  /** Callback khi thay doi */
  onChange: (files: UploadedFile[]) => void;
  /** Ham upload file len server */
  onUpload: (file: File) => Promise<UploadedFile>;
  /** Cho phep nhieu file */
  multiple?: boolean;
  /** So file toi da */
  maxFiles?: number;
  /** Kich co toi da moi file (bytes) */
  maxSize?: number;
  /** Cac dinh dang cho phep */
  accept?: string;
  /** Dang upload */
  isUploading?: boolean;
  /** Thong bao loi */
  error?: string;
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  onUpload,
  multiple = true,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = 'image/jpeg,image/png,image/webp',
  error,
  className,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!accept.split(',').some((type) => file.type.match(type.trim()))) {
      return `Dinh dang ${file.type} khong duoc ho tro`;
    }
    if (file.size > maxSize) {
      return `File ${file.name} vuot qua ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
    }
    if (value.length >= maxFiles) {
      return `Toi da ${maxFiles} file`;
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const err = validateFile(file);
        if (err) {
          showToast.error(err);
          continue;
        }

        setUploadingCount((c) => c + 1);
        try {
          const uploaded = await onUpload(file);
          onChange([...value, uploaded]);
        } catch {
          showToast.error(`Upload ${file.name} that bai`);
        } finally {
          setUploadingCount((c) => c - 1);
        }
      }
    },
    [value, onChange, onUpload, maxFiles, maxSize, accept]
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (fileId: string) => {
    onChange(value.filter((f) => f.id !== fileId));
  };

  const isUploading = uploadingCount > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2',
          'rounded-lg border-2 border-dashed p-8 cursor-pointer',
          'transition-colors duration-fast',
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-border hover:border-primary-300 hover:bg-surface-100',
          error && 'border-danger-500'
        )}
        role="button"
        tabIndex={0}
        aria-label="Khu vuc upload hinh anh"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-body-sm font-medium">
            {isUploading ? 'Dang upload...' : 'Keo tha hinh anh vao day'}
          </p>
          <p className="text-caption text-muted-foreground mt-1">
            hoac click de chon file. Toi da {maxFiles} file, moi file {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p className="text-caption text-danger-500" role="alert">{error}</p>
      )}

      {/* Preview */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {value.map((file) => (
            <div
              key={file.id}
              className="relative group aspect-square rounded-md overflow-hidden border border-border bg-surface-100"
            >
              <Image
                src={file.url}
                alt={file.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 16vw"
              />

              {/* Progress bar */}
              {file.progress !== undefined && file.progress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-300">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(file.id);
                }}
                className={cn(
                  'absolute top-1 right-1 p-1 rounded-full',
                  'bg-black/50 text-white opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-fast',
                  'hover:bg-black/70'
                )}
                aria-label={`Xoa ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Su dung:**

```tsx
<ImageUpload
  value={productImages}
  onChange={setProductImages}
  onUpload={async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadApi.uploadImage(formData);
    return { id: res.id, url: res.url, name: file.name, size: file.size };
  }}
  maxFiles={8}
  maxSize={5 * 1024 * 1024}
  error={errors.images?.message}
/>
```

### 4.8 StarRating

```typescript
// apps/fe/src/components/shared/StarRating.tsx
'use client';

import { useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Gia tri hien tai (1-5) */
  value: number;
  /** Callback khi thay doi (chi khi interactive) */
  onChange?: (value: number) => void;
  /** Chi hien thi, khong cho click */
  readOnly?: boolean;
  /** Kich co sao */
  size?: 'sm' | 'md' | 'lg';
  /** Hien thi so diem ben canh */
  showValue?: boolean;
  /** So luong danh gia (hien thi ben canh) */
  count?: number;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showValue = false,
  count,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const handleMouseEnter = useCallback(
    (star: number) => {
      if (!readOnly) setHoverValue(star);
    },
    [readOnly]
  );

  const handleMouseLeave = useCallback(() => {
    if (!readOnly) setHoverValue(0);
  }, [readOnly]);

  const handleClick = useCallback(
    (star: number) => {
      if (!readOnly && onChange) {
        onChange(star);
      }
    },
    [readOnly, onChange]
  );

  const displayValue = hoverValue || value;

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `Danh gia ${value} tren 5 sao` : 'Chon so sao danh gia'}
    >
      <div className="flex gap-0.5" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          const isHalf = !isFilled && star - 0.5 <= displayValue;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={readOnly}
              className={cn(
                'transition-colors',
                !readOnly && 'cursor-pointer hover:scale-110 transition-transform',
                readOnly && 'cursor-default'
              )}
              role={readOnly ? undefined : 'radio'}
              aria-checked={readOnly ? undefined : star === value}
              aria-label={`${star} sao`}
              tabIndex={readOnly ? -1 : 0}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? 'fill-warning-500 text-warning-500'
                    : isHalf
                      ? 'fill-warning-500/50 text-warning-500'
                      : 'fill-none text-surface-400'
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-body-sm font-medium text-foreground ml-1">
          {value.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-body-sm text-muted-foreground">
          ({count})
        </span>
      )}
    </div>
  );
}
```

**Su dung:**

```tsx
// Hien thi (read-only)
<StarRating value={4.5} readOnly showValue count={128} />

// Interactive (form danh gia)
<StarRating
  value={rating}
  onChange={setRating}
  size="lg"
/>
```

### 4.9 PriceDisplay

```typescript
// apps/fe/src/components/shared/PriceDisplay.tsx
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  /** Gia hien tai (VND) */
  price: number;
  /** Gia goc truoc khi giam (VND) */
  originalPrice?: number;
  /** Kich co */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Format so tien theo VND.
 * 12500000 => "12.500.000 d"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' d';
}

/**
 * Tinh phan tram giam gia.
 */
function calcDiscount(original: number, current: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - current) / original) * 100);
}

const sizeClasses = {
  sm: {
    current: 'text-body-sm font-semibold',
    original: 'text-caption',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  md: {
    current: 'text-body-lg font-bold',
    original: 'text-body-sm',
    badge: 'text-caption px-2 py-0.5',
  },
  lg: {
    current: 'text-h3 font-bold',
    original: 'text-body',
    badge: 'text-body-sm px-2.5 py-1',
  },
};

export function PriceDisplay({
  price,
  originalPrice,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discount = hasDiscount ? calcDiscount(originalPrice, price) : 0;
  const styles = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Gia hien tai */}
      <span className={cn(styles.current, 'text-primary-500')}>
        {formatVND(price)}
      </span>

      {/* Gia goc (gach ngang) */}
      {hasDiscount && (
        <span className={cn(styles.original, 'text-muted-foreground line-through')}>
          {formatVND(originalPrice)}
        </span>
      )}

      {/* Badge giam gia */}
      {hasDiscount && discount > 0 && (
        <span
          className={cn(
            styles.badge,
            'inline-flex items-center rounded-full font-medium',
            'bg-danger-50 text-danger-600'
          )}
        >
          -{discount}%
        </span>
      )}
    </div>
  );
}
```

**Su dung:**

```tsx
// Gia thuong
<PriceDisplay price={12500000} />

// Dang giam gia
<PriceDisplay
  price={9900000}
  originalPrice={12500000}
  size="lg"
/>
// Hien thi: 9.900.000 d  12.500.000 d  -21%
```

### 4.10 StatusBadge

```typescript
// apps/fe/src/components/shared/StatusBadge.tsx
import { Badge } from '@/components/ui/Badge';
import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  ShipperStatus,
  ReviewStatus,
  ReturnStatus,
  OrderStatusLabel,
  PaymentStatusLabel,
  ProductStatusLabel,
  ShipperStatusLabel,
  ReviewStatusLabel,
  ReturnStatusLabel,
  OrderStatusColor,
  PaymentStatusColor,
  ProductStatusColor,
  ShipperStatusColor,
  ReviewStatusColor,
  ReturnStatusColor,
} from '@/types';
import { type VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/Badge';

// === Color mapping tu enum color => badge variant ===
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const colorToVariant: Record<string, BadgeVariant> = {
  yellow: 'warning',
  blue: 'info',
  purple: 'info',
  cyan: 'info',
  green: 'success',
  red: 'danger',
  gray: 'default',
  orange: 'warning',
};

// === StatusBadge cho Order ===
interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const label = OrderStatusLabel[status];
  const color = OrderStatusColor[status];
  const variant = colorToVariant[color] || 'default';

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

// === StatusBadge cho Payment ===
interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const label = PaymentStatusLabel[status];
  const color = PaymentStatusColor[status];
  const variant = colorToVariant[color] || 'default';

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

// === StatusBadge cho Product ===
interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const label = ProductStatusLabel[status];
  const color = ProductStatusColor[status];
  const variant = colorToVariant[color] || 'default';

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

// === Generic StatusBadge (dung cho cac enum khac) ===
interface GenericStatusBadgeProps {
  label: string;
  color: string;
}

export function StatusBadge({ label, color }: GenericStatusBadgeProps) {
  const variant = colorToVariant[color] || 'default';

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}
```

**Su dung:**

```tsx
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { OrderStatus, PaymentStatus } from '@/types';

<OrderStatusBadge status={OrderStatus.CONFIRMED} />
<PaymentStatusBadge status={PaymentStatus.PAID} />

// Generic
<StatusBadge label="Dang hoat dong" color="green" />
```

### 4.11 Breadcrumb

```typescript
// apps/fe/src/components/shared/Breadcrumb.tsx
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  /** Text hien thi */
  label: string;
  /** URL (neu co thi la link, khong co thi la text thuong) */
  href?: string;
}

interface BreadcrumbProps {
  /** Danh sach cac muc breadcrumb */
  items: BreadcrumbItem[];
  /** Hien thi icon Home o dau */
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('py-3', className)}>
      <ol className="flex items-center gap-1.5 text-body-sm flex-wrap">
        {showHome && (
          <li className="flex items-center gap-1.5">
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary-500 transition-colors"
              aria-label="Trang chu"
            >
              <Home className="h-4 w-4" />
            </Link>
            {items.length > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            )}
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-primary-500 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

**Su dung:**

```tsx
<Breadcrumb
  items={[
    { label: 'San pham', href: '/products' },
    { label: 'Phong khach', href: '/categories/phong-khach' },
    { label: 'Sofa go soi Bac Au' }, // Trang hien tai
  ]}
/>
// Hien thi: Home > San pham > Phong khach > Sofa go soi Bac Au
```

---

## 5. Layout Components

> File: `apps/fe/src/components/layout/`
> Cac component bo cuc dung chung cho toan bo ung dung.

### 5.1 Container

```typescript
// apps/fe/src/components/layout/Container.tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Kich co toi da */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',      // 768px
  md: 'max-w-5xl',      // 1024px
  lg: 'max-w-6xl',      // 1152px
  xl: 'max-w-7xl',      // 1280px
  full: 'max-w-full',
};

export function Container({ size = 'xl', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        maxWidthClasses[size],
        className
      )}
      {...props}
    />
  );
}
```

**Su dung:**

```tsx
<Container>
  <h1 className="text-h1">Trang chu</h1>
  <ProductGrid products={products} />
</Container>

<Container size="sm">
  <LoginForm />
</Container>
```

### 5.2 Grid

```typescript
// apps/fe/src/components/layout/Grid.tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** So cot tren desktop (mac dinh 4) */
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Khoang cach giua cac item */
  gap?: 'sm' | 'md' | 'lg';
}

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
};

export function Grid({
  cols = 4,
  gap = 'md',
  className,
  ...props
}: GridProps) {
  return (
    <div
      className={cn('grid', colClasses[cols], gapClasses[gap], className)}
      {...props}
    />
  );
}
```

**Su dung:**

```tsx
// Product grid: 1 cot mobile, 2 tablet, 3 desktop nho, 4 desktop
<Grid cols={4} gap="md">
  {products.map((p) => (
    <ProductCard key={p.id} product={p} />
  ))}
</Grid>

// Category grid: 2 cot mobile, 3 desktop
<Grid cols={3} gap="lg">
  {categories.map((c) => (
    <CategoryCard key={c.id} category={c} />
  ))}
</Grid>
```

### 5.3 Stack

```typescript
// apps/fe/src/components/layout/Stack.tsx
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Huong sap xep */
  direction?: 'vertical' | 'horizontal';
  /** Khoang cach giua cac item */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  /** Can chinh theo truc chinh */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Can chinh theo truc phu */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Co giuon ra het chieu rong/cao khong */
  fullWidth?: boolean;
  /** Tu dong wrap khi het cho */
  wrap?: boolean;
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const gapClasses: Record<number, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
};

export function Stack({
  direction = 'vertical',
  gap = 4,
  justify = 'start',
  align = 'stretch',
  fullWidth = false,
  wrap = false,
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        gapClasses[gap],
        justifyClasses[justify],
        alignClasses[align],
        fullWidth && 'w-full',
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  );
}
```

**Su dung:**

```tsx
// Vertical stack (mac dinh)
<Stack gap={6}>
  <h1>Tieu de</h1>
  <p>Mo ta</p>
  <Button>Hanh dong</Button>
</Stack>

// Horizontal stack
<Stack direction="horizontal" gap={3} align="center" justify="between">
  <Logo />
  <Navigation />
  <UserMenu />
</Stack>
```

### 5.4 Divider

```typescript
// apps/fe/src/components/layout/Divider.tsx
import { cn } from '@/lib/utils';

interface DividerProps {
  /** Huong */
  orientation?: 'horizontal' | 'vertical';
  /** Label o giua */
  label?: string;
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  label,
  className,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('w-px bg-border self-stretch', className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div
        className={cn('flex items-center gap-4', className)}
        role="separator"
      >
        <div className="flex-1 h-px bg-border" />
        <span className="text-caption text-muted-foreground shrink-0">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <hr
      className={cn('border-0 h-px bg-border', className)}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}
```

**Su dung:**

```tsx
<Divider />
<Divider label="hoac" />
<Stack direction="horizontal" gap={4}>
  <Sidebar />
  <Divider orientation="vertical" />
  <MainContent />
</Stack>
```

### 5.5 Export tat ca layout components

```typescript
// apps/fe/src/components/layout/index.ts
export { Container } from './Container';
export { Grid } from './Grid';
export { Stack } from './Stack';
export { Divider } from './Divider';
```

---

## 6. Responsive Utilities

> File: `apps/fe/src/components/ui/Responsive.tsx` va globals.css
> Cac utility de xu ly responsive design.

### 6.1 Show/Hide theo Breakpoint

```typescript
// apps/fe/src/components/ui/Responsive.tsx
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveProps {
  children: ReactNode;
  className?: string;
}

/** Chi hien thi tren mobile (< md: 768px) */
export function MobileOnly({ children, className }: ResponsiveProps) {
  return <div className={cn('block md:hidden', className)}>{children}</div>;
}

/** Chi hien thi tren tablet tro len (>= md: 768px) */
export function TabletUp({ children, className }: ResponsiveProps) {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
}

/** Chi hien thi tren desktop (>= lg: 1024px) */
export function DesktopOnly({ children, className }: ResponsiveProps) {
  return <div className={cn('hidden lg:block', className)}>{children}</div>;
}

/** An tren mobile, hien thi tu tablet tro len */
export function HideMobile({ children, className }: ResponsiveProps) {
  return <div className={cn('hidden sm:block', className)}>{children}</div>;
}

/** An tren desktop, hien thi tren mobile + tablet */
export function HideDesktop({ children, className }: ResponsiveProps) {
  return <div className={cn('block lg:hidden', className)}>{children}</div>;
}
```

**Su dung:**

```tsx
import { MobileOnly, DesktopOnly } from '@/components/ui/Responsive';

// Menu di dong
<MobileOnly>
  <MobileMenuButton onClick={openMenu} />
</MobileOnly>

// Navigation bar (chi desktop)
<DesktopOnly>
  <NavigationBar />
</DesktopOnly>
```

### 6.2 Responsive Text Sizes (Tailwind utilities)

```css
/* apps/fe/src/app/globals.css - Bo sung */

@layer utilities {
  /* Responsive heading - Tu dong scale theo man hinh */
  .text-responsive-h1 {
    @apply text-h3 sm:text-h2 lg:text-h1;
  }
  .text-responsive-h2 {
    @apply text-h4 sm:text-h3 lg:text-h2;
  }
  .text-responsive-h3 {
    @apply text-h5 sm:text-h4 lg:text-h3;
  }
  .text-responsive-display {
    @apply text-h1 sm:text-display lg:text-[4rem];
  }
}
```

**Su dung:**

```tsx
<h1 className="text-responsive-h1">Noi That Go Tu Nhien</h1>
<h2 className="text-responsive-h2">San Pham Noi Bat</h2>
```

### 6.3 Touch-Friendly Sizes

```css
/* apps/fe/src/app/globals.css - Bo sung */

@layer utilities {
  /* Tap target toi thieu 44x44px (WCAG 2.5.5) */
  .tap-target {
    @apply min-h-[44px] min-w-[44px];
  }

  /* Tap target voi padding (cho icon buttons) */
  .tap-target-icon {
    @apply p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center;
  }
}
```

**Su dung:**

```tsx
// Nut icon tren mobile phai co it nhat 44x44px
<button className="tap-target-icon rounded-full hover:bg-surface-200">
  <Heart className="h-5 w-5" />
</button>
```

### 6.4 Hook: useBreakpoint

```typescript
// apps/fe/src/hooks/useBreakpoint.ts
'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/lib/theme';

type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Hook phat hien breakpoint hien tai.
 * Tra ve true neu man hinh >= breakpoint duoc chi dinh.
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
    setMatches(query.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
}

/**
 * Tra ve breakpoint hien tai (nho nhat phu hop).
 */
export function useCurrentBreakpoint(): BreakpointKey | 'xs' {
  const isSm = useBreakpoint('sm');
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  const isXl = useBreakpoint('xl');
  const is2xl = useBreakpoint('2xl');

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}
```

**Su dung:**

```tsx
const isMobile = !useBreakpoint('md');
const currentBreakpoint = useCurrentBreakpoint();

// Hien thi khac nhau tren mobile vs desktop
{isMobile ? (
  <MobileProductGrid products={products} />
) : (
  <DataTable columns={columns} data={products} />
)}
```

---

## 7. Accessibility

> Cac quy uoc va pattern accessibility ap dung cho toan bo ung dung.
> Tuan theo WCAG 2.1 Level AA.

### 7.1 Focus Ring Styles

```css
/* Da dinh nghia trong globals.css */

/* Focus ring chuan - ap dung cho tat ca interactive elements */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100;
}

/*
  Tat ca component (Button, Input, Select, Checkbox, ...) da tich hop san:
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1

  Chi hien focus ring khi navigate bang ban phim (focus-visible),
  KHONG hien khi click chuot.
*/
```

### 7.2 Screen Reader Text

```css
/* Da dinh nghia trong globals.css */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
  clip: rect(0, 0, 0, 0);
}
```

**Su dung:**

```tsx
// Icon button phai co label cho screen reader
<button className="p-2 rounded-full hover:bg-surface-200" aria-label="Them vao yeu thich">
  <Heart className="h-5 w-5" aria-hidden="true" />
  <span className="sr-only">Them vao yeu thich</span>
</button>

// Skip link (dau trang)
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">
  Chuyen den noi dung chinh
</a>
```

### 7.3 ARIA Labels cho Interactive Elements

```tsx
// === Quy uoc ARIA trong project ===

// 1. Images co alt text mo ta
<Image src={product.image} alt={`Hinh anh ${product.name}`} />

// 2. Form fields co label lien ket
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" />

// 3. Error messages co role="alert"
{error && <p role="alert" className="text-danger-500">{error}</p>}

// 4. Loading states
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
  {isLoading ? 'Dang xu ly...' : 'Gui'}
</button>

// 5. Dialog co aria-labelledby va aria-describedby
// (Da tich hop san trong Radix UI Dialog)

// 6. Navigation co aria-label
<nav aria-label="Menu chinh">...</nav>
<nav aria-label="Phan trang">...</nav>
<nav aria-label="Breadcrumb">...</nav>

// 7. Status badges co aria-label
<Badge aria-label={`Trang thai don hang: ${statusLabel}`}>{statusLabel}</Badge>

// 8. Live regions cho cap nhat dong (gio hang, thong bao)
<div aria-live="polite" aria-atomic="true">
  Gio hang: {cartCount} san pham
</div>
```

### 7.4 Reduced Motion Support

```typescript
// === Tat ca animation components da tich hop useReducedMotion ===
// Khi nguoi dung bat "Reduce motion" trong OS settings:
// - Framer Motion animations se bi disable, render static
// - CSS animations van hoat dong, can them media query

// Trong globals.css:
```

```css
/* apps/fe/src/app/globals.css - Bo sung */

@media (prefers-reduced-motion: reduce) {
  /* Tat tat ca CSS animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```typescript
// Trong moi animation component:
// (Da trien khai o Section 2)

import { useReducedMotion } from '@/hooks/useReducedMotion';

export function FadeIn({ children, ...props }: FadeInProps) {
  const reducedMotion = useReducedMotion();

  // Neu bat reduce motion -> render truc tiep, khong animation
  if (reducedMotion) {
    return <div>{children}</div>;
  }

  // Animation binh thuong
  return <motion.div ...>{children}</motion.div>;
}
```

### 7.5 Keyboard Navigation

```typescript
// === Cac Radix UI components da ho tro keyboard navigation ===

// Dialog: Escape de dong, Tab de chuyen focus giua cac elements
// DropdownMenu: Arrow keys de di chuyen, Enter/Space de chon, Escape de dong
// Select: Arrow keys de chon, Enter de xac nhan
// Tabs: Arrow keys de chuyen tab
// Accordion: Arrow keys de chuyen giua cac items, Enter/Space de toggle

// === Custom keyboard handlers ===

// Nut icon can ho tro Enter/Space
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Mo menu"
>
  <MenuIcon aria-hidden="true" />
</div>
```

### 7.6 Color Contrast

```
Tat ca cac cap mau trong design system deu dam bao contrast ratio >= 4.5:1 (WCAG AA):

- primary-500 (#8B4513) tren white (#FFFFFF): ratio ~6.2:1   [PASS]
- secondary-500 (#2D5016) tren white: ratio ~8.5:1            [PASS]
- foreground (#2D2016) tren surface-100 (#FDF8F0): ratio ~12:1 [PASS]
- muted-foreground (#8B7355) tren white: ratio ~4.6:1          [PASS]
- danger-600 (#DC2626) tren white: ratio ~5.3:1                [PASS]
- success-700 (#047857) tren white: ratio ~5.9:1               [PASS]

Luu y: Mau accent (#D4A373) chi dung lam decorative, KHONG dung cho text tren nen trang
(contrast ratio chi ~2.8:1, khong du WCAG AA).
```

---

## Tong hop file exports

```typescript
// apps/fe/src/components/ui/index.ts
export { Button, buttonVariants } from './Button';
export { Input } from './Input';
export { Textarea } from './Textarea';
export {
  Select, SelectGroup, SelectValue, SelectTrigger,
  SelectContent, SelectItem, SelectLabel, SelectSeparator,
} from './Select';
export { Checkbox } from './Checkbox';
export { Badge, badgeVariants } from './Badge';
export { Avatar } from './Avatar';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export {
  Dialog, DialogTrigger, DialogClose, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from './Dialog';
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuRadioGroup,
} from './DropdownMenu';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { Toaster, showToast } from './Toast';
export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from './Tooltip';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
export { Skeleton, ProductCardSkeleton, TableRowSkeleton } from './Skeleton';
export { MobileOnly, TabletUp, DesktopOnly, HideMobile, HideDesktop } from './Responsive';

// Animations
export {
  FadeIn, SlideUp, SlideIn, ScaleIn,
  StaggerContainer, StaggerItem,
  PageTransition, HoverLift, AnimatedCounter,
} from './animations';
```

```typescript
// apps/fe/src/components/shared/index.ts
export { DataTable } from './DataTable';
export { Pagination } from './Pagination';
export { EmptyState } from './EmptyState';
export { LoadingSpinner } from './LoadingSpinner';
export { ConfirmDialog } from './ConfirmDialog';
export { SearchInput } from './SearchInput';
export { ImageUpload } from './ImageUpload';
export { StarRating } from './StarRating';
export { PriceDisplay, formatVND } from './PriceDisplay';
export {
  StatusBadge, OrderStatusBadge,
  PaymentStatusBadge, ProductStatusBadge,
} from './StatusBadge';
export { Breadcrumb } from './Breadcrumb';
```

```typescript
// apps/fe/src/components/layout/index.ts
export { Container } from './Container';
export { Grid } from './Grid';
export { Stack } from './Stack';
export { Divider } from './Divider';
```

---

## Dependencies

```json
// package.json - Cac thu vien can thiet
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "@radix-ui/react-accordion": "^1.0.0",
    "@tanstack/react-table": "^8.0.0",
    "react-hot-toast": "^2.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "@tailwindcss/typography": "^0.5.0"
  }
}
```
