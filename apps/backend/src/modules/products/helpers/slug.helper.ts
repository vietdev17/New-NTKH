import slugify from 'slugify';

/**
 * Tao slug tu ten san pham.
 * Luat:
 *   1. Chuyen ve lowercase, bo dau tieng Viet
 *   2. Thay khoang trang bang dau gach ngang
 *   3. Kiem tra trung trong DB, neu trung thi them -1, -2, ...
 */
export function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: 'vi',
  });
}
