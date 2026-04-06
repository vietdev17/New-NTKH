import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau it nhat 6 ky tu'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Ho ten it nhat 2 ky tu'),
  email: z.string().email('Email khong hop le'),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, 'So dien thoai khong hop le'),
  password: z.string().min(6, 'Mat khau it nhat 6 ky tu'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mat khau xac nhan khong khop',
  path: ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Ho ten nguoi nhan it nhat 2 ky tu'),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, 'So dien thoai khong hop le'),
  street: z.string().min(5, 'Dia chi cu the it nhat 5 ky tu'),
  ward: z.string().min(1, 'Vui long chon Phuong/Xa'),
  district: z.string().min(1, 'Vui long chon Quan/Huyen'),
  province: z.string().min(1, 'Vui long chon Tinh/Thanh pho'),
  isDefault: z.boolean().default(false),
});
export type AddressFormData = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  addressIndex: z.number().min(0, 'Vui long chon dia chi giao hang'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'cod'], { required_error: 'Vui long chon phuong thuc thanh toan' }),
  note: z.string().optional(),
  couponCode: z.string().optional(),
});
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Vui long chon so sao').max(5),
  comment: z.string().min(10, 'Nhan xet it nhat 10 ky tu').max(1000, 'Nhan xet toi da 1000 ky tu'),
  images: z.array(z.string()).max(5, 'Toi da 5 anh').optional(),
});
export type ReviewFormData = z.infer<typeof reviewSchema>;

export const productSchema = z.object({
  name: z.string().min(3, 'Ten san pham it nhat 3 ky tu'),
  slug: z.string().min(3, 'Slug it nhat 3 ky tu'),
  description: z.string().min(20, 'Mo ta it nhat 20 ky tu'),
  shortDescription: z.string().max(200, 'Mo ta ngan toi da 200 ky tu').optional(),
  categoryId: z.string().min(1, 'Vui long chon danh muc'),
  basePrice: z.number().min(0, 'Gia phai lon hon 0'),
  salePrice: z.number().optional(),
  images: z.array(z.string()).min(1, 'Can it nhat 1 anh'),
  material: z.string().optional(),
  warranty: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
});
export type ProductFormData = z.infer<typeof productSchema>;

export const couponSchema = z.object({
  code: z.string().min(3, 'Ma giam gia it nhat 3 ky tu').max(20),
  description: z.string().min(5, 'Mo ta it nhat 5 ky tu'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1, 'Gia tri giam phai lon hon 0'),
  minOrderValue: z.number().min(0).optional(),
  maxDiscountAmount: z.number().optional(),
  scope: z.enum(['all', 'category', 'product']),
  applicableIds: z.array(z.string()).optional(),
  usageLimit: z.number().min(1).optional(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(true),
});
export type CouponFormData = z.infer<typeof couponSchema>;

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Ho ten it nhat 2 ky tu'),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, 'So dien thoai khong hop le'),
  avatar: z.string().optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Mat khau hien tai it nhat 6 ky tu'),
  newPassword: z.string().min(6, 'Mat khau moi it nhat 6 ky tu'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mat khau xac nhan khong khop',
  path: ['confirmPassword'],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email khong hop le'),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Mat khau it nhat 6 ky tu'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mat khau xac nhan khong khop',
  path: ['confirmPassword'],
});
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const staffSchema = z.object({
  fullName: z.string().min(2, 'Ho ten it nhat 2 ky tu'),
  email: z.string().email('Email khong hop le'),
  phone: z.string().regex(/^(0[3-9])\d{8}$/, 'So dien thoai khong hop le'),
  password: z.string().min(6, 'Mat khau it nhat 6 ky tu'),
  role: z.enum(['admin', 'manager', 'staff']),
});
export type StaffFormData = z.infer<typeof staffSchema>;
