/**
 * SEED SCRIPT - He thong ban noi that Viet Nam
 * Chay: npx ts-node -r tsconfig-paths/register src/seed.ts
 */

import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/furniture-store';

// ===================== HELPERS =====================
const id = () => new Types.ObjectId();
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

function makeSku(prefix: string, colorCode: string, dimCode: string): string {
  return `${prefix}-${colorCode}-${dimCode}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ===================== SCHEMAS (minimal, for seeding) =====================

const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  phone: { type: String, unique: true },
  avatar: String,
  role: { type: String, default: 'customer' },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  isGoogleAuth: { type: Boolean, default: false },
  addresses: { type: Array, default: [] },
  loyaltyPoints: { type: Number, default: 0 },
  staffCode: String,
  vehicleType: String,
  licensePlate: String,
  status: String,
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  image: String,
  parentId: { type: Types.ObjectId, ref: 'Category', default: null },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isCombo: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  shortDescription: String,
  description: String,
  categoryId: { type: Types.ObjectId, ref: 'Category' },
  comboCategoryId: { type: Types.ObjectId, ref: 'Category' },
  basePrice: Number,
  costPrice: Number,
  brand: String,
  material: String,
  origin: String,
  images: { type: [String], default: [] },
  colors: { type: Array, default: [] },
  dimensions: { type: Array, default: [] },
  variants: { type: Array, default: [] },
  specifications: { type: Object, default: {} },
  status: { type: String, default: 'active' },
  tags: { type: [String], default: [] },
  comboItems: { type: Array, default: [] },
  seo: { type: Object, default: {} },
  viewCount: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  rating: { type: Object, default: { average: 0, count: 0 } },
}, { timestamps: true });

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  description: String,
  discountType: String,
  discountValue: Number,
  minOrderValue: { type: Number, default: 0 },
  maxDiscountAmount: Number,
  startDate: Date,
  endDate: Date,
  maxUsage: Number,
  usedCount: { type: Number, default: 0 },
  maxUsagePerUser: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  scope: { type: String, default: 'all' },
  applicableCategories: { type: [Types.ObjectId], default: [] },
  applicableProducts: { type: [Types.ObjectId], default: [] },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customerId: { type: Types.ObjectId, ref: 'User' },
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  items: { type: Array, default: [] },
  subtotal: Number,
  discountAmount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  total: Number,
  status: { type: String, default: 'pending' },
  paymentMethod: { type: String, default: 'cod' },
  paymentStatus: { type: String, default: 'unpaid' },
  shippingFullName: String,
  shippingPhone: String,
  shippingStreet: String,
  shippingWard: String,
  shippingDistrict: String,
  shippingProvince: String,
  statusHistory: { type: Array, default: [] },
  isPosOrder: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  productId: { type: Types.ObjectId, ref: 'Product' },
  userId: { type: Types.ObjectId, ref: 'User' },
  orderId: { type: Types.ObjectId, ref: 'Order' },
  rating: Number,
  title: String,
  comment: String,
  images: { type: [String], default: [] },
  status: { type: String, default: 'approved' },
  helpfulCount: { type: Number, default: 0 },
  unhelpfulCount: { type: Number, default: 0 },
  helpfulVotes: { type: Array, default: [] },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  userId: { type: Types.ObjectId, ref: 'User' },
  type: String,
  title: String,
  message: String,
  data: { type: Object, default: {} },
  isRead: { type: Boolean, default: false },
  actionUrl: String,
}, { timestamps: true });

const ShipperLocationSchema = new mongoose.Schema({
  shipperId: { type: Types.ObjectId, ref: 'User' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [106.6297, 10.8231] },
  },
  status: { type: String, default: 'offline' },
  accuracy: Number,
  currentOrderId: { type: Types.ObjectId, ref: 'Order' },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ShipperLocationSchema.index({ location: '2dsphere' });

// ===================== MODELS =====================
const UserModel = mongoose.model('User', UserSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);
const ProductModel = mongoose.model('Product', ProductSchema);
const CouponModel = mongoose.model('Coupon', CouponSchema);
const OrderModel = mongoose.model('Order', OrderSchema);
const ReviewModel = mongoose.model('Review', ReviewSchema);
const NotificationModel = mongoose.model('Notification', NotificationSchema);
const ShipperLocationModel = mongoose.model('ShipperLocation', ShipperLocationSchema);

// ===================== SEED DATA =====================

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!');

  // Clear all collections
  console.log('🗑️  Clearing old data...');
  await Promise.all([
    UserModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    ProductModel.deleteMany({}),
    CouponModel.deleteMany({}),
    OrderModel.deleteMany({}),
    ReviewModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    ShipperLocationModel.deleteMany({}),
  ]);

  const hashPw = (pw: string) => bcrypt.hashSync(pw, 10);

  // ===================== USERS =====================
  console.log('👥 Seeding users...');

  const adminId = id();
  const managerId = id();
  const staffId = id();
  const shipperId = id();
  const customer1Id = id();
  const customer2Id = id();
  const customer3Id = id();
  const customer4Id = id();
  const customer5Id = id();

  await UserModel.insertMany([
    {
      _id: adminId,
      fullName: 'Admin Hệ Thống',
      email: 'admin@furniture.vn',
      password: hashPw('Admin@123'),
      phone: '0900000001',
      role: 'admin',
      isActive: true,
      staffCode: 'ADMIN001',
      loyaltyPoints: 0,
    },
    {
      _id: managerId,
      fullName: 'Nguyễn Quản Lý',
      email: 'manager@furniture.vn',
      password: hashPw('Manager@123'),
      phone: '0900000002',
      role: 'manager',
      isActive: true,
      staffCode: 'MGR001',
      loyaltyPoints: 0,
    },
    {
      _id: staffId,
      fullName: 'Trần Thu Ngân',
      email: 'pos@furniture.vn',
      password: hashPw('Staff@123'),
      phone: '0900000003',
      role: 'staff',
      isActive: true,
      staffCode: 'STAFF001',
      loyaltyPoints: 0,
    },
    {
      _id: shipperId,
      fullName: 'Lê Văn Giao',
      email: 'shipper@furniture.vn',
      password: hashPw('Shipper@123'),
      phone: '0900000004',
      role: 'shipper',
      isActive: true,
      vehicleType: 'motorcycle',
      licensePlate: '51G-12345',
      status: 'available',
      loyaltyPoints: 0,
    },
    {
      _id: customer1Id,
      fullName: 'Phạm Thị Hoa',
      email: 'hoa.pham@gmail.com',
      password: hashPw('Customer@123'),
      phone: '0901234561',
      role: 'customer',
      loyaltyPoints: 1200,
      addresses: [{
        _id: new Types.ObjectId(),
        label: 'Nhà riêng',
        fullName: 'Phạm Thị Hoa',
        phone: '0901234561',
        street: '123 Lê Lợi',
        ward: 'Bến Nghé',
        district: 'Quận 1',
        province: 'Hồ Chí Minh',
        isDefault: true,
      }],
    },
    {
      _id: customer2Id,
      fullName: 'Nguyễn Minh Tuấn',
      email: 'tuan.nguyen@gmail.com',
      password: hashPw('Customer@123'),
      phone: '0901234562',
      role: 'customer',
      loyaltyPoints: 850,
      addresses: [{
        _id: new Types.ObjectId(),
        label: 'Nhà riêng',
        fullName: 'Nguyễn Minh Tuấn',
        phone: '0901234562',
        street: '45 Nguyễn Huệ',
        ward: 'Bến Nghé',
        district: 'Quận 1',
        province: 'Hồ Chí Minh',
        isDefault: true,
      }],
    },
    {
      _id: customer3Id,
      fullName: 'Trần Thị Mai',
      email: 'mai.tran@gmail.com',
      password: hashPw('Customer@123'),
      phone: '0901234563',
      role: 'customer',
      loyaltyPoints: 500,
    },
    {
      _id: customer4Id,
      fullName: 'Lê Hoàng Nam',
      email: 'nam.le@gmail.com',
      password: hashPw('Customer@123'),
      phone: '0901234564',
      role: 'customer',
      loyaltyPoints: 2400,
      addresses: [{
        _id: new Types.ObjectId(),
        label: 'Văn phòng',
        fullName: 'Lê Hoàng Nam',
        phone: '0901234564',
        street: '88 Hoàng Văn Thụ',
        ward: 'Phường 9',
        district: 'Phú Nhuận',
        province: 'Hồ Chí Minh',
        isDefault: true,
      }],
    },
    {
      _id: customer5Id,
      fullName: 'Võ Thị Thanh',
      email: 'thanh.vo@gmail.com',
      password: hashPw('Customer@123'),
      phone: '0901234565',
      role: 'customer',
      loyaltyPoints: 300,
    },
  ]);

  // Shipper location
  await ShipperLocationModel.create({
    shipperId,
    location: { type: 'Point', coordinates: [106.6297, 10.8231] },
    status: 'available',
  });

  console.log('✅ Users seeded (9 users)');

  // ===================== CATEGORIES =====================
  console.log('📁 Seeding categories...');

  const catSofaId = id();
  const catDiningId = id();
  const catBedroomId = id();
  const catStorageId = id();
  const catOfficeId = id();
  const catDecoId = id();
  const catComboId = id();

  // Children
  const catSofaGocId = id();
  const catSofaBangId = id();
  const catGheDonId = id();
  const catSofaGiuongId = id();
  const catBanAnId = id();
  const catGheAnId = id();
  const catGiuongId = id();
  const catTuDauGiuongId = id();
  const catTuQuanAoId = id();
  const catKeSachId = id();
  const catTuGiayId = id();
  const catBanVanPhongId = id();
  const catGheVanPhongId = id();

  await CategoryModel.insertMany([
    // Parent categories
    { _id: catSofaId, name: 'Sofa & Ghế Sofa', slug: 'sofa-ghe-sofa', description: 'Các loại sofa và ghế sofa cao cấp', sortOrder: 1, image: 'https://placehold.co/400x300/FF6B6B/white?text=Sofa' },
    { _id: catDiningId, name: 'Bàn Ăn & Ghế Ăn', slug: 'ban-an-ghe-an', description: 'Bộ bàn ghế phòng ăn', sortOrder: 2, image: 'https://placehold.co/400x300/4ECDC4/white?text=Dining' },
    { _id: catBedroomId, name: 'Phòng Ngủ', slug: 'phong-ngu', description: 'Nội thất phòng ngủ cao cấp', sortOrder: 3, image: 'https://placehold.co/400x300/45B7D1/white?text=Bedroom' },
    { _id: catStorageId, name: 'Tủ & Kệ Lưu Trữ', slug: 'tu-ke-luu-tru', description: 'Tủ quần áo, kệ sách, tủ giày', sortOrder: 4, image: 'https://placehold.co/400x300/96CEB4/white?text=Storage' },
    { _id: catOfficeId, name: 'Nội Thất Văn Phòng', slug: 'noi-that-van-phong', description: 'Bàn và ghế làm việc', sortOrder: 5, image: 'https://placehold.co/400x300/FFEAA7/white?text=Office' },
    { _id: catDecoId, name: 'Phòng Khách', slug: 'phong-khach', description: 'Nội thất trang trí phòng khách', sortOrder: 6, image: 'https://placehold.co/400x300/DDA0DD/white?text=Living' },
    { _id: catComboId, name: 'Combo Nội Thất', slug: 'combo-noi-that', description: 'Bộ combo nội thất tiết kiệm', sortOrder: 7, isCombo: true, image: 'https://placehold.co/400x300/F0A500/white?text=Combo' },

    // Children of Sofa
    { _id: catSofaGocId, name: 'Sofa Góc', slug: 'sofa-goc', parentId: catSofaId, sortOrder: 1 },
    { _id: catSofaBangId, name: 'Sofa Băng', slug: 'sofa-bang', parentId: catSofaId, sortOrder: 2 },
    { _id: catGheDonId, name: 'Ghế Đơn & Armchair', slug: 'ghe-don-armchair', parentId: catSofaId, sortOrder: 3 },
    { _id: catSofaGiuongId, name: 'Sofa Giường', slug: 'sofa-giuong', parentId: catSofaId, sortOrder: 4 },

    // Children of Dining
    { _id: catBanAnId, name: 'Bàn Ăn', slug: 'ban-an', parentId: catDiningId, sortOrder: 1 },
    { _id: catGheAnId, name: 'Ghế Ăn', slug: 'ghe-an', parentId: catDiningId, sortOrder: 2 },

    // Children of Bedroom
    { _id: catGiuongId, name: 'Giường Ngủ', slug: 'giuong-ngu', parentId: catBedroomId, sortOrder: 1 },
    { _id: catTuDauGiuongId, name: 'Tủ Đầu Giường', slug: 'tu-dau-giuong', parentId: catBedroomId, sortOrder: 2 },

    // Children of Storage
    { _id: catTuQuanAoId, name: 'Tủ Quần Áo', slug: 'tu-quan-ao', parentId: catStorageId, sortOrder: 1 },
    { _id: catKeSachId, name: 'Kệ Sách', slug: 'ke-sach', parentId: catStorageId, sortOrder: 2 },
    { _id: catTuGiayId, name: 'Tủ Giày', slug: 'tu-giay', parentId: catStorageId, sortOrder: 3 },

    // Children of Office
    { _id: catBanVanPhongId, name: 'Bàn Làm Việc', slug: 'ban-lam-viec', parentId: catOfficeId, sortOrder: 1 },
    { _id: catGheVanPhongId, name: 'Ghế Văn Phòng', slug: 'ghe-van-phong', parentId: catOfficeId, sortOrder: 2 },
  ]);

  console.log('✅ Categories seeded (20 categories)');

  // ===================== PRODUCTS =====================
  console.log('📦 Seeding products...');

  // Helper to build colors + dimensions + variants
  function buildProduct(opts: {
    name: string;
    slug: string;
    categoryId: Types.ObjectId;
    basePrice: number;
    costPrice: number;
    brand: string;
    material: string;
    origin: string;
    shortDescription: string;
    description: string;
    colors: { id: string; name: string; hexCode: string; priceModifier: number }[];
    dimensions: { id: string; label: string; width: number; depth: number; height: number; weight: number; priceModifier: number }[];
    specs: Record<string, string>;
    tags: string[];
    totalSold?: number;
    viewCount?: number;
    rating?: { average: number; count: number };
  }) {
    const { colors, dimensions, basePrice, slug } = opts;
    const prefix = slug.substring(0, 4).toUpperCase().replace(/-/g, '');

    const variants = [];
    for (const color of colors) {
      for (const dim of dimensions) {
        const price = basePrice + color.priceModifier + dim.priceModifier;
        variants.push({
          sku: makeSku(prefix, color.id.substring(0, 2).toUpperCase(), dim.id.substring(0, 2).toUpperCase()),
          colorId: color.id,
          dimensionId: dim.id,
          price,
          costPrice: Math.round(price * 0.6),
          stock: rand(10, 80),
          minStock: 5,
          available: true,
        });
      }
    }

    const images = [
      `https://placehold.co/800x600/E8D5B7/333333?text=${encodeURIComponent(opts.name.substring(0, 15))}`,
      `https://placehold.co/800x600/D4C5A9/333333?text=${encodeURIComponent(opts.brand)}`,
    ];

    return {
      name: opts.name,
      slug: opts.slug,
      shortDescription: opts.shortDescription,
      description: opts.description,
      categoryId: opts.categoryId,
      basePrice: opts.basePrice,
      costPrice: opts.costPrice,
      brand: opts.brand,
      material: opts.material,
      origin: opts.origin,
      images,
      colors: colors.map(c => ({ ...c, colorFamily: 'neutral', images: [], available: true })),
      dimensions: dimensions.map(d => ({ ...d, available: true })),
      variants,
      specifications: opts.specs,
      status: 'active',
      tags: opts.tags,
      totalSold: opts.totalSold ?? rand(20, 300),
      viewCount: opts.viewCount ?? rand(100, 2000),
      rating: opts.rating ?? { average: randFloat(3.8, 5.0), count: rand(5, 80) },
      isDeleted: false,
    };
  }

  // ---- Sofa Products ----
  const sofaGocL = buildProduct({
    name: 'Sofa Góc Chữ L Vải Bọc Premium', slug: 'sofa-goc-chu-l-vai-boc-premium',
    categoryId: catSofaGocId, basePrice: 15500000, costPrice: 9300000,
    brand: 'FurnitureVN', material: 'Khung gỗ tự nhiên, bọc vải Bỉ cao cấp', origin: 'Việt Nam',
    shortDescription: 'Sofa góc chữ L sang trọng, vải bọc nhập khẩu từ Bỉ',
    description: 'Sofa góc chữ L với thiết kế hiện đại, khung gỗ tự nhiên bền chắc. Vải bọc nhập khẩu từ Bỉ, chống bám bẩn, dễ vệ sinh. Phù hợp cho phòng khách rộng từ 20m2 trở lên.',
    colors: [
      { id: 'gray', name: 'Xám', hexCode: '#808080', priceModifier: 0 },
      { id: 'navy', name: 'Xanh Navy', hexCode: '#1B3A6B', priceModifier: 500000 },
      { id: 'beige', name: 'Be Kem', hexCode: '#F5F5DC', priceModifier: 0 },
    ],
    dimensions: [
      { id: 'size-l', label: '250x160x85cm', width: 250, depth: 160, height: 85, weight: 65, priceModifier: 0 },
      { id: 'size-xl', label: '280x180x85cm', width: 280, depth: 180, height: 85, weight: 75, priceModifier: 2000000 },
    ],
    specs: { 'Chất liệu khung': 'Gỗ tự nhiên', 'Chất liệu bọc': 'Vải Bỉ', 'Số chỗ ngồi': '4-5 người', 'Bảo hành': '24 tháng' },
    tags: ['sofa', 'goc', 'vai-boc', 'phong-khach'],
    totalSold: 156, rating: { average: 4.6, count: 28 },
  });

  const sofaBang3Cho = buildProduct({
    name: 'Sofa Băng 3 Chỗ Ngồi Da Thật', slug: 'sofa-bang-3-cho-da-that',
    categoryId: catSofaBangId, basePrice: 22000000, costPrice: 13200000,
    brand: 'NoiThatXinh', material: 'Khung inox, bọc da bò thật Ý', origin: 'Ý (nhập khẩu)',
    shortDescription: 'Sofa băng 3 chỗ da bò thật nhập khẩu từ Ý, sang trọng và bền đẹp',
    description: 'Sofa băng 3 chỗ ngồi sử dụng da bò thật nhập khẩu từ Ý. Khung inox không gỉ, đệm mút D40 thoải mái. Thiết kế tối giản phù hợp nhiều phong cách nội thất.',
    colors: [
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 0 },
      { id: 'brown', name: 'Nâu', hexCode: '#8B4513', priceModifier: 1000000 },
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 1500000 },
    ],
    dimensions: [
      { id: 'std', label: '220x90x80cm', width: 220, depth: 90, height: 80, weight: 55, priceModifier: 0 },
    ],
    specs: { 'Chất liệu khung': 'Inox 304', 'Chất liệu bọc': 'Da bò thật Ý', 'Số chỗ ngồi': '3 người', 'Bảo hành': '36 tháng' },
    tags: ['sofa', 'bang', 'da-that', 'nhap-khau'],
    totalSold: 89, rating: { average: 4.8, count: 42 },
  });

  const sofaDonMinimalist = buildProduct({
    name: 'Sofa Đơn Minimalist Gỗ Sồi', slug: 'sofa-don-minimalist-go-soi',
    categoryId: catGheDonId, basePrice: 8500000, costPrice: 5100000,
    brand: 'FurnitureVN', material: 'Gỗ sồi tự nhiên, nệm mút D40', origin: 'Việt Nam',
    shortDescription: 'Ghế đơn minimalist chân gỗ sồi, thiết kế Scandinavian hiện đại',
    description: 'Ghế đơn với thiết kế Scandinavian tinh tế. Chân gỗ sồi tự nhiên vững chắc, nệm mút D40 thoải mái. Phù hợp cho phòng đọc sách hoặc góc thư giãn.',
    colors: [
      { id: 'cream', name: 'Kem', hexCode: '#FFFDD0', priceModifier: 0 },
      { id: 'green', name: 'Xanh Lá', hexCode: '#90EE90', priceModifier: 0 },
      { id: 'mustard', name: 'Vàng Mù Tạt', hexCode: '#FFDB58', priceModifier: 0 },
    ],
    dimensions: [
      { id: 'std', label: '90x80x75cm', width: 90, depth: 80, height: 75, weight: 25, priceModifier: 0 },
    ],
    specs: { 'Chất liệu chân': 'Gỗ sồi', 'Chất liệu đệm': 'Mút D40', 'Số chỗ ngồi': '1 người', 'Bảo hành': '12 tháng' },
    tags: ['ghe-don', 'minimalist', 'go-soi', 'scandinavian'],
    totalSold: 210,
  });

  const sofaGiuong = buildProduct({
    name: 'Sofa Giường Đa Năng Gấp Gọn', slug: 'sofa-giuong-da-nang-gap-gon',
    categoryId: catSofaGiuongId, basePrice: 12000000, costPrice: 7200000,
    brand: 'SmartHome', material: 'Khung sắt, vải microfiber', origin: 'Việt Nam',
    shortDescription: 'Sofa có thể gập thành giường, tiết kiệm không gian',
    description: 'Sofa giường đa năng với cơ chế gập gọn thông minh. Có thể chuyển đổi giữa sofa 3 chỗ và giường đôi trong vài giây. Phù hợp cho căn hộ nhỏ, phòng khách kết hợp phòng ngủ.',
    colors: [
      { id: 'gray', name: 'Xám', hexCode: '#A9A9A9', priceModifier: 0 },
      { id: 'darkblue', name: 'Xanh Đậm', hexCode: '#00008B', priceModifier: 0 },
    ],
    dimensions: [
      { id: 'std', label: '200x85x80cm (sofa) / 200x140cm (giường)', width: 200, depth: 140, height: 80, weight: 45, priceModifier: 0 },
    ],
    specs: { 'Kích thước sofa': '200x85x80cm', 'Kích thước giường': '200x140cm', 'Bảo hành': '18 tháng' },
    tags: ['sofa-giuong', 'da-nang', 'gap-gon', 'tiet-kiem'],
    totalSold: 175,
  });

  const sofaGocU = buildProduct({
    name: 'Sofa Góc Chữ U Sang Trọng', slug: 'sofa-goc-chu-u-sang-trong',
    categoryId: catSofaGocId, basePrice: 32000000, costPrice: 19200000,
    brand: 'LuxHome', material: 'Da tổng hợp cao cấp, khung gỗ thông', origin: 'Hàn Quốc',
    shortDescription: 'Sofa góc chữ U cỡ lớn, phù hợp phòng khách trên 30m2',
    description: 'Sofa góc chữ U với thiết kế sang trọng, phù hợp cho những không gian phòng khách rộng lớn. Bề mặt da tổng hợp cao cấp chống thấm, dễ lau chùi.',
    colors: [
      { id: 'ivory', name: 'Ngà', hexCode: '#FFFFF0', priceModifier: 0 },
      { id: 'charcoal', name: 'Xám Than', hexCode: '#36454F', priceModifier: 2000000 },
    ],
    dimensions: [
      { id: 'large', label: '340x220x85cm', width: 340, depth: 220, height: 85, weight: 120, priceModifier: 0 },
    ],
    specs: { 'Số chỗ ngồi': '6-8 người', 'Chất liệu': 'Da tổng hợp PU', 'Bảo hành': '24 tháng', 'Xuất xứ': 'Hàn Quốc' },
    tags: ['sofa', 'goc', 'sang-trong', 'chu-u'],
    totalSold: 45,
  });

  const armchair = buildProduct({
    name: 'Ghế Armchair Bọc Nhung Phong Cách Retro', slug: 'ghe-armchair-boc-nhung-retro',
    categoryId: catGheDonId, basePrice: 6800000, costPrice: 4080000,
    brand: 'VintageDecor', material: 'Khung gỗ tự nhiên, bọc nhung cao cấp', origin: 'Việt Nam',
    shortDescription: 'Ghế armchair bọc nhung phong cách retro, điểm nhấn cho phòng khách',
    description: 'Ghế armchair với thiết kế phong cách retro sang trọng. Chất liệu nhung mềm mịn, màu sắc phong phú. Khung gỗ tự nhiên bền chắc với chân gỗ nâu đẹp mắt.',
    colors: [
      { id: 'velvet-green', name: 'Xanh Ngọc', hexCode: '#1F6357', priceModifier: 0 },
      { id: 'velvet-pink', name: 'Hồng Đậm', hexCode: '#C71585', priceModifier: 0 },
      { id: 'velvet-blue', name: 'Xanh Dương', hexCode: '#4169E1', priceModifier: 0 },
      { id: 'velvet-gold', name: 'Vàng Gold', hexCode: '#FFD700', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'std', label: '75x80x90cm', width: 75, depth: 80, height: 90, weight: 18, priceModifier: 0 },
    ],
    specs: { 'Chất liệu bọc': 'Nhung cao cấp', 'Chân ghế': 'Gỗ tự nhiên', 'Bảo hành': '12 tháng' },
    tags: ['ghe-don', 'armchair', 'retro', 'nhung'],
    totalSold: 320,
  });

  // ---- Dining Products ----
  const banAnDa = buildProduct({
    name: 'Bàn Ăn Mặt Đá Marble Chân Sắt', slug: 'ban-an-mat-da-marble-chan-sat',
    categoryId: catBanAnId, basePrice: 18500000, costPrice: 11100000,
    brand: 'StoneArt', material: 'Mặt đá marble tự nhiên, chân sắt sơn tĩnh điện', origin: 'Ý',
    shortDescription: 'Bàn ăn mặt đá marble sang trọng, chân sắt thiết kế tinh tế',
    description: 'Bàn ăn cao cấp với mặt đá marble tự nhiên nhập khẩu từ Ý. Chân sắt sơn tĩnh điện bền màu. Thiết kế hiện đại phù hợp với nhiều phong cách nội thất.',
    colors: [
      { id: 'white-marble', name: 'Đá Trắng', hexCode: '#F8F8F8', priceModifier: 0 },
      { id: 'black-marble', name: 'Đá Đen', hexCode: '#1C1C1C', priceModifier: 2000000 },
    ],
    dimensions: [
      { id: '4-seat', label: '120x75x75cm (4 người)', width: 120, depth: 75, height: 75, weight: 35, priceModifier: 0 },
      { id: '6-seat', label: '160x85x75cm (6 người)', width: 160, depth: 85, height: 75, weight: 45, priceModifier: 4000000 },
      { id: '8-seat', label: '200x95x75cm (8 người)', width: 200, depth: 95, height: 75, weight: 58, priceModifier: 8000000 },
    ],
    specs: { 'Chất liệu mặt bàn': 'Đá marble tự nhiên', 'Chất liệu chân': 'Sắt sơn tĩnh điện', 'Bảo hành': '24 tháng' },
    tags: ['ban-an', 'marble', 'sang-trong', 'nhap-khau'],
    totalSold: 78,
  });

  const banAnGo = buildProduct({
    name: 'Bàn Ăn Gỗ Óc Chó Nguyên Tấm', slug: 'ban-an-go-oc-cho-nguyen-tam',
    categoryId: catBanAnId, basePrice: 25000000, costPrice: 15000000,
    brand: 'WoodMaster', material: 'Gỗ óc chó nguyên tấm, chân gỗ sồi', origin: 'Việt Nam',
    shortDescription: 'Bàn ăn gỗ óc chó nguyên tấm, vân gỗ tự nhiên độc đáo',
    description: 'Bàn ăn làm từ gỗ óc chó nguyên tấm với vân gỗ tự nhiên độc đáo, mỗi chiếc là một tác phẩm nghệ thuật. Chân gỗ sồi chắc chắn.',
    colors: [
      { id: 'natural', name: 'Tự Nhiên', hexCode: '#8B6914', priceModifier: 0 },
      { id: 'dark', name: 'Tối Màu', hexCode: '#3D2B1F', priceModifier: 0 },
    ],
    dimensions: [
      { id: '4-seat', label: '140x80x75cm (4 người)', width: 140, depth: 80, height: 75, weight: 50, priceModifier: 0 },
      { id: '6-seat', label: '180x90x75cm (6 người)', width: 180, depth: 90, height: 75, weight: 65, priceModifier: 5000000 },
    ],
    specs: { 'Chất liệu': 'Gỗ óc chó nguyên tấm', 'Xử lý bề mặt': 'Dầu tự nhiên + Lacquer', 'Bảo hành': '36 tháng' },
    tags: ['ban-an', 'go-oc-cho', 'cao-cap', 'nguyen-tam'],
    totalSold: 34,
  });

  const gheAnDem = buildProduct({
    name: 'Ghế Ăn Có Đệm Bọc Vải Chân Gỗ', slug: 'ghe-an-co-dem-boc-vai-chan-go',
    categoryId: catGheAnId, basePrice: 1850000, costPrice: 1110000,
    brand: 'FurnitureVN', material: 'Chân gỗ beech, đệm mút D30, bọc vải', origin: 'Việt Nam',
    shortDescription: 'Ghế ăn êm ái với đệm mút, chân gỗ beech bền đẹp',
    description: 'Ghế ăn thiết kế đơn giản nhưng tinh tế. Chân gỗ beech tự nhiên vững chắc, đệm mút D30 êm ái khi ngồi lâu. Phù hợp với nhiều loại bàn ăn.',
    colors: [
      { id: 'beige', name: 'Be', hexCode: '#F5F5DC', priceModifier: 0 },
      { id: 'gray', name: 'Xám', hexCode: '#808080', priceModifier: 0 },
      { id: 'navy', name: 'Navy', hexCode: '#000080', priceModifier: 200000 },
      { id: 'green', name: 'Xanh Lá', hexCode: '#556B2F', priceModifier: 200000 },
    ],
    dimensions: [
      { id: 'std', label: '45x50x85cm', width: 45, depth: 50, height: 85, weight: 6, priceModifier: 0 },
    ],
    specs: { 'Chân ghế': 'Gỗ beech', 'Đệm': 'Mút D30', 'Tải trọng': '120kg', 'Bảo hành': '12 tháng' },
    tags: ['ghe-an', 'go', 'dem', 'tiet-kiem'],
    totalSold: 580,
  });

  const gheAnKimLoai = buildProduct({
    name: 'Ghế Ăn Khung Kim Loại Phong Cách Industrial', slug: 'ghe-an-khung-kim-loai-industrial',
    categoryId: catGheAnId, basePrice: 2200000, costPrice: 1320000,
    brand: 'MetalWorks', material: 'Khung sắt, mặt gỗ MDF, đệm da PU', origin: 'Việt Nam',
    shortDescription: 'Ghế ăn phong cách industrial với khung sắt và mặt gỗ',
    description: 'Ghế ăn phong cách industrial hiện đại. Khung sắt sơn tĩnh điện bền đẹp, mặt ngồi gỗ MDF có đệm da PU. Phù hợp với bàn ăn phong cách công nghiệp.',
    colors: [
      { id: 'black-wood', name: 'Đen-Gỗ', hexCode: '#000000', priceModifier: 0 },
      { id: 'white-wood', name: 'Trắng-Gỗ', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'gold-wood', name: 'Vàng-Gỗ', hexCode: '#CFB53B', priceModifier: 300000 },
    ],
    dimensions: [
      { id: 'std', label: '42x48x87cm', width: 42, depth: 48, height: 87, weight: 7, priceModifier: 0 },
    ],
    specs: { 'Khung': 'Sắt sơn tĩnh điện', 'Mặt ngồi': 'Gỗ MDF + da PU', 'Tải trọng': '130kg', 'Bảo hành': '12 tháng' },
    tags: ['ghe-an', 'industrial', 'sat', 'hien-dai'],
    totalSold: 420,
  });

  // ---- Bedroom Products ----
  const giuongNguGo = buildProduct({
    name: 'Giường Ngủ Gỗ Sồi Tự Nhiên', slug: 'giuong-ngu-go-soi-tu-nhien',
    categoryId: catGiuongId, basePrice: 14500000, costPrice: 8700000,
    brand: 'WoodMaster', material: 'Gỗ sồi tự nhiên cao cấp', origin: 'Việt Nam',
    shortDescription: 'Giường ngủ gỗ sồi tự nhiên bền đẹp, thiết kế sang trọng',
    description: 'Giường ngủ làm từ gỗ sồi tự nhiên cao cấp. Thiết kế đơn giản nhưng tinh tế, phù hợp với nhiều phong cách phòng ngủ từ hiện đại đến cổ điển.',
    colors: [
      { id: 'natural', name: 'Tự Nhiên', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'walnut', name: 'Óc Chó', hexCode: '#5C4033', priceModifier: 1500000 },
    ],
    dimensions: [
      { id: '1m4', label: '1m4 (140x200cm)', width: 140, depth: 200, height: 45, weight: 50, priceModifier: 0 },
      { id: '1m6', label: '1m6 (160x200cm)', width: 160, depth: 200, height: 45, weight: 58, priceModifier: 2000000 },
      { id: '1m8', label: '1m8 (180x200cm)', width: 180, depth: 200, height: 45, weight: 65, priceModifier: 3500000 },
    ],
    specs: { 'Chất liệu': 'Gỗ sồi tự nhiên', 'Tải trọng': '300kg', 'Bảo hành': '24 tháng' },
    tags: ['giuong', 'go-soi', 'phong-ngu'],
    totalSold: 142,
  });

  const giuongNganKeo = buildProduct({
    name: 'Giường Ngủ Có Ngăn Kéo Đa Năng', slug: 'giuong-ngu-co-ngan-keo-da-nang',
    categoryId: catGiuongId, basePrice: 18000000, costPrice: 10800000,
    brand: 'SmartHome', material: 'Gỗ công nghiệp MDF phủ melamine', origin: 'Việt Nam',
    shortDescription: 'Giường ngủ tích hợp ngăn kéo lưu trữ, tối ưu không gian',
    description: 'Giường ngủ thông minh với 4-6 ngăn kéo tích hợp bên dưới. Giải pháp lưu trữ tuyệt vời cho căn phòng ngủ nhỏ. Chất liệu MDF phủ melamine bền đẹp, chống ẩm.',
    colors: [
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'gray', name: 'Xám', hexCode: '#C0C0C0', priceModifier: 0 },
      { id: 'oak', name: 'Sồi', hexCode: '#C19A6B', priceModifier: 1000000 },
    ],
    dimensions: [
      { id: '1m4', label: '1m4 (140x200cm)', width: 140, depth: 200, height: 50, weight: 70, priceModifier: 0 },
      { id: '1m6', label: '1m6 (160x200cm)', width: 160, depth: 200, height: 50, weight: 80, priceModifier: 2500000 },
    ],
    specs: { 'Chất liệu': 'MDF phủ melamine', 'Ngăn kéo': '4-6 ngăn', 'Bảo hành': '18 tháng' },
    tags: ['giuong', 'ngan-keo', 'da-nang', 'tiet-kiem-khong-gian'],
    totalSold: 98,
  });

  const giuongKingSize = buildProduct({
    name: 'Giường King Size Da Bọc Cao Cấp', slug: 'giuong-king-size-da-boc-cao-cap',
    categoryId: catGiuongId, basePrice: 35000000, costPrice: 21000000,
    brand: 'LuxHome', material: 'Khung gỗ tự nhiên, đầu giường bọc da thật', origin: 'Ý',
    shortDescription: 'Giường king size sang trọng đầu giường bọc da thật nhập khẩu',
    description: 'Giường king size cao cấp với đầu giường bọc da thật nhập khẩu. Khung gỗ tự nhiên chắc chắn, hệ thống nan giường thoáng khí. Mang lại giấc ngủ hoàng gia.',
    colors: [
      { id: 'ivory', name: 'Ngà', hexCode: '#FFFFF0', priceModifier: 0 },
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 0 },
      { id: 'brown', name: 'Nâu Cognac', hexCode: '#954535', priceModifier: 2000000 },
    ],
    dimensions: [
      { id: '1m8', label: 'King 1m8 (180x200cm)', width: 180, depth: 200, height: 55, weight: 90, priceModifier: 0 },
      { id: '2m', label: 'Super King 2m (200x200cm)', width: 200, depth: 200, height: 55, weight: 100, priceModifier: 5000000 },
    ],
    specs: { 'Chất liệu đầu giường': 'Da thật Ý', 'Chất liệu khung': 'Gỗ tự nhiên', 'Bảo hành': '36 tháng' },
    tags: ['giuong', 'king-size', 'da-that', 'sang-trong'],
    totalSold: 28,
  });

  const tuDauGiuong = buildProduct({
    name: 'Tủ Đầu Giường 2 Ngăn Gỗ Tự Nhiên', slug: 'tu-dau-giuong-2-ngan-go-tu-nhien',
    categoryId: catTuDauGiuongId, basePrice: 3500000, costPrice: 2100000,
    brand: 'WoodMaster', material: 'Gỗ tự nhiên', origin: 'Việt Nam',
    shortDescription: 'Tủ đầu giường 2 ngăn gỗ tự nhiên, thiết kế tinh tế',
    description: 'Tủ đầu giường với thiết kế 2 ngăn kéo tiện dụng. Chất liệu gỗ tự nhiên bền đẹp với nhiều màu sắc phù hợp nội thất.',
    colors: [
      { id: 'natural', name: 'Tự Nhiên', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'walnut', name: 'Óc Chó', hexCode: '#5C4033', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'std', label: '45x40x55cm', width: 45, depth: 40, height: 55, weight: 15, priceModifier: 0 },
    ],
    specs: { 'Số ngăn': '2 ngăn kéo', 'Chất liệu': 'Gỗ tự nhiên', 'Bảo hành': '12 tháng' },
    tags: ['tu-dau-giuong', 'phong-ngu', 'go'],
    totalSold: 235,
  });

  // ---- Storage Products ----
  const tuQuanAo4Canh = buildProduct({
    name: 'Tủ Quần Áo 4 Cánh Gương', slug: 'tu-quan-ao-4-canh-guong',
    categoryId: catTuQuanAoId, basePrice: 16500000, costPrice: 9900000,
    brand: 'StorePro', material: 'Gỗ MDF phủ melamine, gương cường lực', origin: 'Việt Nam',
    shortDescription: 'Tủ quần áo 4 cánh có gương, thiết kế thông minh rộng rãi',
    description: 'Tủ quần áo 4 cánh với 2 cánh gương cường lực. Bên trong được thiết kế thông minh với ngăn treo quần áo dài, ngăn kéo phụ kiện và ngăn để đồ. Tối ưu không gian lưu trữ.',
    colors: [
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'oak', name: 'Sồi', hexCode: '#C19A6B', priceModifier: 1000000 },
      { id: 'gray', name: 'Xám', hexCode: '#808080', priceModifier: 0 },
    ],
    dimensions: [
      { id: '1m6', label: '160x60x210cm', width: 160, depth: 60, height: 210, weight: 95, priceModifier: 0 },
      { id: '2m', label: '200x60x210cm', width: 200, depth: 60, height: 210, weight: 115, priceModifier: 3000000 },
      { id: '2m4', label: '240x60x210cm', width: 240, depth: 60, height: 210, weight: 135, priceModifier: 6000000 },
    ],
    specs: { 'Chất liệu': 'MDF phủ melamine', 'Gương': 'Cường lực 5mm', 'Bảo hành': '24 tháng' },
    tags: ['tu-quan-ao', 'guong', 'phong-ngu', 'luu-tru'],
    totalSold: 165,
  });

  const keSach6Ngan = buildProduct({
    name: 'Kệ Sách 6 Ngăn Gỗ Tự Nhiên', slug: 'ke-sach-6-ngan-go-tu-nhien',
    categoryId: catKeSachId, basePrice: 4200000, costPrice: 2520000,
    brand: 'FurnitureVN', material: 'Gỗ tự nhiên xử lý chống mối mọt', origin: 'Việt Nam',
    shortDescription: 'Kệ sách 6 ngăn gỗ tự nhiên, thiết kế mở thoáng đẹp',
    description: 'Kệ sách 6 ngăn với chất liệu gỗ tự nhiên bền chắc. Thiết kế mở thoáng, dễ lấy sách và đồ trang trí. Phù hợp phòng khách, phòng làm việc.',
    colors: [
      { id: 'natural', name: 'Tự Nhiên', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 200000 },
      { id: 'black', name: 'Đen', hexCode: '#1C1C1C', priceModifier: 200000 },
    ],
    dimensions: [
      { id: 'small', label: '80x30x180cm', width: 80, depth: 30, height: 180, weight: 25, priceModifier: 0 },
      { id: 'large', label: '100x35x200cm', width: 100, depth: 35, height: 200, weight: 32, priceModifier: 1000000 },
    ],
    specs: { 'Số ngăn': '6', 'Tải trọng mỗi ngăn': '20kg', 'Bảo hành': '12 tháng' },
    tags: ['ke-sach', 'go', 'phong-lam-viec', 'phong-khach'],
    totalSold: 445,
  });

  const tuGiay3Tang = buildProduct({
    name: 'Tủ Giày 3 Tầng Cửa Lật Thông Minh', slug: 'tu-giay-3-tang-cua-lat-thong-minh',
    categoryId: catTuGiayId, basePrice: 2800000, costPrice: 1680000,
    brand: 'SmartHome', material: 'Gỗ MDF phủ melamine chống ẩm', origin: 'Việt Nam',
    shortDescription: 'Tủ giày 3 tầng với cửa lật thông minh tiết kiệm không gian',
    description: 'Tủ giày với thiết kế cửa lật thông minh, có thể chứa 12-18 đôi giày. Chất liệu MDF chống ẩm, dễ vệ sinh. Phù hợp cho hành lang, phòng ngủ.',
    colors: [
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'oak', name: 'Sồi', hexCode: '#C19A6B', priceModifier: 300000 },
    ],
    dimensions: [
      { id: 'std', label: '80x30x100cm (12 đôi)', width: 80, depth: 30, height: 100, weight: 18, priceModifier: 0 },
      { id: 'tall', label: '80x30x130cm (18 đôi)', width: 80, depth: 30, height: 130, weight: 22, priceModifier: 700000 },
    ],
    specs: { 'Sức chứa': '12-18 đôi', 'Kiểu cửa': 'Cửa lật', 'Bảo hành': '12 tháng' },
    tags: ['tu-giay', 'tiet-kiem', 'thong-minh'],
    totalSold: 380,
  });

  const tuTVPhongKhach = buildProduct({
    name: 'Kệ TV Phòng Khách Gỗ Tự Nhiên', slug: 'ke-tv-phong-khach-go-tu-nhien',
    categoryId: catStorageId, basePrice: 7500000, costPrice: 4500000,
    brand: 'FurnitureVN', material: 'Gỗ tự nhiên + thanh sắt', origin: 'Việt Nam',
    shortDescription: 'Kệ TV hiện đại kết hợp gỗ và sắt, nhiều ngăn lưu trữ',
    description: 'Kệ TV phong cách industrial kết hợp gỗ tự nhiên và khung sắt. Nhiều ngăn lưu trữ tiện dụng cho thiết bị điện tử và đồ trang trí. Phù hợp TV từ 55-85 inch.',
    colors: [
      { id: 'natural-black', name: 'Gỗ Tự Nhiên-Đen', hexCode: '#8B6914', priceModifier: 0 },
      { id: 'white-gold', name: 'Trắng-Vàng', hexCode: '#FFFFFF', priceModifier: 500000 },
    ],
    dimensions: [
      { id: '1m6', label: '160x40x55cm', width: 160, depth: 40, height: 55, weight: 28, priceModifier: 0 },
      { id: '2m', label: '200x40x55cm', width: 200, depth: 40, height: 55, weight: 35, priceModifier: 1500000 },
    ],
    specs: { 'Chịu được TV': 'Tới 85 inch', 'Tải trọng tối đa': '80kg', 'Bảo hành': '18 tháng' },
    tags: ['ke-tv', 'phong-khach', 'go', 'industrial'],
    totalSold: 195,
  });

  // ---- Office Products ----
  const banVanPhong = buildProduct({
    name: 'Bàn Làm Việc Chân Sắt Mặt Gỗ', slug: 'ban-lam-viec-chan-sat-mat-go',
    categoryId: catBanVanPhongId, basePrice: 5500000, costPrice: 3300000,
    brand: 'WorkSpace', material: 'Mặt gỗ cao su, chân sắt sơn tĩnh điện', origin: 'Việt Nam',
    shortDescription: 'Bàn làm việc chân sắt chắc chắn, mặt gỗ rộng thoải mái',
    description: 'Bàn làm việc với thiết kế tối giản hiện đại. Mặt bàn gỗ cao su bền đẹp, chân sắt sơn tĩnh điện vững chắc. Phù hợp cho văn phòng và phòng làm việc tại nhà.',
    colors: [
      { id: 'natural-black', name: 'Gỗ Tự Nhiên-Đen', hexCode: '#8B6914', priceModifier: 0 },
      { id: 'white-white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'walnut-black', name: 'Óc Chó-Đen', hexCode: '#5C4033', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'small', label: '120x60x75cm', width: 120, depth: 60, height: 75, weight: 22, priceModifier: 0 },
      { id: 'medium', label: '140x70x75cm', width: 140, depth: 70, height: 75, weight: 26, priceModifier: 800000 },
      { id: 'large', label: '160x80x75cm', width: 160, depth: 80, height: 75, weight: 30, priceModifier: 1500000 },
    ],
    specs: { 'Mặt bàn': 'Gỗ cao su', 'Chân bàn': 'Sắt sơn tĩnh điện', 'Tải trọng': '80kg', 'Bảo hành': '12 tháng' },
    tags: ['ban-lam-viec', 'van-phong', 'home-office'],
    totalSold: 520,
  });

  const banDungCaoThanh = buildProduct({
    name: 'Bàn Đứng Điều Chỉnh Độ Cao Điện', slug: 'ban-dung-dieu-chinh-do-cao-dien',
    categoryId: catBanVanPhongId, basePrice: 12500000, costPrice: 7500000,
    brand: 'ErgoDesk', material: 'Mặt gỗ bamboo, chân nhôm điều chỉnh điện', origin: 'Hàn Quốc',
    shortDescription: 'Bàn đứng điều chỉnh độ cao bằng điện, bảo vệ sức khỏe khi làm việc',
    description: 'Bàn làm việc ergonomic với cơ chế điều chỉnh độ cao bằng điện. Có thể thay đổi giữa tư thế đứng và ngồi chỉ bằng một nút bấm. Bảo vệ cột sống, tăng năng suất làm việc.',
    colors: [
      { id: 'bamboo-black', name: 'Bamboo-Đen', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'white-white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
    ],
    dimensions: [
      { id: 'std', label: '140x70cm (60-125cm cao)', width: 140, depth: 70, height: 125, weight: 35, priceModifier: 0 },
      { id: 'large', label: '160x80cm (60-125cm cao)', width: 160, depth: 80, height: 125, weight: 40, priceModifier: 2000000 },
    ],
    specs: { 'Điều chỉnh': 'Điện, 60-125cm', 'Tải trọng': '100kg', 'Tiếng ồn': '<45dB', 'Bảo hành': '24 tháng' },
    tags: ['ban-dung', 'ergonomic', 'dieu-chinh-do-cao', 'van-phong'],
    totalSold: 68,
  });

  const gheVanPhong = buildProduct({
    name: 'Ghế Công Thái Học Lưới Thoáng Khí', slug: 'ghe-cong-thai-hoc-luoi-thoang-khi',
    categoryId: catGheVanPhongId, basePrice: 8500000, costPrice: 5100000,
    brand: 'ErgoChair', material: 'Khung nhôm, lưới thoáng khí, đệm mút D50', origin: 'Đài Loan',
    shortDescription: 'Ghế ergonomic lưới thoáng khí, điều chỉnh đa điểm, bảo vệ cột sống',
    description: 'Ghế văn phòng công thái học với lưới thoáng khí, tựa lưng điều chỉnh 8 điểm. Tay ghế 4D, tựa đầu và tựa thắt lưng tùy chỉnh. Phù hợp cho những người ngồi làm việc nhiều giờ.',
    colors: [
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 0 },
      { id: 'gray', name: 'Xám', hexCode: '#808080', priceModifier: 0 },
      { id: 'blue', name: 'Xanh Dương', hexCode: '#0000FF', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'std', label: 'Standard (cao 110-125cm)', width: 65, depth: 65, height: 125, weight: 18, priceModifier: 0 },
      { id: 'xl', label: 'XL (cao 115-130cm)', width: 70, depth: 70, height: 130, weight: 20, priceModifier: 1000000 },
    ],
    specs: { 'Tải trọng': '150kg', 'Điều chỉnh': '8 điểm', 'Tay ghế': '4D', 'Bảo hành': '24 tháng' },
    tags: ['ghe-van-phong', 'ergonomic', 'cong-thai-hoc', 'luoi'],
    totalSold: 280,
  });

  const gheGaming = buildProduct({
    name: 'Ghế Gaming RGB Chuyên Nghiệp', slug: 'ghe-gaming-rgb-chuyen-nghiep',
    categoryId: catGheVanPhongId, basePrice: 6500000, costPrice: 3900000,
    brand: 'GameZone', material: 'Da PU, khung thép, cơ cấu đệm 3D', origin: 'Trung Quốc',
    shortDescription: 'Ghế gaming với đèn RGB, đệm massage rung, tựa lưng ngả 180 độ',
    description: 'Ghế gaming chuyên nghiệp với hệ thống đèn LED RGB bắt mắt. Tựa lưng có thể ngả tới 180 độ, đệm massage rung tích hợp. Chất liệu da PU cao cấp, dễ vệ sinh.',
    colors: [
      { id: 'black-red', name: 'Đen-Đỏ', hexCode: '#CC0000', priceModifier: 0 },
      { id: 'black-blue', name: 'Đen-Xanh', hexCode: '#0000CC', priceModifier: 0 },
      { id: 'white-pink', name: 'Trắng-Hồng', hexCode: '#FF69B4', priceModifier: 300000 },
    ],
    dimensions: [
      { id: 'std', label: 'Standard (120-130cm)', width: 68, depth: 65, height: 130, weight: 22, priceModifier: 0 },
    ],
    specs: { 'Đèn RGB': 'Có', 'Massage': 'Rung 3 mức', 'Tựa lưng': 'Ngả 90-180 độ', 'Bảo hành': '12 tháng' },
    tags: ['ghe-gaming', 'rgb', 'gaming'],
    totalSold: 190,
  });

  // ---- More Living Room ----
  const banCocheGo = buildProduct({
    name: 'Bàn Cà Phê Gỗ Tự Nhiên Mặt Kính', slug: 'ban-ca-phe-go-tu-nhien-mat-kinh',
    categoryId: catDecoId, basePrice: 5800000, costPrice: 3480000,
    brand: 'FurnitureVN', material: 'Chân gỗ sồi, mặt kính cường lực 10mm', origin: 'Việt Nam',
    shortDescription: 'Bàn trà phòng khách chân gỗ sồi mặt kính trong suốt',
    description: 'Bàn cà phê phòng khách với chân gỗ sồi tự nhiên và mặt kính cường lực 10mm. Thiết kế tối giản hiện đại, tạo cảm giác không gian rộng hơn nhờ mặt kính trong suốt.',
    colors: [
      { id: 'natural', name: 'Gỗ Tự Nhiên', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 200000 },
    ],
    dimensions: [
      { id: 'round', label: 'Tròn Ø80cm', width: 80, depth: 80, height: 45, weight: 12, priceModifier: 0 },
      { id: 'rect', label: 'Vuông 100x60cm', width: 100, depth: 60, height: 45, weight: 15, priceModifier: 500000 },
    ],
    specs: { 'Mặt bàn': 'Kính cường lực 10mm', 'Chân bàn': 'Gỗ sồi', 'Bảo hành': '12 tháng' },
    tags: ['ban-tra', 'phong-khach', 'go-soi', 'kinh'],
    totalSold: 310,
  });

  const keDeGiay = buildProduct({
    name: 'Kệ Đồ Trang Trí Phòng Khách Zigzag', slug: 'ke-do-trang-tri-phong-khach-zigzag',
    categoryId: catDecoId, basePrice: 3200000, costPrice: 1920000,
    brand: 'DecoArt', material: 'Gỗ MDF, chân thép', origin: 'Việt Nam',
    shortDescription: 'Kệ trang trí hình zigzag độc đáo, điểm nhấn phong cách cho phòng khách',
    description: 'Kệ trang trí phòng khách với thiết kế zigzag độc đáo, tạo điểm nhấn nghệ thuật. Chất liệu gỗ MDF bền đẹp, chân thép vững chắc.',
    colors: [
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 0 },
      { id: 'walnut', name: 'Óc Chó', hexCode: '#5C4033', priceModifier: 300000 },
    ],
    dimensions: [
      { id: 'std', label: '50x30x160cm', width: 50, depth: 30, height: 160, weight: 10, priceModifier: 0 },
    ],
    specs: { 'Số tầng': '5', 'Tải trọng mỗi tầng': '10kg', 'Bảo hành': '12 tháng' },
    tags: ['ke-trang-tri', 'phong-khach', 'zigzag', 'decor'],
    totalSold: 280,
  });

  const mirrorDress = buildProduct({
    name: 'Gương Đứng Toàn Thân Khung Gỗ', slug: 'guong-dung-toan-than-khung-go',
    categoryId: catDecoId, basePrice: 2500000, costPrice: 1500000,
    brand: 'MirrorDecor', material: 'Khung gỗ tự nhiên, gương 5mm', origin: 'Việt Nam',
    shortDescription: 'Gương đứng toàn thân khung gỗ tự nhiên sang trọng',
    description: 'Gương đứng toàn thân với khung gỗ tự nhiên tinh tế. Kích thước lớn giúp soi toàn bộ trang phục. Có thể dựng hoặc treo tường.',
    colors: [
      { id: 'natural', name: 'Gỗ Tự Nhiên', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 200000 },
      { id: 'gold', name: 'Vàng Gold', hexCode: '#FFD700', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'std', label: '50x160cm', width: 50, depth: 5, height: 160, weight: 10, priceModifier: 0 },
      { id: 'large', label: '65x180cm', width: 65, depth: 5, height: 180, weight: 13, priceModifier: 500000 },
    ],
    specs: { 'Độ dày gương': '5mm', 'Khung': 'Gỗ tự nhiên', 'Bảo hành': '6 tháng' },
    tags: ['guong', 'toan-than', 'phong-ngu', 'trang-tri'],
    totalSold: 435,
  });

  // More products...
  const sofaVai2Cho = buildProduct({
    name: 'Sofa 2 Chỗ Vải Chenille Êm Ái', slug: 'sofa-2-cho-vai-chenille-em-ai',
    categoryId: catSofaBangId, basePrice: 9800000, costPrice: 5880000,
    brand: 'ComfortHome', material: 'Khung gỗ tự nhiên, vải chenille', origin: 'Việt Nam',
    shortDescription: 'Sofa 2 chỗ vải chenille mềm mịn, ấm áp và thoải mái',
    description: 'Sofa 2 chỗ ngồi với chất liệu vải chenille mềm mịn đặc biệt. Khung gỗ tự nhiên vững chắc, đệm mút D40 êm ái. Phù hợp phòng ngủ, phòng đọc sách.',
    colors: [
      { id: 'pink', name: 'Hồng Pastel', hexCode: '#FFB6C1', priceModifier: 0 },
      { id: 'sage', name: 'Xanh Sage', hexCode: '#B2AC88', priceModifier: 0 },
      { id: 'camel', name: 'Camel', hexCode: '#C19A6B', priceModifier: 300000 },
    ],
    dimensions: [
      { id: 'std', label: '150x85x80cm', width: 150, depth: 85, height: 80, weight: 32, priceModifier: 0 },
    ],
    specs: { 'Chất liệu bọc': 'Vải Chenille', 'Số chỗ': '2 người', 'Đệm': 'Mút D40', 'Bảo hành': '18 tháng' },
    tags: ['sofa', 'bang', 'chenille', 'em-ai'],
    totalSold: 145,
  });

  const banTrung = buildProduct({
    name: 'Bàn Trung Tâm Phòng Khách Đá Ceramic', slug: 'ban-trung-tam-phong-khach-da-ceramic',
    categoryId: catDecoId, basePrice: 9500000, costPrice: 5700000,
    brand: 'StoneArt', material: 'Mặt đá ceramic, chân gỗ sồi', origin: 'Việt Nam',
    shortDescription: 'Bàn trung tâm mặt đá ceramic cao cấp, họa tiết vân đá đẹp mắt',
    description: 'Bàn trung tâm phòng khách với mặt đá ceramic cao cấp. Họa tiết vân đá tự nhiên đẹp mắt, bề mặt chống trầy xước. Chân gỗ sồi vững chắc.',
    colors: [
      { id: 'white-veined', name: 'Trắng Vân Xám', hexCode: '#F5F5F5', priceModifier: 0 },
      { id: 'black-gold', name: 'Đen Vân Vàng', hexCode: '#1C1C1C', priceModifier: 1000000 },
    ],
    dimensions: [
      { id: 'oval', label: 'Oval 120x65cm', width: 120, depth: 65, height: 42, weight: 28, priceModifier: 0 },
      { id: 'rect', label: 'Vuông 100x100cm', width: 100, depth: 100, height: 42, weight: 32, priceModifier: 1500000 },
    ],
    specs: { 'Mặt bàn': 'Đá ceramic', 'Chân bàn': 'Gỗ sồi', 'Bảo hành': '18 tháng' },
    tags: ['ban-tra', 'phong-khach', 'ceramic', 'sang-trong'],
    totalSold: 88,
  });

  const giuongTangBe = buildProduct({
    name: 'Giường Tầng Trẻ Em Có Cầu Thang', slug: 'giuong-tang-tre-em-co-cau-thang',
    categoryId: catGiuongId, basePrice: 11500000, costPrice: 6900000,
    brand: 'KidsFun', material: 'Gỗ thông tự nhiên, sơn an toàn cho trẻ', origin: 'Việt Nam',
    shortDescription: 'Giường tầng trẻ em an toàn với cầu thang và lan can bảo vệ',
    description: 'Giường tầng dành cho trẻ em với thiết kế an toàn. Có cầu thang bậc rộng dễ leo, lan can bảo vệ tầng trên. Chất liệu gỗ thông tự nhiên, sơn an toàn không chứa chì.',
    colors: [
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'natural', name: 'Tự Nhiên', hexCode: '#D2B48C', priceModifier: 0 },
      { id: 'pink-white', name: 'Hồng-Trắng', hexCode: '#FFB6C1', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'std', label: '200x90cm/tầng', width: 100, depth: 210, height: 160, weight: 55, priceModifier: 0 },
    ],
    specs: { 'Tải trọng': '100kg/tầng', 'Chất liệu': 'Gỗ thông', 'Sơn': 'An toàn cho trẻ', 'Bảo hành': '24 tháng' },
    tags: ['giuong-tang', 'tre-em', 'an-toan', 'go-thong'],
    totalSold: 125,
  });

  const banPhoiQuanAo = buildProduct({
    name: 'Tủ Quần Áo Mở Dạng Kệ Treo', slug: 'tu-quan-ao-mo-dang-ke-treo',
    categoryId: catTuQuanAoId, basePrice: 3800000, costPrice: 2280000,
    brand: 'OpenWard', material: 'Sắt sơn tĩnh điện, gỗ MDF', origin: 'Việt Nam',
    shortDescription: 'Tủ quần áo mở kiểu kệ treo hiện đại, tiết kiệm không gian',
    description: 'Tủ quần áo mở dạng kệ treo với thiết kế hiện đại. Có nhiều thanh treo và ngăn kệ đa dạng, dễ dàng phối hợp và lấy đồ. Phù hợp phong cách open wardrobe.',
    colors: [
      { id: 'black', name: 'Đen', hexCode: '#000000', priceModifier: 0 },
      { id: 'white', name: 'Trắng', hexCode: '#FFFFFF', priceModifier: 0 },
      { id: 'gold', name: 'Vàng Rose Gold', hexCode: '#B76E79', priceModifier: 500000 },
    ],
    dimensions: [
      { id: 'small', label: '100x40x170cm', width: 100, depth: 40, height: 170, weight: 20, priceModifier: 0 },
      { id: 'large', label: '150x40x170cm', width: 150, depth: 40, height: 170, weight: 28, priceModifier: 1200000 },
    ],
    specs: { 'Kiểu': 'Tủ mở', 'Thanh treo': '2-3 thanh', 'Bảo hành': '12 tháng' },
    tags: ['tu-quan-ao', 'mo', 'ke-treo', 'hien-dai'],
    totalSold: 265,
  });

  // Insert all products
  const allProducts = await ProductModel.insertMany([
    sofaGocL, sofaBang3Cho, sofaDonMinimalist, sofaGiuong, sofaGocU, armchair,
    banAnDa, banAnGo, gheAnDem, gheAnKimLoai,
    giuongNguGo, giuongNganKeo, giuongKingSize, tuDauGiuong, giuongTangBe,
    tuQuanAo4Canh, keSach6Ngan, tuGiay3Tang, tuTVPhongKhach, banPhoiQuanAo,
    banVanPhong, banDungCaoThanh, gheVanPhong, gheGaming,
    banCocheGo, keDeGiay, mirrorDress, sofaVai2Cho, banTrung,
  ]);

  console.log(`✅ Products seeded (${allProducts.length} products)`);

  // ===================== COUPONS =====================
  console.log('🎫 Seeding coupons...');

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + 3);

  await CouponModel.insertMany([
    {
      code: 'WELCOME10',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 1000000,
      maxDiscountAmount: 500000,
      startDate: now,
      endDate: futureDate,
      maxUsage: 1000,
      usedCount: 128,
      maxUsagePerUser: 1,
      isActive: true,
      scope: 'all',
    },
    {
      code: 'SUMMER500K',
      description: 'Giảm 500,000đ cho đơn từ 5 triệu',
      discountType: 'fixed',
      discountValue: 500000,
      minOrderValue: 5000000,
      startDate: now,
      endDate: futureDate,
      maxUsage: 500,
      usedCount: 45,
      maxUsagePerUser: 2,
      isActive: true,
      scope: 'all',
    },
    {
      code: 'SOFA15',
      description: 'Giảm 15% khi mua sofa',
      discountType: 'percentage',
      discountValue: 15,
      minOrderValue: 5000000,
      maxDiscountAmount: 3000000,
      startDate: now,
      endDate: futureDate,
      maxUsage: 200,
      usedCount: 22,
      maxUsagePerUser: 1,
      isActive: true,
      scope: 'category',
      applicableCategories: [catSofaId, catSofaGocId, catSofaBangId, catGheDonId, catSofaGiuongId],
    },
    {
      code: 'VIP20',
      description: 'Giảm 20% dành riêng cho khách VIP',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 10000000,
      maxDiscountAmount: 5000000,
      startDate: now,
      endDate: futureDate,
      maxUsage: 100,
      usedCount: 8,
      maxUsagePerUser: 1,
      isActive: true,
      scope: 'all',
    },
    {
      code: 'FREESHIP',
      description: 'Miễn phí vận chuyển toàn quốc',
      discountType: 'fixed',
      discountValue: 60000,
      minOrderValue: 500000,
      startDate: now,
      endDate: futureDate,
      maxUsage: 2000,
      usedCount: 456,
      maxUsagePerUser: 3,
      isActive: true,
      scope: 'all',
    },
    {
      code: 'FLASH30',
      description: 'Flash sale giảm 30% - đã hết hạn',
      discountType: 'percentage',
      discountValue: 30,
      minOrderValue: 3000000,
      maxDiscountAmount: 2000000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-01'),
      maxUsage: 50,
      usedCount: 50,
      maxUsagePerUser: 1,
      isActive: false,
      scope: 'all',
    },
  ]);

  console.log('✅ Coupons seeded (6 coupons)');

  // ===================== ORDERS =====================
  console.log('🛒 Seeding orders...');

  const productList = allProducts as any[];
  const p0 = productList[0]; // sofa goc
  const p1 = productList[1]; // sofa bang
  const p6 = productList[6]; // ban an da
  const p10 = productList[10]; // giuong ngu go
  const p16 = productList[16]; // tu giay

  function makeOrder(opts: {
    orderNumber: string;
    customerId: Types.ObjectId;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    items: any[];
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    total: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    couponCode?: string;
    isPosOrder?: boolean;
    shipperId?: Types.ObjectId;
  }) {
    return {
      orderNumber: opts.orderNumber,
      customerId: opts.customerId,
      customerName: opts.customerName,
      customerPhone: opts.customerPhone,
      customerEmail: opts.customerEmail,
      items: opts.items,
      subtotal: opts.subtotal,
      discountAmount: opts.discountAmount,
      shippingFee: opts.shippingFee,
      total: opts.total,
      status: opts.status,
      paymentMethod: opts.paymentMethod,
      paymentStatus: opts.paymentStatus,
      shippingFullName: opts.customerName,
      shippingPhone: opts.customerPhone,
      shippingStreet: opts.street,
      shippingWard: opts.ward,
      shippingDistrict: opts.district,
      shippingProvince: opts.province,
      statusHistory: [{ status: opts.status, changedAt: new Date(), note: 'Khởi tạo' }],
      isPosOrder: opts.isPosOrder || false,
      couponCode: opts.couponCode,
      shipperId: opts.shipperId,
      isDeleted: false,
    };
  }

  const orders = await OrderModel.insertMany([
    makeOrder({
      orderNumber: 'FV-20260401-0001',
      customerId: customer1Id,
      customerName: 'Phạm Thị Hoa',
      customerPhone: '0901234561',
      customerEmail: 'hoa.pham@gmail.com',
      items: [{
        productId: p0._id, productName: p0.name,
        productImage: p0.images[0], variantSku: p0.variants[0]?.sku,
        variantInfo: 'Xám / 250x160x85cm', quantity: 1,
        unitPrice: p0.variants[0]?.price || p0.basePrice,
        totalPrice: p0.variants[0]?.price || p0.basePrice,
      }],
      subtotal: p0.variants[0]?.price || p0.basePrice,
      shippingFee: 30000,
      discountAmount: 0,
      total: (p0.variants[0]?.price || p0.basePrice) + 30000,
      status: 'delivered',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      street: '123 Lê Lợi',
    }),
    makeOrder({
      orderNumber: 'FV-20260401-0002',
      customerId: customer2Id,
      customerName: 'Nguyễn Minh Tuấn',
      customerPhone: '0901234562',
      customerEmail: 'tuan.nguyen@gmail.com',
      items: [{
        productId: p6._id, productName: p6.name,
        productImage: p6.images[0], variantSku: p6.variants[0]?.sku,
        variantInfo: 'Đá Trắng / 120x75x75cm', quantity: 1,
        unitPrice: p6.variants[0]?.price || p6.basePrice,
        totalPrice: p6.variants[0]?.price || p6.basePrice,
      }, {
        productId: productList[8]._id, productName: productList[8].name,
        productImage: productList[8].images[0], variantSku: productList[8].variants[0]?.sku,
        variantInfo: 'Be / Standard', quantity: 4,
        unitPrice: productList[8].variants[0]?.price || productList[8].basePrice,
        totalPrice: (productList[8].variants[0]?.price || productList[8].basePrice) * 4,
      }],
      subtotal: (p6.variants[0]?.price || p6.basePrice) + (productList[8].variants[0]?.price || productList[8].basePrice) * 4,
      shippingFee: 30000,
      discountAmount: 500000,
      total: (p6.variants[0]?.price || p6.basePrice) + (productList[8].variants[0]?.price || productList[8].basePrice) * 4 + 30000 - 500000,
      status: 'in_transit',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      street: '45 Nguyễn Huệ',
      couponCode: 'SUMMER500K',
      shipperId,
    }),
    makeOrder({
      orderNumber: 'FV-20260401-0003',
      customerId: customer4Id,
      customerName: 'Lê Hoàng Nam',
      customerPhone: '0901234564',
      customerEmail: 'nam.le@gmail.com',
      items: [{
        productId: p10._id, productName: p10.name,
        productImage: p10.images[0], variantSku: p10.variants[0]?.sku,
        variantInfo: 'Tự Nhiên / 1m6 (160x200cm)', quantity: 1,
        unitPrice: p10.variants[0]?.price || p10.basePrice,
        totalPrice: p10.variants[0]?.price || p10.basePrice,
      }],
      subtotal: p10.variants[0]?.price || p10.basePrice,
      shippingFee: 30000,
      discountAmount: (p10.variants[0]?.price || p10.basePrice) * 0.1,
      total: Math.round((p10.variants[0]?.price || p10.basePrice) * 0.9 + 30000),
      status: 'confirmed',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      province: 'Hồ Chí Minh',
      district: 'Phú Nhuận',
      ward: 'Phường 9',
      street: '88 Hoàng Văn Thụ',
      couponCode: 'WELCOME10',
    }),
    makeOrder({
      orderNumber: 'FV-20260401-0004',
      customerId: customer3Id,
      customerName: 'Trần Thị Mai',
      customerPhone: '0901234563',
      customerEmail: 'mai.tran@gmail.com',
      items: [{
        productId: productList[5]._id, productName: productList[5].name,
        productImage: productList[5].images[0], variantSku: productList[5].variants[0]?.sku,
        variantInfo: 'Xanh Ngọc / Standard', quantity: 2,
        unitPrice: productList[5].variants[0]?.price || productList[5].basePrice,
        totalPrice: (productList[5].variants[0]?.price || productList[5].basePrice) * 2,
      }],
      subtotal: (productList[5].variants[0]?.price || productList[5].basePrice) * 2,
      shippingFee: 30000,
      discountAmount: 0,
      total: (productList[5].variants[0]?.price || productList[5].basePrice) * 2 + 30000,
      status: 'pending',
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      province: 'Hồ Chí Minh',
      district: 'Bình Thạnh',
      ward: 'Phường 25',
      street: '12 Đinh Bộ Lĩnh',
    }),
    makeOrder({
      orderNumber: 'FV-20260401-0005',
      customerId: customer1Id,
      customerName: 'Phạm Thị Hoa',
      customerPhone: '0901234561',
      customerEmail: 'hoa.pham@gmail.com',
      items: [{
        productId: p16._id, productName: p16.name,
        productImage: p16.images[0], variantSku: p16.variants[0]?.sku,
        variantInfo: 'Trắng / 80x30x100cm (12 đôi)', quantity: 1,
        unitPrice: p16.variants[0]?.price || p16.basePrice,
        totalPrice: p16.variants[0]?.price || p16.basePrice,
      }, {
        productId: productList[12]._id, productName: productList[12].name,
        productImage: productList[12].images[0], variantSku: productList[12].variants[0]?.sku,
        variantInfo: 'Ngà / King 1m8', quantity: 1,
        unitPrice: productList[12].variants[0]?.price || productList[12].basePrice,
        totalPrice: productList[12].variants[0]?.price || productList[12].basePrice,
      }],
      subtotal: (p16.variants[0]?.price || p16.basePrice) + (productList[12].variants[0]?.price || productList[12].basePrice),
      shippingFee: 30000,
      discountAmount: 0,
      total: (p16.variants[0]?.price || p16.basePrice) + (productList[12].variants[0]?.price || productList[12].basePrice) + 30000,
      status: 'delivered',
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      street: '123 Lê Lợi',
    }),
    // POS order
    makeOrder({
      orderNumber: 'FV-20260401-0006',
      customerId: customer5Id,
      customerName: 'Võ Thị Thanh',
      customerPhone: '0901234565',
      customerEmail: 'thanh.vo@gmail.com',
      items: [{
        productId: productList[9]._id, productName: productList[9].name,
        productImage: productList[9].images[0], variantSku: productList[9].variants[0]?.sku,
        variantInfo: 'Đen-Gỗ / Standard', quantity: 4,
        unitPrice: productList[9].variants[0]?.price || productList[9].basePrice,
        totalPrice: (productList[9].variants[0]?.price || productList[9].basePrice) * 4,
      }],
      subtotal: (productList[9].variants[0]?.price || productList[9].basePrice) * 4,
      shippingFee: 0,
      discountAmount: 0,
      total: (productList[9].variants[0]?.price || productList[9].basePrice) * 4,
      status: 'delivered',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Bến Nghé',
      street: 'Tại cửa hàng',
      isPosOrder: true,
    }),
  ]);

  console.log(`✅ Orders seeded (${orders.length} orders)`);

  // ===================== REVIEWS =====================
  console.log('⭐ Seeding reviews...');

  const reviewComments = [
    'Sản phẩm rất đẹp, chất lượng tốt hơn mong đợi. Giao hàng nhanh, đóng gói cẩn thận.',
    'Mình rất hài lòng với sản phẩm. Màu sắc đúng như ảnh, chất liệu tốt.',
    'Thiết kế đẹp, lắp ráp dễ dàng. Nhân viên hỗ trợ nhiệt tình.',
    'Giá cả hợp lý, chất lượng ổn. Sẽ ủng hộ shop lần sau.',
    'Sản phẩm tốt nhưng giao hàng hơi chậm. Nhìn chung vẫn hài lòng.',
    'Chất lượng tuyệt vời! Đúng với mô tả. Recommend cho mọi người.',
    'Đặt hàng lần 2 rồi, không bao giờ thất vọng. Shop uy tín!',
    'Hàng đẹp, bền. Dùng được mấy tháng rồi vẫn như mới.',
  ];

  await ReviewModel.insertMany([
    {
      productId: allProducts[0]._id,
      userId: customer1Id,
      orderId: orders[0]._id,
      orderItemSku: allProducts[0].variants[0]?.sku,
      rating: 5,
      title: 'Sofa đẹp xuất sắc!',
      comment: reviewComments[0],
      status: 'approved',
      helpfulCount: 12,
    },
    {
      productId: allProducts[0]._id,
      userId: customer2Id,
      orderId: orders[1]._id,
      rating: 4,
      title: 'Hài lòng với sản phẩm',
      comment: reviewComments[1],
      status: 'approved',
      helpfulCount: 5,
    },
    {
      productId: allProducts[6]._id,
      userId: customer2Id,
      orderId: orders[1]._id,
      rating: 5,
      title: 'Bàn ăn marble rất sang!',
      comment: reviewComments[5],
      status: 'approved',
      helpfulCount: 8,
    },
    {
      productId: allProducts[10]._id,
      userId: customer4Id,
      orderId: orders[2]._id,
      rating: 5,
      title: 'Giường gỗ sồi tự nhiên rất chắc',
      comment: reviewComments[6],
      status: 'approved',
      helpfulCount: 15,
    },
    {
      productId: allProducts[1]._id,
      userId: customer1Id,
      orderId: orders[4]._id,
      rating: 4,
      title: 'Sofa da thật đẹp',
      comment: reviewComments[2],
      status: 'approved',
      helpfulCount: 7,
    },
    {
      productId: allProducts[12]._id,
      userId: customer1Id,
      orderId: orders[4]._id,
      rating: 5,
      title: 'Giường king size xịn sò',
      comment: reviewComments[7],
      status: 'approved',
      helpfulCount: 20,
    },
    {
      productId: allProducts[5]._id,
      userId: customer3Id,
      orderId: orders[3]._id,
      rating: 5,
      title: 'Ghế armchair vintage cực đẹp',
      comment: 'Mình đặt màu xanh ngọc, nhìn thực tế còn đẹp hơn trong ảnh. Chất vải nhung mềm mịn, ngồi rất thoải mái.',
      status: 'approved',
      helpfulCount: 18,
    },
    {
      productId: allProducts[9]._id,
      userId: customer5Id,
      orderId: orders[5]._id,
      rating: 4,
      title: 'Ghế ăn industrial đẹp',
      comment: reviewComments[3],
      status: 'approved',
      helpfulCount: 3,
    },
  ]);

  console.log('✅ Reviews seeded (8 reviews)');

  // ===================== NOTIFICATIONS =====================
  console.log('🔔 Seeding notifications...');

  await NotificationModel.insertMany([
    {
      userId: adminId,
      type: 'low_stock',
      title: 'Cảnh báo tồn kho thấp',
      message: 'Sofa Góc Chữ L sắp hết hàng, chỉ còn 3 sản phẩm',
      data: { productId: allProducts[0]._id },
      isRead: false,
      actionUrl: '/admin/products',
    },
    {
      userId: adminId,
      type: 'new_review',
      title: 'Đánh giá mới cần duyệt',
      message: 'Có 2 đánh giá mới đang chờ duyệt',
      data: {},
      isRead: false,
      actionUrl: '/admin/reviews',
    },
    {
      userId: customer1Id,
      type: 'order_status_changed',
      title: 'Đơn hàng đã được giao',
      message: 'Đơn hàng #FV-20260401-0001 đã được giao thành công',
      data: { orderNumber: 'FV-20260401-0001' },
      isRead: true,
      actionUrl: '/orders/FV-20260401-0001',
    },
    {
      userId: customer2Id,
      type: 'shipper_assigned',
      title: 'Shipper đã nhận đơn',
      message: 'Shipper Lê Văn Giao đang trên đường giao đơn #FV-20260401-0002',
      data: { orderNumber: 'FV-20260401-0002' },
      isRead: false,
      actionUrl: '/orders/FV-20260401-0002',
    },
    {
      userId: shipperId,
      type: 'order_created',
      title: 'Có đơn hàng mới',
      message: 'Đơn hàng #FV-20260401-0002 đang chờ shipper nhận',
      data: { orderNumber: 'FV-20260401-0002' },
      isRead: true,
      actionUrl: '/shipper/orders',
    },
  ]);

  console.log('✅ Notifications seeded (5 notifications)');

  // ===================== SUMMARY =====================
  console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!\n');
  console.log('='.repeat(50));
  console.log('📌 ACCOUNT ĐĂNG NHẬP:');
  console.log('='.repeat(50));
  console.log('👑 ADMIN     : admin@furniture.vn    / Admin@123');
  console.log('📊 MANAGER   : manager@furniture.vn  / Manager@123');
  console.log('💼 POS/STAFF : pos@furniture.vn      / Staff@123');
  console.log('🚴 SHIPPER   : shipper@furniture.vn  / Shipper@123');
  console.log('👤 CUSTOMER1 : hoa.pham@gmail.com    / Customer@123');
  console.log('👤 CUSTOMER2 : tuan.nguyen@gmail.com / Customer@123');
  console.log('='.repeat(50));
  console.log('📦 Products  : 29 sản phẩm');
  console.log('📁 Categories: 20 danh mục');
  console.log('🎫 Coupons   : 6 mã giảm giá');
  console.log('🛒 Orders    : 6 đơn hàng');
  console.log('⭐ Reviews   : 8 đánh giá');
  console.log('🔔 Notifications: 5 thông báo');
  console.log('='.repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
