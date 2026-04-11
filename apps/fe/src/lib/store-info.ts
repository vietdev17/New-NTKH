/**
 * Thông tin cửa hàng — chỉnh sửa tại đây, tự động cập nhật toàn bộ website
 */
export const STORE = {
  // Tên hiển thị
  name: 'Nội Thất Khánh Huyền',
  shortName: 'NTKH',

  // Domain & URL
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://noithatkhanhhuyen.com',
  domain: 'noithatkhanhhuyen.com',

  // Địa chỉ
  city: 'Đồng Xoài',
  province: 'Bình Phước',
  country: 'Việt Nam',
  countryCode: 'VN',
  get address() {
    return `${this.city}, ${this.province}, ${this.country}`;
  },

  // Liên hệ
  phone: '039 465 5656',
  email: 'nguyenngochuyen27031998@gmail.com',
  zalo: '',
  facebook: 'https://www.facebook.com/Noithatkhanhhuyen/',

  // SEO
  description:
    'Nội Thất Đồng Xoài Bình Phước - Nội Thất Khánh Huyền chuyên cung cấp nội thất gỗ, nhựa giả mây, ga giường, chăn gối đệm, bàn trang điểm, combo phòng ngủ. Giá tốt nhất Đồng Xoài, giao hàng toàn quốc, miễn phí vận chuyển Bình Phước.',
  keywords: [
    'noithatkhanhhuyen',
    'noithatkhanhhuyen.com',
    'nội thất Khánh Huyền',
    'nội thất Đồng Xoài',
    'nội thất Bình Phước',
    'nội thất đồng xoài',
    'nội thất bình phước',
    'nội thất đồng xoài bình phước',
    'mua nội thất đồng xoài',
    'mua nội thất bình phước',
    'nội thất gỗ đồng xoài',
    'nội thất gỗ bình phước',
    'nội thất nhựa giả mây',
    'ga giường chăn gối đệm',
    'bàn trang điểm',
    'combo phòng ngủ',
    'giường tủ bàn ghế',
    'sofa đồng xoài',
    'sofa bình phước',
    'Khánh Huyền',
    // Long-tail keywords for SEO
    'nội thất đồng xoài bình phước giá tốt',
    'mua nội thất đồng xoài bình phước online',
    'cửa hàng nội thất đồng xoài bình phước',
    'nội thất gỗ đồng xoài bình phước giá rẻ',
    'nội thất phòng ngủ đồng xoài bình phước',
    'nội thất phòng khách đồng xoài bình phước',
    'bàn ghế gỗ đồng xoài bình phước',
    'sofa đồng xoài bình phước giá tốt',
    'ga giường đồng xoài bình phước',
    'nội thất trẻ em đồng xoài bình phước',
  ],

  // Hình ảnh mặc định cho OG/Social share
  ogImage: '/images/og-image.png',
  logo: '/images/logo.svg',       // logo chính (màu nâu)
  logoWhite: '/images/logo-white.svg', // logo cho nền tối

  // Danh mục sản phẩm chính
  categories: [
    'Nội thất gỗ',
    'Nội thất nhựa giả mây',
    'Ga giường, chăn gối, đệm',
    'Bàn trang điểm',
    'Combo phòng ngủ',
    'Bàn ghế',
  ],

  // Điểm mạnh (dùng trong why-choose-us, footer, SEO)
  sellingPoints: [
    'Giá cạnh tranh, cam kết giá tốt nhất thị trường',
    'Miễn phí vận chuyển trong bán kính 150km',
    'Hàng chính hãng, chất lượng đảm bảo, có bảo hành',
    'Đa dạng mẫu mã, hàng trăm sản phẩm để lựa chọn',
  ],

  // Chính sách
  policy: {
    freeShippingRadius: 150, // km
    returnDays: 30,
    warrantyNote: 'Theo nhà sản xuất',
  },

  // Copyright
  get copyright() {
    return `© ${new Date().getFullYear()} ${this.name}. Tất cả quyền được bảo lưu.`;
  },
} as const;
