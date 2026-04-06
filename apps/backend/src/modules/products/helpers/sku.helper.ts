import { randomBytes } from 'crypto';

/**
 * CATEGORY_PREFIX_MAP: Map tu slug category sang prefix 2-3 ky tu.
 * Vi du: 'sofa' -> 'SF', 'ban-an' -> 'BA', 'giuong' -> 'GI'
 */
const CATEGORY_PREFIX_MAP: Record<string, string> = {
  'sofa': 'SF',
  'ban-an': 'BA',
  'ban-lam-viec': 'BLV',
  'giuong': 'GI',
  'tu-quan-ao': 'TQA',
  'ke-sach': 'KS',
  'ghe': 'GH',
  'ban-tra': 'BT',
  'tu-giay': 'TG',
  'den': 'DN',
  'guong': 'GU',
  'tham': 'TH',
};

/**
 * Tao SKU cho variant.
 * Format: {CATEGORY_PREFIX}-{COLOR_ID}-{DIM_ID}-{RANDOM_4_CHAR}
 * Vi du: SF-RED01-L-A3F2
 *
 * @param categorySlug - Slug cua danh muc san pham
 * @param colorId      - ID cua mau sac
 * @param dimensionId  - ID cua kich thuoc
 */
export function generateSku(
  categorySlug: string,
  colorId: string,
  dimensionId: string,
): string {
  const prefix = CATEGORY_PREFIX_MAP[categorySlug] || categorySlug.substring(0, 3).toUpperCase();
  const random = randomBytes(2).toString('hex').toUpperCase(); // 4 ky tu hex
  return `${prefix}-${colorId.toUpperCase()}-${dimensionId.toUpperCase()}-${random}`;
}
