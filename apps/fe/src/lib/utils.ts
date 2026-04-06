import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: any, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(String(date));
    if (isNaN(d.getTime())) return '—';
    return format(d, formatStr, { locale: vi });
  } catch {
    return '—';
  }
}

export function formatDateTime(date: any): string {
  try {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(String(date));
    if (isNaN(d.getTime())) return '—';
    return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch {
    return '—';
  }
}

export function formatRelativeTime(date: any): string {
  try {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(String(date));
    if (isNaN(d.getTime())) return '—';
    return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch {
    return '—';
  }
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function calculateDiscount(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateOrderCode(): string {
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FVN-${dateStr}-${random}`;
}
