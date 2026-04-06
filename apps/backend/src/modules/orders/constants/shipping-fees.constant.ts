// ============================================================
// modules/orders/constants/shipping-fees.constant.ts
// ============================================================
// Phi van chuyen theo khu vuc (don vi: VND)

export const SHIPPING_FEES = {
  // Noi thanh HCM va Ha Noi
  HCM_HN: 30000,

  // Mien Nam (ngoai HCM): Binh Duong, Dong Nai, Long An, Can Tho, ...
  MIEN_NAM: 50000,

  // Mien Bac (ngoai HN): Hai Phong, Quang Ninh, Bac Ninh, ...
  MIEN_BAC: 50000,

  // Mien Trung: Da Nang, Hue, Quang Nam, Khanh Hoa, ...
  MIEN_TRUNG: 60000,
};

// Danh sach tinh/thanh theo khu vuc
export const PROVINCE_REGIONS: Record<string, keyof typeof SHIPPING_FEES> = {
  // === HCM & Ha Noi ===
  'Ho Chi Minh': 'HCM_HN',
  'Ha Noi': 'HCM_HN',

  // === Mien Nam ===
  'Binh Duong': 'MIEN_NAM',
  'Dong Nai': 'MIEN_NAM',
  'Long An': 'MIEN_NAM',
  'Ba Ria - Vung Tau': 'MIEN_NAM',
  'Tay Ninh': 'MIEN_NAM',
  'Binh Phuoc': 'MIEN_NAM',
  'Can Tho': 'MIEN_NAM',
  'An Giang': 'MIEN_NAM',
  'Kien Giang': 'MIEN_NAM',
  'Tien Giang': 'MIEN_NAM',
  'Ben Tre': 'MIEN_NAM',
  'Vinh Long': 'MIEN_NAM',
  'Dong Thap': 'MIEN_NAM',
  'Tra Vinh': 'MIEN_NAM',
  'Soc Trang': 'MIEN_NAM',
  'Hau Giang': 'MIEN_NAM',
  'Bac Lieu': 'MIEN_NAM',
  'Ca Mau': 'MIEN_NAM',
  'Lam Dong': 'MIEN_NAM',
  'Binh Thuan': 'MIEN_NAM',
  'Ninh Thuan': 'MIEN_NAM',

  // === Mien Bac ===
  'Hai Phong': 'MIEN_BAC',
  'Quang Ninh': 'MIEN_BAC',
  'Bac Ninh': 'MIEN_BAC',
  'Hai Duong': 'MIEN_BAC',
  'Hung Yen': 'MIEN_BAC',
  'Vinh Phuc': 'MIEN_BAC',
  'Bac Giang': 'MIEN_BAC',
  'Thai Nguyen': 'MIEN_BAC',
  'Phu Tho': 'MIEN_BAC',
  'Nam Dinh': 'MIEN_BAC',
  'Thai Binh': 'MIEN_BAC',
  'Ninh Binh': 'MIEN_BAC',
  'Ha Nam': 'MIEN_BAC',
  'Hoa Binh': 'MIEN_BAC',
  'Son La': 'MIEN_BAC',
  'Lai Chau': 'MIEN_BAC',
  'Dien Bien': 'MIEN_BAC',
  'Lao Cai': 'MIEN_BAC',
  'Yen Bai': 'MIEN_BAC',
  'Tuyen Quang': 'MIEN_BAC',
  'Ha Giang': 'MIEN_BAC',
  'Cao Bang': 'MIEN_BAC',
  'Bac Kan': 'MIEN_BAC',
  'Lang Son': 'MIEN_BAC',

  // === Mien Trung ===
  'Da Nang': 'MIEN_TRUNG',
  'Thua Thien Hue': 'MIEN_TRUNG',
  'Quang Nam': 'MIEN_TRUNG',
  'Quang Ngai': 'MIEN_TRUNG',
  'Binh Dinh': 'MIEN_TRUNG',
  'Phu Yen': 'MIEN_TRUNG',
  'Khanh Hoa': 'MIEN_TRUNG',
  'Quang Binh': 'MIEN_TRUNG',
  'Quang Tri': 'MIEN_TRUNG',
  'Ha Tinh': 'MIEN_TRUNG',
  'Nghe An': 'MIEN_TRUNG',
  'Thanh Hoa': 'MIEN_TRUNG',
  'Kon Tum': 'MIEN_TRUNG',
  'Gia Lai': 'MIEN_TRUNG',
  'Dak Lak': 'MIEN_TRUNG',
  'Dak Nong': 'MIEN_TRUNG',
};

// Ham tinh phi van chuyen
export function calculateShippingFee(province: string): number {
  const region = PROVINCE_REGIONS[province];

  if (!region) {
    // Mac dinh mien Trung neu khong tim thay (phi cao nhat)
    return SHIPPING_FEES.MIEN_TRUNG;
  }

  return SHIPPING_FEES[region];
}
