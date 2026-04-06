import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

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

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Upload instance with multipart
const apiUpload: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 120000,
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Token refresh queue mechanism
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token!);
  });
  failedQueue = [];
};

// Request interceptor - attach Bearer token
const attachToken = (config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('furniture-auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      } catch {}
    }
  }
  return config;
};

api.interceptors.request.use(attachToken, (error) => Promise.reject(error));
apiUpload.interceptors.request.use(attachToken, (error) => Promise.reject(error));

// Response interceptor - unwrap data + handle 401
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const apiResponse = response.data as any;
    // Backend paginated format: { success, data: { items: [], total, page, limit, totalPages } }
    if (apiResponse?.data?.items !== undefined && apiResponse?.data?.totalPages !== undefined) {
      return {
        ...response,
        data: apiResponse.data.items,
        meta: {
          total: apiResponse.data.total,
          page: apiResponse.data.page,
          limit: apiResponse.data.limit,
          totalPages: apiResponse.data.totalPages,
        },
      } as any;
    }
    // Format: { data: [], meta: {} }
    if (apiResponse?.meta) {
      return { ...response, data: apiResponse.data, meta: apiResponse.meta } as any;
    }
    // Format: { items: [], total, page, limit, totalPages } — items at root
    if (apiResponse?.items !== undefined) {
      return {
        ...response,
        data: apiResponse.items,
        meta: { total: apiResponse.total, page: apiResponse.page, limit: apiResponse.limit, totalPages: apiResponse.totalPages },
      } as any;
    }
    // Single object: { success, data: T }
    return { ...response, data: apiResponse?.data ?? apiResponse } as any;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      return Promise.reject({ message, statusCode: error.response?.status, errors: error.response?.data?.errors });
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const authStorage = localStorage.getItem('furniture-auth-storage');
      const { state } = JSON.parse(authStorage || '{}');
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
        { refreshToken: state?.refreshToken }
      );

      const tokenData = data.data?.tokens ?? data.data;
      const newToken = tokenData.accessToken;
      const newRefreshToken = tokenData.refreshToken;

      // Update storage + cookie
      const currentState = JSON.parse(localStorage.getItem('furniture-auth-storage') || '{}');
      currentState.state = { ...currentState.state, accessToken: newToken, refreshToken: newRefreshToken };
      localStorage.setItem('furniture-auth-storage', JSON.stringify(currentState));
      document.cookie = `access_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('furniture-auth-storage');
      document.cookie = 'access_token=; path=/; max-age=0';
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

apiUpload.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return { ...response, data: response.data.data } as any;
  },
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.message || 'Upload thất bại';
    return Promise.reject({ message, statusCode: error.response?.status });
  }
);

export { api as default, api, apiUpload };
