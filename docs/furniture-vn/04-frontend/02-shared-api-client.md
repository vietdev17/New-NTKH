# API CLIENT, STORES & HOOKS

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> Axios instance, Zustand stores, API services, React Query hooks, Socket.IO hooks, Utilities
> Stack: Next.js 14 + Axios + Zustand + React Query (TanStack Query v5) + Socket.IO Client
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [Axios Instance (`lib/api.ts`)](#1-axios-instance)
2. [Zustand Stores (`stores/`)](#2-zustand-stores)
3. [API Services (`services/`)](#3-api-services)
4. [React Query Hooks (`hooks/`)](#4-react-query-hooks)
5. [Socket Hooks (`hooks/use-socket.ts`)](#5-socket-hooks)
6. [Utility Functions (`lib/utils.ts`)](#6-utility-functions)

---

## 1. Axios Instance

```typescript
// ============================================================
// lib/api.ts
// ============================================================
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/use-auth-store';

// ----- Response wrapper tu backend -----
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ----- Tao Axios instance -----
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----- Flag tranh goi refresh nhieu lan -----
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// ============================================================
// REQUEST INTERCEPTOR
// Gan Authorization Bearer token tu authStore vao moi request
// ============================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================================
// RESPONSE INTERCEPTOR
// 1. Extract data tu ApiResponse wrapper
// 2. Xu ly 401: refresh token -> retry request goc -> neu fail thi logout
// ============================================================
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Tra ve data da extract tu wrapper
    // Giu lai meta cho pagination
    const apiResponse = response.data;

    if (apiResponse.meta) {
      return {
        ...response,
        data: apiResponse.data,
        meta: apiResponse.meta,
      } as any;
    }

    return {
      ...response,
      data: apiResponse.data,
    } as any;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Neu khong phai 401, hoac da retry roi, hoac la request refresh -> reject
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      const message =
        error.response?.data?.message || 'Co loi xay ra, vui long thu lai';
      return Promise.reject({
        message,
        statusCode: error.response?.status,
        errors: error.response?.data?.errors,
      });
    }

    // ----- Xu ly 401: Thu refresh token -----
    if (isRefreshing) {
      // Dang refresh roi -> dua request vao queue cho
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken: storedRefreshToken } = useAuthStore.getState();

      if (!storedRefreshToken) {
        throw new Error('Khong co refresh token');
      }

      // Goi API refresh truc tiep (khong qua interceptor)
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
        { refreshToken: storedRefreshToken },
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        data.data;

      // Cap nhat store
      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

      // Retry tat ca request trong queue
      processQueue(null, newAccessToken);

      // Retry request goc
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh that bai -> logout
      processQueue(refreshError, null);
      useAuthStore.getState().logout();

      // Redirect ve trang login
      if (typeof window !== 'undefined') {
        window.location.href = '/dang-nhap';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

// ----- Helper cho upload file (multipart/form-data) -----
export const apiUpload: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 120000, // 2 phut cho upload
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Dung chung interceptor voi api chinh
apiUpload.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiUpload.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return { ...response, data: response.data.data } as any;
  },
  async (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.message || 'Upload that bai, vui long thu lai';
    return Promise.reject({
      message,
      statusCode: error.response?.status,
    });
  },
);
```

---

## 2. Zustand Stores

### 2.1. Cau truc thu muc

```
stores/
├── use-auth-store.ts
├── use-cart-store.ts
├── use-wishlist-store.ts
├── use-comparison-store.ts
└── use-notification-store.ts
```

---

### 2.2. useAuthStore (persist to localStorage)

```typescript
// ============================================================
// stores/use-auth-store.ts
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';

// ----- Interfaces -----

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'customer' | 'shipper';
  avatar?: string;
  addresses?: Address[];
  defaultAddressIndex?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// ----- Store -----

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshTokenAction: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  googleLogin: (token: string) => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // ----- State -----
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // ----- Actions -----

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', credentials);
          // data da duoc extract boi interceptor:
          // { user, accessToken, refreshToken }
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const { data: resData } = await api.post('/auth/register', data);
          set({
            user: resData.user,
            accessToken: resData.accessToken,
            refreshToken: resData.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        const { refreshToken } = get();
        // Goi API logout (fire-and-forget, khong can doi response)
        if (refreshToken) {
          api.post('/auth/logout', { refreshToken }).catch(() => {});
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshTokenAction: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
        } catch {
          get().logout();
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      googleLogin: async (token: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/google', { token });
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'furniture-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

---

### 2.3. useCartStore (persist to localStorage)

```typescript
// ============================================================
// stores/use-cart-store.ts
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';

// ----- Interfaces -----

export interface CartVariant {
  sku: string;
  color?: {
    name: string;
    code: string;
  };
  dimensions?: {
    width: number;
    height: number;
    length: number;
    label: string;
  };
  price: number;
  originalPrice: number;
  stock: number;
  image?: string;
}

export interface CartProduct {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
}

export interface CartItem {
  product: CartProduct;
  variant: CartVariant;
  quantity: number;
}

// ----- Store -----

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
}

interface CartActions {
  addItem: (product: CartProduct, variant: CartVariant, qty?: number) => void;
  removeItem: (variantSku: string) => void;
  updateQuantity: (variantSku: string, qty: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // ----- State -----
      items: [],
      couponCode: null,
      couponDiscount: 0,

      // ----- Actions -----

      addItem: (product: CartProduct, variant: CartVariant, qty = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (item) => item.variant.sku === variant.sku,
        );

        if (existingIndex > -1) {
          // Da co trong gio -> tang so luong
          const updatedItems = [...items];
          const newQty = updatedItems[existingIndex].quantity + qty;

          // Khong vuot qua stock
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: Math.min(newQty, variant.stock),
          };
          set({ items: updatedItems });
        } else {
          // Them moi
          set({
            items: [
              ...items,
              {
                product,
                variant,
                quantity: Math.min(qty, variant.stock),
              },
            ],
          });
        }
      },

      removeItem: (variantSku: string) => {
        set({
          items: get().items.filter((item) => item.variant.sku !== variantSku),
        });
      },

      updateQuantity: (variantSku: string, qty: number) => {
        if (qty <= 0) {
          get().removeItem(variantSku);
          return;
        }

        const updatedItems = get().items.map((item) => {
          if (item.variant.sku === variantSku) {
            return {
              ...item,
              quantity: Math.min(qty, item.variant.stock),
            };
          }
          return item;
        });

        set({ items: updatedItems });
      },

      clearCart: () => {
        set({
          items: [],
          couponCode: null,
          couponDiscount: 0,
        });
      },

      applyCoupon: async (code: string) => {
        const { items } = get();
        const subtotal = get().getSubtotal();

        // Goi API validate coupon
        const { data } = await api.post('/coupons/validate', {
          code,
          items: items.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.variant.price,
          })),
          subtotal,
        });

        set({
          couponCode: code,
          couponDiscount: data.discount,
        });
      },

      removeCoupon: () => {
        set({
          couponCode: null,
          couponDiscount: 0,
        });
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.variant.price * item.quantity,
          0,
        );
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().couponDiscount;
        return Math.max(0, subtotal - discount);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'furniture-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    },
  ),
);
```

---

### 2.4. useWishlistStore (persist to localStorage)

```typescript
// ============================================================
// stores/use-wishlist-store.ts
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';

// ----- Interfaces -----

export interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  basePrice: number;
  discountPercent?: number;
  averageRating?: number;
  status: string;
}

// ----- Store -----

interface WishlistState {
  productIds: string[];
  items: WishlistProduct[];
  isLoading: boolean;
}

interface WishlistActions {
  toggle: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loadWishlist: () => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  syncWithServer: (serverIds: string[]) => void;
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  persist(
    (set, get) => ({
      // ----- State -----
      productIds: [],
      items: [],
      isLoading: false,

      // ----- Actions -----

      toggle: async (productId: string) => {
        const { productIds } = get();
        const isExist = productIds.includes(productId);

        if (isExist) {
          // Optimistic remove
          set({
            productIds: productIds.filter((id) => id !== productId),
            items: get().items.filter((item) => item._id !== productId),
          });
          try {
            await api.delete(`/wishlist/${productId}`);
          } catch {
            // Rollback neu that bai
            set({
              productIds: [...get().productIds, productId],
            });
          }
        } else {
          // Optimistic add
          set({ productIds: [...productIds, productId] });
          try {
            await api.post('/wishlist', { productId });
          } catch {
            // Rollback neu that bai
            set({
              productIds: get().productIds.filter((id) => id !== productId),
            });
          }
        }
      },

      isInWishlist: (productId: string) => {
        return get().productIds.includes(productId);
      },

      loadWishlist: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/wishlist');
          set({
            items: data.items || data,
            productIds: (data.items || data).map(
              (item: WishlistProduct) => item._id,
            ),
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      removeItem: async (productId: string) => {
        // Tuong tu toggle nhung chi remove
        set({
          productIds: get().productIds.filter((id) => id !== productId),
          items: get().items.filter((item) => item._id !== productId),
        });
        try {
          await api.delete(`/wishlist/${productId}`);
        } catch {
          // Rollback
          set({
            productIds: [...get().productIds, productId],
          });
        }
      },

      syncWithServer: (serverIds: string[]) => {
        set({ productIds: serverIds });
      },
    }),
    {
      name: 'furniture-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        productIds: state.productIds,
      }),
    },
  ),
);
```

---

### 2.5. useComparisonStore (persist to sessionStorage)

```typescript
// ============================================================
// stores/use-comparison-store.ts
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

const MAX_COMPARISON_ITEMS = 4;

// ----- Store -----

interface ComparisonState {
  productIds: string[];
}

interface ComparisonActions {
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  isInComparison: (productId: string) => boolean;
  isFull: () => boolean;
}

export const useComparisonStore = create<ComparisonState & ComparisonActions>()(
  persist(
    (set, get) => ({
      // ----- State -----
      productIds: [],

      // ----- Actions -----

      add: (productId: string) => {
        const { productIds } = get();

        if (productIds.includes(productId)) {
          toast.info('San pham da co trong danh sach so sanh');
          return;
        }

        if (productIds.length >= MAX_COMPARISON_ITEMS) {
          toast.warning(
            `Chi co the so sanh toi da ${MAX_COMPARISON_ITEMS} san pham`,
          );
          return;
        }

        set({ productIds: [...productIds, productId] });
        toast.success('Da them vao danh sach so sanh');
      },

      remove: (productId: string) => {
        set({
          productIds: get().productIds.filter((id) => id !== productId),
        });
      },

      clear: () => {
        set({ productIds: [] });
      },

      isInComparison: (productId: string) => {
        return get().productIds.includes(productId);
      },

      isFull: () => {
        return get().productIds.length >= MAX_COMPARISON_ITEMS;
      },
    }),
    {
      name: 'furniture-comparison-storage',
      // Su dung sessionStorage - mat khi dong tab
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
```

---

### 2.6. useNotificationStore

```typescript
// ============================================================
// stores/use-notification-store.ts
// ============================================================
import { create } from 'zustand';

// ----- Interfaces -----

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type:
    | 'order'
    | 'review'
    | 'return'
    | 'stock'
    | 'coupon'
    | 'system'
    | 'shipper';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ----- Store -----

interface NotificationState {
  unreadCount: number;
  notifications: Notification[];
}

interface NotificationActions {
  setUnreadCount: (n: number) => void;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<
  NotificationState & NotificationActions
>()((set, get) => ({
  // ----- State -----
  unreadCount: 0,
  notifications: [],

  // ----- Actions -----

  setUnreadCount: (n: number) => {
    set({ unreadCount: n });
  },

  addNotification: (n: Notification) => {
    set({
      notifications: [n, ...get().notifications],
      unreadCount: get().unreadCount + (n.isRead ? 0 : 1),
    });
  },

  markAsRead: (id: string) => {
    const notifications = get().notifications.map((n) =>
      n._id === id ? { ...n, isRead: true } : n,
    );
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  markAllAsRead: () => {
    set({
      notifications: get().notifications.map((n) => ({
        ...n,
        isRead: true,
      })),
      unreadCount: 0,
    });
  },

  setNotifications: (notifications: Notification[]) => {
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  },

  removeNotification: (id: string) => {
    const notification = get().notifications.find((n) => n._id === id);
    set({
      notifications: get().notifications.filter((n) => n._id !== id),
      unreadCount:
        get().unreadCount - (notification && !notification.isRead ? 1 : 0),
    });
  },
}));
```

---

## 3. API Services

### 3.0. Cau truc thu muc

```
services/
├── auth.service.ts
├── product.service.ts
├── category.service.ts
├── order.service.ts
├── return.service.ts
├── review.service.ts
├── wishlist.service.ts
├── coupon.service.ts
├── customer.service.ts
├── shipper.service.ts
├── upload.service.ts
├── notification.service.ts
├── report.service.ts
├── user.service.ts
└── shift.service.ts
```

Moi service la plain object voi cac method goi Axios instance.
Convention: moi method tra ve `Promise` cua du lieu da extract boi interceptor.

---

### 3.1. authService

```typescript
// ============================================================
// services/auth.service.ts
// ============================================================
import api from '@/lib/api';
import type { LoginCredentials, RegisterData, User } from '@/stores/use-auth-store';

interface AuthTokenResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthTokenResponse>('/auth/login', credentials),

  register: (data: RegisterData) =>
    api.post<AuthTokenResponse>('/auth/register', data),

  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  getMe: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    }),

  googleAuth: (token: string) =>
    api.post<AuthTokenResponse>('/auth/google', { token }),
};
```

---

### 3.2. productService

```typescript
// ============================================================
// services/product.service.ts
// ============================================================
import api from '@/lib/api';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  status?: string;
  color?: string;
  material?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: { _id: string; name: string; slug: string };
  basePrice: number;
  discountPercent: number;
  colors: ProductColor[];
  dimensions: ProductDimension[];
  variants: ProductVariant[];
  images: string[];
  thumbnail: string;
  material?: string;
  averageRating: number;
  reviewCount: number;
  totalSold: number;
  status: string;
  isFeatured: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColor {
  name: string;
  code: string;
  image?: string;
}

export interface ProductDimension {
  width: number;
  height: number;
  length: number;
  label: string;
  priceAdjustment: number;
}

export interface ProductVariant {
  sku: string;
  color?: ProductColor;
  dimensions?: ProductDimension;
  price: number;
  originalPrice: number;
  stock: number;
  image?: string;
}

export const productService = {
  // ----- Public -----
  getAll: (params?: ProductListParams) =>
    api.get<Product[]>('/products', { params }),

  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`),

  search: (query: string, params?: { page?: number; limit?: number }) =>
    api.get<Product[]>('/products/search', {
      params: { q: query, ...params },
    }),

  getAutoComplete: (query: string) =>
    api.get<Array<{ _id: string; name: string; slug: string; thumbnail: string }>>(
      '/products/autocomplete',
      { params: { q: query } },
    ),

  getBestSellers: (limit = 8) =>
    api.get<Product[]>('/products/best-sellers', { params: { limit } }),

  getNewArrivals: (limit = 8) =>
    api.get<Product[]>('/products/new-arrivals', { params: { limit } }),

  compare: (productIds: string[]) =>
    api.post<Product[]>('/products/compare', { productIds }),

  // ----- Admin -----
  create: (data: FormData) =>
    api.post<Product>('/admin/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: FormData | Partial<Product>) =>
    api.patch<Product>(`/admin/products/${id}`, data, {
      headers:
        data instanceof FormData
          ? { 'Content-Type': 'multipart/form-data' }
          : undefined,
    }),

  delete: (id: string) =>
    api.delete(`/admin/products/${id}`),

  updateStock: (
    id: string,
    sku: string,
    stock: number,
  ) =>
    api.patch(`/admin/products/${id}/stock`, { sku, stock }),

  getLowStock: (threshold = 10) =>
    api.get<Product[]>('/admin/products/low-stock', {
      params: { threshold },
    }),

  addColor: (id: string, color: ProductColor) =>
    api.post(`/admin/products/${id}/colors`, color),

  addDimension: (id: string, dimension: ProductDimension) =>
    api.post(`/admin/products/${id}/dimensions`, dimension),
};
```

---

### 3.3. categoryService

```typescript
// ============================================================
// services/category.service.ts
// ============================================================
import api from '@/lib/api';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  children?: Category[];
  level: number;
  order: number;
  isActive: boolean;
  productCount?: number;
}

export interface CategoryCombo {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  products: Array<{
    _id: string;
    name: string;
    slug: string;
    thumbnail: string;
    basePrice: number;
  }>;
  comboPrice: number;
  discountPercent: number;
}

export const categoryService = {
  // ----- Public -----
  getAll: () => api.get<Category[]>('/categories'),

  getTree: () => api.get<Category[]>('/categories/tree'),

  getCombos: () => api.get<CategoryCombo[]>('/categories/combos'),

  getBySlug: (slug: string) => api.get<Category>(`/categories/${slug}`),

  // ----- Admin -----
  create: (data: Partial<Category>) =>
    api.post<Category>('/admin/categories', data),

  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/admin/categories/${id}`, data),

  delete: (id: string) => api.delete(`/admin/categories/${id}`),

  reorder: (items: Array<{ id: string; order: number; parent?: string }>) =>
    api.patch('/admin/categories/reorder', { items }),
};
```

---

### 3.4. orderService

```typescript
// ============================================================
// services/order.service.ts
// ============================================================
import api from '@/lib/api';

export interface CreateOrderDto {
  items: Array<{
    productId: string;
    variantSku: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    fullAddress: string;
  };
  paymentMethod: 'cash' | 'bank_transfer' | 'cod';
  couponCode?: string;
  note?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product: { _id: string; name: string; slug: string; thumbnail: string };
    variantSku: string;
    color?: { name: string; code: string };
    dimensions?: { label: string };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    fullAddress: string;
  };
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  shipper?: {
    _id: string;
    name: string;
    phone: string;
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
  note?: string;
  channel: 'web' | 'pos';
  createdAt: string;
  updatedAt: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sort?: string;
}

export interface UpdateOrderStatusDto {
  status: string;
  note?: string;
}

export const orderService = {
  // ----- Customer -----
  create: (dto: CreateOrderDto) =>
    api.post<Order>('/orders', dto),

  getMyOrders: (params?: OrderListParams) =>
    api.get<Order[]>('/orders/my', { params }),

  getById: (id: string) =>
    api.get<Order>(`/orders/${id}`),

  // ----- Admin -----
  getAll: (params?: OrderListParams) =>
    api.get<Order[]>('/admin/orders', { params }),

  updateStatus: (id: string, dto: UpdateOrderStatusDto) =>
    api.patch<Order>(`/admin/orders/${id}/status`, dto),

  assignShipper: (orderId: string, shipperId: string) =>
    api.patch<Order>(`/admin/orders/${orderId}/assign-shipper`, {
      shipperId,
    }),

  confirmPayment: (orderId: string) =>
    api.patch<Order>(`/admin/orders/${orderId}/confirm-payment`),

  getStats: () =>
    api.get<{
      totalOrders: number;
      pendingOrders: number;
      inTransitOrders: number;
      todayRevenue: number;
    }>('/admin/orders/stats'),

  getRecent: (limit = 10) =>
    api.get<Order[]>('/admin/orders/recent', { params: { limit } }),
};
```

---

### 3.5. returnService

```typescript
// ============================================================
// services/return.service.ts
// ============================================================
import api from '@/lib/api';

export interface CreateReturnDto {
  orderId: string;
  items: Array<{
    variantSku: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
  description?: string;
  images?: string[];
}

export interface Return {
  _id: string;
  order: {
    _id: string;
    orderNumber: string;
  };
  customer: {
    _id: string;
    name: string;
    phone: string;
  };
  items: Array<{
    variantSku: string;
    quantity: number;
    reason: string;
    refundAmount: number;
  }>;
  reason: string;
  description?: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  totalRefund: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const returnService = {
  // ----- Customer -----
  create: (dto: CreateReturnDto) =>
    api.post<Return>('/returns', dto),

  getMyReturns: () =>
    api.get<Return[]>('/returns/my'),

  // ----- Admin -----
  getAll: (params?: ReturnListParams) =>
    api.get<Return[]>('/admin/returns', { params }),

  approve: (id: string) =>
    api.patch<Return>(`/admin/returns/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.patch<Return>(`/admin/returns/${id}/reject`, { reason }),

  processRefund: (id: string) =>
    api.patch<Return>(`/admin/returns/${id}/refund`),
};
```

---

### 3.6. reviewService

```typescript
// ============================================================
// services/review.service.ts
// ============================================================
import api from '@/lib/api';

export interface Review {
  _id: string;
  product: { _id: string; name: string; slug: string };
  customer: { _id: string; name: string; avatar?: string };
  order?: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  helpfulCount: number;
  unhelpfulCount: number;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewDto {
  productId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface ReviewListParams {
  page?: number;
  limit?: number;
  sort?: string;
  rating?: number;
}

export interface ModerateReviewDto {
  status: 'approved' | 'rejected';
  adminReply?: string;
  rejectReason?: string;
}

export const reviewService = {
  // ----- Public -----
  getByProduct: (productId: string, params?: ReviewListParams) =>
    api.get<Review[]>(`/reviews/product/${productId}`, { params }),

  getProductStats: (productId: string) =>
    api.get<ReviewStats>(`/reviews/product/${productId}/stats`),

  // ----- Customer -----
  create: (dto: CreateReviewDto) =>
    api.post<Review>('/reviews', dto),

  update: (id: string, dto: Partial<CreateReviewDto>) =>
    api.patch<Review>(`/reviews/${id}`, dto),

  delete: (id: string) =>
    api.delete(`/reviews/${id}`),

  voteHelpful: (id: string, isHelpful: boolean) =>
    api.post(`/reviews/${id}/vote`, { isHelpful }),

  canReview: (productId: string) =>
    api.get<{ canReview: boolean; reason?: string }>(
      `/reviews/can-review/${productId}`,
    ),

  getMyReviews: () =>
    api.get<Review[]>('/reviews/my'),

  // ----- Admin -----
  getPending: (params?: ReviewListParams) =>
    api.get<Review[]>('/admin/reviews/pending', { params }),

  moderate: (id: string, dto: ModerateReviewDto) =>
    api.patch<Review>(`/admin/reviews/${id}/moderate`, dto),
};
```

---

### 3.7. wishlistService

```typescript
// ============================================================
// services/wishlist.service.ts
// ============================================================
import api from '@/lib/api';
import type { WishlistProduct } from '@/stores/use-wishlist-store';

export interface WishlistListParams {
  page?: number;
  limit?: number;
}

export const wishlistService = {
  getAll: (params?: WishlistListParams) =>
    api.get<WishlistProduct[]>('/wishlist', { params }),

  add: (productId: string) =>
    api.post('/wishlist', { productId }),

  remove: (productId: string) =>
    api.delete(`/wishlist/${productId}`),

  checkMultiple: (productIds: string[]) =>
    api.post<Record<string, boolean>>('/wishlist/check', { productIds }),

  getCount: () =>
    api.get<{ count: number }>('/wishlist/count'),
};
```

---

### 3.8. couponService

```typescript
// ============================================================
// services/coupon.service.ts
// ============================================================
import api from '@/lib/api';

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  scope: 'all' | 'category' | 'product';
  applicableProducts?: string[];
  applicableCategories?: string[];
  usageLimit?: number;
  usageCount: number;
  usagePerUser?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  discount: number;
  message?: string;
  coupon?: Coupon;
}

export interface CouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const couponService = {
  // ----- Public -----
  validate: (
    code: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    subtotal: number,
  ) =>
    api.post<ValidateCouponResult>('/coupons/validate', {
      code,
      items,
      subtotal,
    }),

  getActive: () =>
    api.get<Coupon[]>('/coupons/active'),

  // ----- Admin -----
  getAll: (params?: CouponListParams) =>
    api.get<Coupon[]>('/admin/coupons', { params }),

  getById: (id: string) =>
    api.get<Coupon>(`/admin/coupons/${id}`),

  create: (dto: Partial<Coupon>) =>
    api.post<Coupon>('/admin/coupons', dto),

  update: (id: string, dto: Partial<Coupon>) =>
    api.patch<Coupon>(`/admin/coupons/${id}`, dto),

  delete: (id: string) =>
    api.delete(`/admin/coupons/${id}`),

  activate: (id: string) =>
    api.patch(`/admin/coupons/${id}/activate`),

  deactivate: (id: string) =>
    api.patch(`/admin/coupons/${id}/deactivate`),

  getUsage: (id: string) =>
    api.get<Array<{
      customer: { _id: string; name: string; email: string };
      order: { _id: string; orderNumber: string };
      discount: number;
      usedAt: string;
    }>>(`/admin/coupons/${id}/usage`),
};
```

---

### 3.9. customerService

```typescript
// ============================================================
// services/customer.service.ts
// ============================================================
import api from '@/lib/api';
import type { User, Address } from '@/stores/use-auth-store';

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone: string;
  password?: string;
  addresses?: Address[];
}

export const customerService = {
  // ----- Admin -----
  getAll: (params?: CustomerListParams) =>
    api.get<User[]>('/admin/customers', { params }),

  getById: (id: string) =>
    api.get<User>(`/admin/customers/${id}`),

  getByPhone: (phone: string) =>
    api.get<User>(`/admin/customers/phone/${phone}`),

  create: (dto: CreateCustomerDto) =>
    api.post<User>('/admin/customers', dto),

  update: (id: string, dto: Partial<User>) =>
    api.patch<User>(`/admin/customers/${id}`, dto),

  getTop: (limit = 10) =>
    api.get<Array<User & { totalSpent: number; totalOrders: number }>>(
      '/admin/customers/top',
      { params: { limit } },
    ),

  getStats: (id: string) =>
    api.get<CustomerStats>(`/admin/customers/${id}/stats`),

  // ----- Self (customer tu cap nhat) -----
  addAddress: (dto: Address) =>
    api.post<User>('/customers/addresses', dto),

  updateAddress: (index: number, dto: Address) =>
    api.patch<User>(`/customers/addresses/${index}`, dto),

  removeAddress: (index: number) =>
    api.delete<User>(`/customers/addresses/${index}`),

  setDefaultAddress: (index: number) =>
    api.patch<User>(`/customers/addresses/${index}/default`),
};
```

---

### 3.10. shipperService

```typescript
// ============================================================
// services/shipper.service.ts
// ============================================================
import api from '@/lib/api';
import type { Order } from './order.service';

export interface ShipperEarningsParams {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ShipperStats {
  totalDelivered: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
  todayDelivered: number;
  todayEarnings: number;
}

export interface CodSummary {
  totalCollected: number;
  totalRemitted: number;
  pendingAmount: number;
  orders: Array<{
    orderId: string;
    orderNumber: string;
    codAmount: number;
    collectedAt: string;
    remitted: boolean;
  }>;
}

export interface ShipperLocation {
  shipperId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  currentOrderId?: string;
  lastUpdated: string;
}

export const shipperService = {
  // ----- Shipper (tu phuc vu) -----
  getAvailableOrders: () =>
    api.get<Order[]>('/shipper/orders/available'),

  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<Order[]>('/shipper/orders/my', { params }),

  acceptOrder: (id: string) =>
    api.patch<Order>(`/shipper/orders/${id}/accept`),

  rejectOrder: (id: string, reason: string) =>
    api.patch(`/shipper/orders/${id}/reject`, { reason }),

  deliverOrder: (id: string, proofImage: string) =>
    api.patch<Order>(`/shipper/orders/${id}/deliver`, { proofImage }),

  updateLocation: (
    lat: number,
    lng: number,
    accuracy: number,
    currentOrderId?: string,
  ) =>
    api.post('/shipper/location', {
      latitude: lat,
      longitude: lng,
      accuracy,
      currentOrderId,
    }),

  getStats: () =>
    api.get<ShipperStats>('/shipper/stats'),

  getEarnings: (params?: ShipperEarningsParams) =>
    api.get<{
      total: number;
      items: Array<{
        orderId: string;
        orderNumber: string;
        amount: number;
        deliveredAt: string;
      }>;
    }>('/shipper/earnings', { params }),

  getCodSummary: () =>
    api.get<CodSummary>('/shipper/cod-summary'),

  updateStatus: (status: 'available' | 'busy' | 'offline') =>
    api.patch('/shipper/status', { status }),

  // ----- Admin -----
  getAll: () =>
    api.get<Array<{
      _id: string;
      name: string;
      phone: string;
      status: string;
      totalDelivered: number;
      rating: number;
    }>>('/admin/shippers'),

  getLocations: () =>
    api.get<ShipperLocation[]>('/admin/shippers/locations'),

  assignOrder: (shipperId: string, orderId: string) =>
    api.patch<Order>(`/admin/shippers/${shipperId}/assign`, { orderId }),

  getNearby: (lat: number, lng: number, radius: number) =>
    api.get<ShipperLocation[]>('/admin/shippers/nearby', {
      params: { lat, lng, radius },
    }),
};
```

---

### 3.11. uploadService

```typescript
// ============================================================
// services/upload.service.ts
// ============================================================
import { apiUpload } from '@/lib/api';
import api from '@/lib/api';

export interface UploadedFile {
  _id: string;
  googleDriveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  category: string;
  uploadedBy: string;
  createdAt: string;
}

const createFormData = (file: File, fieldName = 'file'): FormData => {
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
};

export const uploadService = {
  uploadProductImage: (file: File) =>
    apiUpload.post<UploadedFile>(
      '/upload/product-image',
      createFormData(file),
    ),

  uploadProductImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return apiUpload.post<UploadedFile[]>(
      '/upload/product-images',
      formData,
    );
  },

  uploadAvatar: (file: File) =>
    apiUpload.post<UploadedFile>(
      '/upload/avatar',
      createFormData(file),
    ),

  uploadDeliveryProof: (file: File) =>
    apiUpload.post<UploadedFile>(
      '/upload/delivery-proof',
      createFormData(file),
    ),

  uploadReviewImage: (file: File) =>
    apiUpload.post<UploadedFile>(
      '/upload/review-image',
      createFormData(file),
    ),

  deleteFile: (id: string) =>
    api.delete(`/upload/${id}`),
};
```

---

### 3.12. notificationService

```typescript
// ============================================================
// services/notification.service.ts
// ============================================================
import api from '@/lib/api';
import type { Notification } from '@/stores/use-notification-store';

export interface NotificationListParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export const notificationService = {
  getAll: (params?: NotificationListParams) =>
    api.get<Notification[]>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),
};
```

---

### 3.13. reportService

```typescript
// ============================================================
// services/report.service.ts
// ============================================================
import api from '@/lib/api';

export interface DateRangeParams {
  fromDate: string;
  toDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueChange: number; // % so voi hom qua
  ordersChange: number;
  lowStockCount: number;
  pendingReviews: number;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface RevenueReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export const reportService = {
  getDashboard: () =>
    api.get<DashboardData>('/admin/reports/dashboard'),

  getRevenue: (params: DateRangeParams) =>
    api.get<RevenueReport>('/admin/reports/revenue', { params }),

  getOrdersSummary: (params: DateRangeParams) =>
    api.get<{
      total: number;
      byStatus: Record<string, number>;
      byPayment: Record<string, number>;
      byChannel: Record<string, number>;
    }>('/admin/reports/orders-summary', { params }),

  getTopProducts: (params: DateRangeParams & { limit?: number }) =>
    api.get<Array<{
      _id: string;
      name: string;
      thumbnail: string;
      totalSold: number;
      revenue: number;
      averageRating: number;
    }>>('/admin/reports/top-products', { params }),

  getInventory: () =>
    api.get<Array<{
      _id: string;
      name: string;
      sku: string;
      stock: number;
      status: string;
      color?: string;
      dimension?: string;
    }>>('/admin/reports/inventory'),

  getCustomers: (params: DateRangeParams) =>
    api.get<{
      totalNew: number;
      totalReturning: number;
      data: Array<{
        date: string;
        newCustomers: number;
        returningCustomers: number;
      }>;
    }>('/admin/reports/customers', { params }),

  getShipperPerformance: (params: DateRangeParams) =>
    api.get<Array<{
      _id: string;
      name: string;
      totalDelivered: number;
      averageTime: number; // phut
      rating: number;
      completionRate: number;
    }>>('/admin/reports/shipper-performance', { params }),

  getCouponReport: (params: DateRangeParams) =>
    api.get<Array<{
      _id: string;
      code: string;
      usageCount: number;
      totalDiscount: number;
      revenue: number;
    }>>('/admin/reports/coupons', { params }),

  exportExcel: (
    type:
      | 'revenue'
      | 'orders'
      | 'products'
      | 'customers'
      | 'inventory'
      | 'shippers'
      | 'coupons',
    params: DateRangeParams,
  ) =>
    api.get(`/admin/reports/export/${type}`, {
      params,
      responseType: 'blob',
    }),
};
```

---

### 3.14. userService (Admin)

```typescript
// ============================================================
// services/user.service.ts
// ============================================================
import api from '@/lib/api';
import type { User } from '@/stores/use-auth-store';

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
}

export const userService = {
  getAll: (params?: UserListParams) =>
    api.get<User[]>('/admin/users', { params }),

  getById: (id: string) =>
    api.get<User>(`/admin/users/${id}`),

  create: (dto: CreateUserDto) =>
    api.post<User>('/admin/users', dto),

  update: (id: string, dto: Partial<User>) =>
    api.patch<User>(`/admin/users/${id}`, dto),

  delete: (id: string) =>
    api.delete(`/admin/users/${id}`),

  changeRole: (id: string, role: string) =>
    api.patch<User>(`/admin/users/${id}/role`, { role }),

  getStaff: () =>
    api.get<User[]>('/admin/users/staff'),

  getShippers: () =>
    api.get<User[]>('/admin/users/shippers'),
};
```

---

### 3.15. shiftService (POS)

```typescript
// ============================================================
// services/shift.service.ts
// ============================================================
import api from '@/lib/api';

export interface Shift {
  _id: string;
  staff: {
    _id: string;
    name: string;
  };
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  totalSales: number;
  totalOrders: number;
  cashSales: number;
  bankTransferSales: number;
  status: 'open' | 'closed';
  note?: string;
  openedAt: string;
  closedAt?: string;
}

export interface ShiftListParams {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export const shiftService = {
  openShift: (openingCash: number) =>
    api.post<Shift>('/shifts/open', { openingCash }),

  closeShift: (id: string, closingCash: number, note?: string) =>
    api.patch<Shift>(`/shifts/${id}/close`, { closingCash, note }),

  getCurrentShift: () =>
    api.get<Shift | null>('/shifts/current'),

  getShiftById: (id: string) =>
    api.get<Shift>(`/shifts/${id}`),

  getMyShifts: (params?: ShiftListParams) =>
    api.get<Shift[]>('/shifts/my', { params }),
};
```

---

## 4. React Query Hooks

### 4.0. Cau truc thu muc va quy uoc

```
hooks/
├── use-products.ts
├── use-product.ts
├── use-orders.ts
├── use-reviews.ts
├── use-categories.ts
├── use-notifications.ts
├── use-wishlist.ts
├── use-coupons.ts
├── use-customers.ts
├── use-shippers.ts
├── use-reports.ts
├── use-users.ts
├── use-shifts.ts
├── use-socket.ts
└── use-upload.ts
```

**Query key convention:**

| Resource | Key Pattern | Vi du |
|----------|-------------|-------|
| Products list | `['products', params]` | `['products', { page: 1, category: 'sofa' }]` |
| Single product | `['product', slug]` | `['product', 'sofa-go-tu-nhien']` |
| My orders | `['orders', 'my', params]` | `['orders', 'my', { page: 1 }]` |
| Admin orders | `['orders', 'admin', params]` | `['orders', 'admin', { status: 'pending' }]` |
| Single order | `['order', id]` | `['order', '661a1b2c...']` |
| Reviews | `['reviews', productId, params]` | `['reviews', '661a...', { page: 1 }]` |
| Review stats | `['review-stats', productId]` | `['review-stats', '661a...']` |
| Categories | `['categories']` | - |
| Category tree | `['categories', 'tree']` | - |
| Dashboard | `['dashboard']` | - |
| Notifications | `['notifications', params]` | `['notifications', { page: 1 }]` |
| Unread count | `['notifications', 'unread-count']` | - |

---

### 4.1. useProducts (danh sach san pham)

```typescript
// ============================================================
// hooks/use-products.ts
// ============================================================
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { productService, type Product, type ProductListParams } from '@/services/product.service';

// ----- Danh sach san pham -----
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await productService.getAll(params);
      return {
        data: response.data as Product[],
        meta: (response as any).meta,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// ----- Best sellers -----
export function useBestSellers(limit = 8) {
  return useQuery({
    queryKey: ['products', 'best-sellers', limit],
    queryFn: () => productService.getBestSellers(limit).then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 phut
  });
}

// ----- New arrivals -----
export function useNewArrivals(limit = 8) {
  return useQuery({
    queryKey: ['products', 'new-arrivals', limit],
    queryFn: () => productService.getNewArrivals(limit).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ----- Tim kiem -----
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productService.search(query).then((r) => r.data),
    enabled: query.length >= 2,
  });
}

// ----- Autocomplete -----
export function useAutoComplete(query: string) {
  return useQuery({
    queryKey: ['products', 'autocomplete', query],
    queryFn: () => productService.getAutoComplete(query).then((r) => r.data),
    enabled: query.length >= 1,
    staleTime: 30 * 1000, // 30 giay
  });
}

// ----- So sanh san pham -----
export function useProductComparison(productIds: string[]) {
  return useQuery({
    queryKey: ['products', 'compare', productIds],
    queryFn: () => productService.compare(productIds).then((r) => r.data),
    enabled: productIds.length >= 2,
  });
}

// ----- Admin: Tao san pham -----
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => productService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ----- Admin: Cap nhat san pham -----
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Partial<Product> }) =>
      productService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

// ----- Admin: Xoa san pham -----
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ----- Admin: San pham sap het hang -----
export function useLowStockProducts(threshold = 10) {
  return useQuery({
    queryKey: ['products', 'low-stock', threshold],
    queryFn: () => productService.getLowStock(threshold).then((r) => r.data),
    staleTime: 60 * 1000,
  });
}
```

---

### 4.2. useProduct (chi tiet san pham)

```typescript
// ============================================================
// hooks/use-product.ts
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { productService, type Product } from '@/services/product.service';

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug).then((r) => r.data as Product),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 phut
  });
}
```

---

### 4.3. useOrders (don hang)

```typescript
// ============================================================
// hooks/use-orders.ts
// ============================================================
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  orderService,
  type CreateOrderDto,
  type OrderListParams,
  type UpdateOrderStatusDto,
} from '@/services/order.service';
import { useCartStore } from '@/stores/use-cart-store';

// ----- Tao don hang -----
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: (dto: CreateOrderDto) => orderService.create(dto),
    onSuccess: () => {
      // Xoa gio hang sau khi dat hang thanh cong
      clearCart();
      // Invalidate danh sach don hang
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ----- Don hang cua toi -----
export function useMyOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ['orders', 'my', params],
    queryFn: async () => {
      const response = await orderService.getMyOrders(params);
      return {
        data: response.data,
        meta: (response as any).meta,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// ----- Chi tiet don hang -----
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

// ----- Admin: Tat ca don hang -----
export function useAdminOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: ['orders', 'admin', params],
    queryFn: async () => {
      const response = await orderService.getAll(params);
      return {
        data: response.data,
        meta: (response as any).meta,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// ----- Admin: Cap nhat trang thai -----
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOrderStatusDto }) =>
      orderService.updateStatus(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ----- Admin: Gan shipper -----
export function useAssignShipper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      shipperId,
    }: {
      orderId: string;
      shipperId: string;
    }) => orderService.assignShipper(orderId, shipperId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({
        queryKey: ['order', variables.orderId],
      });
    },
  });
}

// ----- Admin: Thong ke don hang -----
export function useOrderStats() {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => orderService.getStats().then((r) => r.data),
    refetchInterval: 60 * 1000, // Refetch moi phut
  });
}

// ----- Admin: Don hang gan day -----
export function useRecentOrders(limit = 10) {
  return useQuery({
    queryKey: ['orders', 'recent', limit],
    queryFn: () => orderService.getRecent(limit).then((r) => r.data),
    refetchInterval: 30 * 1000, // 30 giay
  });
}
```

---

### 4.4. useReviews (danh gia)

```typescript
// ============================================================
// hooks/use-reviews.ts
// ============================================================
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  reviewService,
  type CreateReviewDto,
  type ModerateReviewDto,
  type ReviewListParams,
} from '@/services/review.service';

// ----- Danh gia theo san pham -----
export function useReviews(productId: string, params?: ReviewListParams) {
  return useQuery({
    queryKey: ['reviews', productId, params],
    queryFn: async () => {
      const response = await reviewService.getByProduct(productId, params);
      return {
        data: response.data,
        meta: (response as any).meta,
      };
    },
    enabled: !!productId,
    placeholderData: (previousData) => previousData,
  });
}

// ----- Thong ke danh gia -----
export function useReviewStats(productId: string) {
  return useQuery({
    queryKey: ['review-stats', productId],
    queryFn: () =>
      reviewService.getProductStats(productId).then((r) => r.data),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

// ----- Tao danh gia -----
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateReviewDto) => reviewService.create(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['review-stats', variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['product'],
      });
    },
  });
}

// ----- Vote huu ich -----
export function useVoteHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      reviewService.voteHelpful(id, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ----- Kiem tra co the danh gia -----
export function useCanReview(productId: string) {
  return useQuery({
    queryKey: ['can-review', productId],
    queryFn: () => reviewService.canReview(productId).then((r) => r.data),
    enabled: !!productId,
  });
}

// ----- Danh gia cua toi -----
export function useMyReviews() {
  return useQuery({
    queryKey: ['reviews', 'my'],
    queryFn: () => reviewService.getMyReviews().then((r) => r.data),
  });
}

// ----- Admin: Danh gia cho duyet -----
export function usePendingReviews(params?: ReviewListParams) {
  return useQuery({
    queryKey: ['reviews', 'pending', params],
    queryFn: async () => {
      const response = await reviewService.getPending(params);
      return {
        data: response.data,
        meta: (response as any).meta,
      };
    },
  });
}

// ----- Admin: Duyet danh gia -----
export function useModerateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ModerateReviewDto }) =>
      reviewService.moderate(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
```

---

## 5. Socket Hooks

### 5.1. useSocket (core)

```typescript
// ============================================================
// hooks/use-socket.ts
// ============================================================
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/use-auth-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

interface UseSocketOptions {
  autoConnect?: boolean;
  rooms?: string[];
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, rooms = [] } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  // ----- Connect -----
  const connect = useCallback(() => {
    if (!accessToken) return;
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // Auto join rooms da chi dinh
      rooms.forEach((room) => {
        socket.emit('join_room', room);
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    socketRef.current = socket;
    return socket;
  }, [accessToken, rooms]);

  // ----- Disconnect -----
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // ----- Join Room -----
  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join_room', room);
  }, []);

  // ----- Leave Room -----
  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave_room', room);
  }, []);

  // ----- Subscribe event (tra ve cleanup function) -----
  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    [],
  );

  // ----- Unsubscribe event -----
  const off = useCallback(
    (event: string, callback?: (...args: any[]) => void) => {
      if (callback) {
        socketRef.current?.off(event, callback);
      } else {
        socketRef.current?.removeAllListeners(event);
      }
    },
    [],
  );

  // ----- Emit event -----
  const emit = useCallback(
    (event: string, data?: any) => {
      socketRef.current?.emit(event, data);
    },
    [],
  );

  // ----- Lifecycle -----
  useEffect(() => {
    if (autoConnect && accessToken) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, accessToken, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    on,
    off,
    emit,
  };
}
```

---

### 5.2. useOrderTracking

```typescript
// ============================================================
// hooks/use-order-tracking.ts
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';
import type {
  OrderStatusPayload,
  ShipperLocationPayload,
} from '@/types/socket';

interface OrderTrackingState {
  status: string | null;
  statusHistory: OrderStatusPayload[];
  shipperLocation: ShipperLocationPayload | null;
}

export function useOrderTracking(orderId: string) {
  const { on, joinRoom, leaveRoom, isConnected } = useSocket();

  const [state, setState] = useState<OrderTrackingState>({
    status: null,
    statusHistory: [],
    shipperLocation: null,
  });

  useEffect(() => {
    if (!orderId || !isConnected) return;

    // Join room cua don hang nay
    joinRoom(`room:order:${orderId}`);

    // Lang nghe trang thai don hang
    const offStatus = on(
      'order:status_updated',
      (data: OrderStatusPayload) => {
        if (data.orderId === orderId) {
          setState((prev) => ({
            ...prev,
            status: data.newStatus,
            statusHistory: [...prev.statusHistory, data],
          }));
        }
      },
    );

    // Lang nghe vi tri shipper
    const offLocation = on(
      'shipper:location_updated',
      (data: ShipperLocationPayload) => {
        setState((prev) => ({
          ...prev,
          shipperLocation: data,
        }));
      },
    );

    // Lang nghe khi don hang duoc gan shipper
    const offAssigned = on(
      'order:assigned',
      (data: { orderId: string }) => {
        if (data.orderId === orderId) {
          // Trigger refetch order data
          setState((prev) => ({ ...prev }));
        }
      },
    );

    return () => {
      offStatus();
      offLocation();
      offAssigned();
      leaveRoom(`room:order:${orderId}`);
    };
  }, [orderId, isConnected, on, joinRoom, leaveRoom]);

  return {
    ...state,
    isConnected,
  };
}
```

---

### 5.3. useAdminNotifications

```typescript
// ============================================================
// hooks/use-admin-notifications.ts
// ============================================================
import { useEffect } from 'react';
import { useSocket } from './use-socket';
import { useNotificationStore } from '@/stores/use-notification-store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  OrderCreatedPayload,
  ReviewPayload,
  ReturnPayload,
  StockAlertPayload,
} from '@/types/socket';

export function useAdminNotifications() {
  const { on, isConnected } = useSocket({ rooms: ['room:admin'] });
  const addNotification = useNotificationStore((s) => s.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    // ----- Don hang moi -----
    const offOrderCreated = on(
      'order:created',
      (data: OrderCreatedPayload) => {
        toast.info(`Don hang moi: ${data.orderNumber}`, {
          description: `${data.totalAmount.toLocaleString('vi-VN')}d - ${data.channel === 'web' ? 'Online' : 'POS'}`,
        });
        addNotification({
          _id: `order-${data.orderId}`,
          title: 'Don hang moi',
          message: `Don hang ${data.orderNumber} vua duoc tao`,
          type: 'order',
          link: `/admin/don-hang/${data.orderId}`,
          isRead: false,
          createdAt: data.createdAt,
        });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    );

    // ----- Trang thai don hang thay doi -----
    const offOrderStatus = on(
      'order:status_updated',
      () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      },
    );

    // ----- Danh gia moi -----
    const offReview = on('review:new', (data: ReviewPayload) => {
      toast.info(`Danh gia moi: ${data.productName}`, {
        description: `${data.customerName} - ${data.rating} sao`,
      });
      addNotification({
        _id: `review-${data.reviewId}`,
        title: 'Danh gia moi cho duyet',
        message: `${data.customerName} danh gia ${data.productName} - ${data.rating} sao`,
        type: 'review',
        link: `/admin/danh-gia`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'pending'] });
    });

    // ----- Yeu cau tra hang -----
    const offReturn = on('return:requested', (data: ReturnPayload) => {
      toast.warning('Yeu cau tra hang moi', {
        description: `Don hang lien quan: ${data.orderId}`,
      });
      addNotification({
        _id: `return-${data.returnId}`,
        title: 'Yeu cau tra hang',
        message: `Ly do: ${data.reason}`,
        type: 'return',
        link: `/admin/tra-hang/${data.returnId}`,
        isRead: false,
        createdAt: data.createdAt,
      });
    });

    // ----- Canh bao het hang -----
    const offStock = on('stock:low', (data: StockAlertPayload) => {
      toast.error(`Sap het hang: ${data.productName}`, {
        description: `Con lai: ${data.currentStock} | SKU: ${data.sku}`,
      });
      addNotification({
        _id: `stock-${data.productId}-${data.sku}`,
        title: 'Canh bao ton kho',
        message: `${data.productName} (${data.sku}) chi con ${data.currentStock} san pham`,
        type: 'stock',
        link: `/admin/san-pham/${data.productId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({
        queryKey: ['products', 'low-stock'],
      });
    });

    // ----- Don tu POS -----
    const offPos = on('pos:order_created', (data: OrderCreatedPayload) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    return () => {
      offOrderCreated();
      offOrderStatus();
      offReview();
      offReturn();
      offStock();
      offPos();
    };
  }, [isConnected, on, addNotification, queryClient]);

  return { isConnected };
}
```

---

### 5.4. useShipperSocket

```typescript
// ============================================================
// hooks/use-shipper-socket.ts
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from './use-socket';
import type { OrderAssignedPayload } from '@/types/socket';

interface UseShipperSocketOptions {
  onNewOrder?: (data: OrderAssignedPayload) => void;
  locationInterval?: number; // ms, mac dinh 10000 (10 giay)
}

export function useShipperSocket(
  shipperId: string,
  options: UseShipperSocketOptions = {},
) {
  const { locationInterval = 10000, onNewOrder } = options;
  const { emit, on, isConnected } = useSocket({
    rooms: [`room:shipper:${shipperId}`, 'room:shippers'],
  });
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentOrderIdRef = useRef<string | undefined>(undefined);

  // ----- Cap nhat vi tri lien tuc -----
  const startLocationUpdates = useCallback(
    (currentOrderId?: string) => {
      currentOrderIdRef.current = currentOrderId;

      // Dung neu dang chay
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const sendLocation = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            emit('shipper:update_location', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              currentOrderId: currentOrderIdRef.current,
            });
          },
          (error) => {
            console.error('[Shipper GPS] Error:', error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        );
      };

      // Gui ngay lap tuc
      sendLocation();
      // Gui dinh ky
      intervalRef.current = setInterval(sendLocation, locationInterval);
    },
    [emit, locationInterval],
  );

  // ----- Dung cap nhat vi tri -----
  const stopLocationUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ----- Cap nhat trang thai shipper -----
  const updateStatus = useCallback(
    (status: 'online' | 'offline' | 'delivering') => {
      emit('shipper:update_status', { status });
    },
    [emit],
  );

  // ----- Lang nghe don hang moi -----
  useEffect(() => {
    if (!isConnected) return;

    const offAssigned = on(
      'order:assigned',
      (data: OrderAssignedPayload) => {
        onNewOrder?.(data);
      },
    );

    return () => {
      offAssigned();
    };
  }, [isConnected, on, onNewOrder]);

  // ----- Cleanup -----
  useEffect(() => {
    return () => {
      stopLocationUpdates();
    };
  }, [stopLocationUpdates]);

  return {
    isConnected,
    startLocationUpdates,
    stopLocationUpdates,
    updateStatus,
    emit,
    on,
  };
}
```

---

### 5.5. Socket Event Types

```typescript
// ============================================================
// types/socket.ts
// Shared interfaces cho Socket.IO events (dong bo voi backend)
// ============================================================

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  channel: 'web' | 'pos';
  createdAt: string;
}

export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
}

export interface OrderAssignedPayload {
  orderId: string;
  orderNumber: string;
  shippingAddress: {
    fullAddress: string;
    province: string;
  };
}

export interface ShipperLocationPayload {
  shipperId: string;
  shipperName: string;
  latitude: number;
  longitude: number;
  currentOrderId?: string;
  timestamp: string;
}

export interface ShipperStatusPayload {
  shipperId: string;
  name: string;
  status: 'online' | 'offline' | 'delivering';
  timestamp: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  createdAt: string;
}

export interface ReviewPayload {
  reviewId: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  customerName: string;
}

export interface ReturnPayload {
  returnId: string;
  orderId: string;
  reason: string;
  createdAt: string;
}

export interface StockAlertPayload {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  color?: string;
  dimension?: string;
}
```

---

## 6. Utility Functions

```typescript
// ============================================================
// lib/utils.ts
// ============================================================
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// cn - ket hop clsx + tailwind-merge
// Dung cho conditional classnames trong components
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// formatCurrency - Dinh dang tien VND
// Vi du: 1500000 -> "1.500.000d"
// ============================================================
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'd';
}

// ============================================================
// formatDate - Dinh dang ngay kieu Viet Nam
// Vi du: "2026-04-02T10:30:00Z" -> "02/04/2026 10:30"
// ============================================================
export function formatDate(
  date: string | Date,
  options?: {
    showTime?: boolean;
    showSeconds?: boolean;
  },
): string {
  const { showTime = true, showSeconds = false } = options || {};
  const d = new Date(date);

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  let result = `${day}/${month}/${year}`;

  if (showTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;

    if (showSeconds) {
      const seconds = d.getSeconds().toString().padStart(2, '0');
      result += `:${seconds}`;
    }
  }

  return result;
}

// ============================================================
// formatPhone - Dinh dang so dien thoai
// Vi du: "0912345678" -> "0912 345 678"
// ============================================================
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
}

// ============================================================
// getImageUrl - Chuyen Google Drive fileId thanh URL xem anh
// Vi du: "1a2b3c" -> "https://drive.google.com/thumbnail?id=1a2b3c&sz=w800"
// ============================================================
export function getImageUrl(
  googleDriveFileId: string,
  size: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium',
): string {
  if (!googleDriveFileId) {
    return '/images/placeholder.png';
  }

  // Neu da la URL day du thi tra ve luon
  if (googleDriveFileId.startsWith('http')) {
    return googleDriveFileId;
  }

  const sizeMap: Record<string, string> = {
    thumbnail: 'w200',
    medium: 'w800',
    large: 'w1200',
    original: 'w2000',
  };

  return `https://drive.google.com/thumbnail?id=${googleDriveFileId}&sz=${sizeMap[size]}`;
}

// ============================================================
// slugify - Tao slug tu text (ho tro tieng Viet)
// Vi du: "Sofa Go Tu Nhien" -> "sofa-go-tu-nhien"
// ============================================================
export function slugify(text: string): string {
  const vietnameseMap: Record<string, string> = {
    'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a',
    'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a',
    'e': 'e', 'e': 'e', 'e': 'e', 'e': 'e', 'e': 'e',
    'e': 'e', 'e': 'e', 'e': 'e', 'e': 'e',
    'i': 'i', 'i': 'i', 'i': 'i', 'i': 'i', 'i': 'i',
    'o': 'o', 'o': 'o', 'o': 'o', 'o': 'o', 'o': 'o', 'o': 'o',
    'o': 'o', 'o': 'o', 'o': 'o', 'o': 'o', 'o': 'o',
    'u': 'u', 'u': 'u', 'u': 'u', 'u': 'u', 'u': 'u',
    'u': 'u', 'u': 'u', 'u': 'u', 'u': 'u', 'u': 'u',
    'y': 'y', 'y': 'y', 'y': 'y', 'y': 'y', 'y': 'y',
    'd': 'd',
  };

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xoa dau
    .replace(/[d]/g, 'd') // d -> d (xu ly rieng vi khong nam trong NFD)
    .replace(/[^a-z0-9\s-]/g, '') // Chi giu ky tu an toan
    .replace(/[\s_]+/g, '-') // Khoang trang -> dau gach ngang
    .replace(/-+/g, '-') // Xoa dau gach ngang trung
    .replace(/^-+|-+$/g, ''); // Xoa dau gach ngang dau/cuoi
}

// ============================================================
// getOrderStatusLabel - Nhan tieng Viet cho trang thai don hang
// ============================================================
export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Cho xac nhan',
    confirmed: 'Da xac nhan',
    preparing: 'Dang chuan bi',
    waiting_pickup: 'Cho lay hang',
    in_transit: 'Dang giao',
    shipping: 'Dang giao',
    delivered: 'Da giao',
    cancelled: 'Da huy',
    returned: 'Da tra hang',
    refunded: 'Da hoan tien',
  };

  return labels[status] || status;
}

// ============================================================
// getOrderStatusColor - Tailwind color class cho trang thai
// ============================================================
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    waiting_pickup: 'bg-purple-100 text-purple-800 border-purple-200',
    in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
    shipping: 'bg-orange-100 text-orange-800 border-orange-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    returned: 'bg-gray-100 text-gray-800 border-gray-200',
    refunded: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

// ============================================================
// Cac util bo sung
// ============================================================

/**
 * getPaymentStatusLabel - Nhan trang thai thanh toan
 */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Chua thanh toan',
    paid: 'Da thanh toan',
    failed: 'That bai',
    refunded: 'Da hoan tien',
  };
  return labels[status] || status;
}

/**
 * getPaymentMethodLabel - Nhan phuong thuc thanh toan
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Tien mat',
    bank_transfer: 'Chuyen khoan',
    cod: 'Thanh toan khi nhan hang (COD)',
  };
  return labels[method] || method;
}

/**
 * truncate - Cat chuoi va them "..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * debounce - Delay ham goi
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * formatRelativeTime - Thoi gian tuong doi
 * Vi du: "5 phut truoc", "2 gio truoc", "Hom qua"
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vua xong';
  if (diffMin < 60) return `${diffMin} phut truoc`;
  if (diffHour < 24) return `${diffHour} gio truoc`;
  if (diffDay === 1) return 'Hom qua';
  if (diffDay < 7) return `${diffDay} ngay truoc`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} tuan truoc`;

  return formatDate(date, { showTime: false });
}
```

---

## Bang tham chieu nhanh

### Tong hop Stores

| Store | Persist | Storage | Dung de |
|-------|---------|---------|---------|
| `useAuthStore` | Co | localStorage | Xac thuc, thong tin user, token |
| `useCartStore` | Co | localStorage | Gio hang, coupon |
| `useWishlistStore` | Co | localStorage | Danh sach yeu thich (productIds) |
| `useComparisonStore` | Co | sessionStorage | So sanh san pham (toi da 4) |
| `useNotificationStore` | Khong | memory | Thong bao realtime |

### Tong hop Services

| Service | Endpoint prefix | Ghi chu |
|---------|----------------|---------|
| `authService` | `/auth` | Login, register, refresh, Google OAuth |
| `productService` | `/products`, `/admin/products` | CRUD san pham, search, compare |
| `categoryService` | `/categories`, `/admin/categories` | Danh muc, tree, combos |
| `orderService` | `/orders`, `/admin/orders` | Don hang, trang thai, gan shipper |
| `returnService` | `/returns`, `/admin/returns` | Tra hang, duyet, hoan tien |
| `reviewService` | `/reviews`, `/admin/reviews` | Danh gia, moderate, vote |
| `wishlistService` | `/wishlist` | Yeu thich |
| `couponService` | `/coupons`, `/admin/coupons` | Ma giam gia, validate |
| `customerService` | `/customers`, `/admin/customers` | Khach hang, dia chi |
| `shipperService` | `/shipper`, `/admin/shippers` | Shipper, vi tri, COD |
| `uploadService` | `/upload` | Upload anh len Google Drive |
| `notificationService` | `/notifications` | Thong bao |
| `reportService` | `/admin/reports` | Bao cao, dashboard, export |
| `userService` | `/admin/users` | Quan ly user (admin) |
| `shiftService` | `/shifts` | Ca lam viec POS |

### Tong hop Socket Events

| Hook | Room | Events lang nghe |
|------|------|-------------------|
| `useOrderTracking` | `room:order:{id}` | `order:status_updated`, `shipper:location_updated`, `order:assigned` |
| `useAdminNotifications` | `room:admin` | `order:created`, `order:status_updated`, `review:new`, `return:requested`, `stock:low`, `pos:order_created` |
| `useShipperSocket` | `room:shipper:{id}`, `room:shippers` | `order:assigned` + emit `shipper:update_location`, `shipper:update_status` |
