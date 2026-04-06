'use client';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

const fadeInUp: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const fadeIn: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const scaleIn: Variants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };
const slideInRight: Variants = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } };
const slideInLeft: Variants = { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } };

interface MotionProps { children: ReactNode; className?: string; delay?: number; }

export function FadeIn({ children, className, delay = 0 }: MotionProps) {
  return <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.4, delay }} className={className}>{children}</motion.div>;
}

export function FadeInUp({ children, className, delay = 0 }: MotionProps) {
  return <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export function ScaleIn({ children, className, delay = 0 }: MotionProps) {
  return <motion.div variants={scaleIn} initial="hidden" animate="visible" transition={{ duration: 0.3, delay }} className={className}>{children}</motion.div>;
}

export function SlideIn({ children, className, delay = 0, direction = 'right' }: MotionProps & { direction?: 'left' | 'right' }) {
  return <motion.div variants={direction === 'right' ? slideInRight : slideInLeft} initial="hidden" animate="visible" transition={{ duration: 0.4, delay }} className={className}>{children}</motion.div>;
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: MotionProps & { staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: MotionProps) {
  return <motion.div variants={fadeInUp} transition={{ duration: 0.4 }} className={className}>{children}</motion.div>;
}

export function PageTransition({ children, className }: MotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {value.toLocaleString('vi-VN')}
    </motion.span>
  );
}

export { AnimatePresence, motion };
