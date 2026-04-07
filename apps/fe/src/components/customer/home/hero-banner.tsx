'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    title: 'Nội Thất Khánh Huyền',
    subtitle: 'Nội Thất Khánh Huyền - Đồng Xoài, Bình Phước',
    description: 'Khám phá bộ sưu tập nội thất gỗ tự nhiên cao cấp tại Nội Thất Khánh Huyền - noithatkhanhhuyen.com.',
    cta: 'Kham Pha Ngay',
    ctaHref: '/products',
    bg: 'from-primary-900 via-primary-800 to-primary-700',
    image: '/images/placeholder.svg',
  },
  {
    id: 2,
    title: 'Sofa & Phong Khach',
    subtitle: 'Tạo Điều Kiện Sống Thoải Mái',
    description: 'Từ sofa góc, sofa đơn đến bàn trà và kệ tivi - tất cả những gì bạn cần cho phòng khách hoàn hảo.',
    cta: 'Xem Sofa',
    ctaHref: '/products?category=sofa',
    bg: 'from-secondary-900 via-secondary-800 to-secondary-700',
    image: '/images/placeholder.svg',
  },
  {
    id: 3,
    title: 'Phong Ngu Sang Trong',
    subtitle: 'Giấc Ngủ Ngon - Đơn Giản Có Mà',
    description: 'Bộ giường ngủ, tủ quần áo, bàn trang điểm - tạo phòng ngủ mơ ước với nội thất cao cấp.',
    cta: 'Kham Pha Ngay',
    ctaHref: '/products?category=phong-ngu',
    bg: 'from-accent-700 via-accent-600 to-accent-500',
    image: '/images/placeholder.svg',
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slides.length);
  };

  const slide = slides[current];

  return (
    <div className={`relative h-[55vh] sm:h-[65vh] lg:h-[70vh] overflow-hidden bg-gradient-to-br ${slide.bg} transition-all duration-700`}>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center"
        >
          <div className="container-custom">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-semibold text-white/80 uppercase tracking-widest mb-3"
              >
                {slide.subtitle}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight mb-4"
              >
                {slide.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base sm:text-lg text-white/80 mb-8 max-w-lg"
              >
                {slide.description}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <Button size="lg" asChild className="bg-white text-primary-700 hover:bg-gray-50 shadow-elevated">
                  <Link href={slide.ctaHref}>{slide.cta}</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10">
                  <Link href="/products">Xem Tất Cả</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
