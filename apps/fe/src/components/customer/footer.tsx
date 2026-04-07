import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { STORE } from '@/lib/store-info';

export function CustomerFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src={STORE.logoWhite}
                alt={`${STORE.name} logo`}
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                unoptimized
              />
            </div>
            <p className="text-sm leading-relaxed mb-6 text-gray-400">
              {STORE.description}
            </p>
            <div className="flex items-center gap-3">
              {STORE.facebook && (
              <a
                href={STORE.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gray-800 p-2.5 hover:bg-primary-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              )}
              <a
                href="#"
                className="rounded-full bg-gray-800 p-2.5 hover:bg-primary-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="rounded-full bg-gray-800 p-2.5 hover:bg-primary-500 transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Tất cả sản phẩm', href: '/products' },
                { label: 'Khuyến mãi', href: '/products?sale=true' },
                { label: 'Sản phẩm mới', href: '/products?sort=createdAt:desc' },
                { label: 'Bán chạy nhất', href: '/products?sort=soldCount:desc' },
                { label: 'So sánh sản phẩm', href: '/compare' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                'Chính sách đổi trả',
                'Chính sách bảo hành',
                'Chính sách vận chuyển',
                'Hướng dẫn mua hàng',
                'Chính sách bảo mật',
              ].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent-300" />
                <span>{STORE.address}</span>
              </li>
              {STORE.phone && (
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-accent-300" />
                <a href={`tel:${STORE.phone.replace(/\s/g, '')}`} className="hover:text-white">{STORE.phone}</a>
              </li>
              )}
              {STORE.email && (
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-accent-300" />
                <a href={`mailto:${STORE.email}`} className="hover:text-white">{STORE.email}</a>
              </li>
              )}
            </ul>

            <div className="mt-6">
              <p className="text-sm font-medium text-white mb-3">Đăng ký nhận tin khuyến mãi</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 h-9 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:border-primary-500 focus:outline-none"
                />
                <button className="h-9 px-3 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container-custom flex flex-col sm:flex-row items-center justify-between py-4 text-xs text-gray-500 gap-2">
          <span>{STORE.copyright}</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-gray-300 transition-colors">Điều khoản sử dụng</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
