'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/use-auth-store';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import type { LoginCredentials, RegisterData } from '@/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Đăng nhập thành công!');
      // Full page reload to ensure middleware sees the new cookie
      if (data.user.role === 'admin' || data.user.role === 'manager') window.location.href = '/admin';
      else if (data.user.role === 'staff') window.location.href = '/pos';
      else if (data.user.role === 'shipper') window.location.href = '/shipper';
      else window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng nhập thất bại');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Đăng ký thành công!');
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error.message || 'Đăng ký thất bại');
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Sync user data vao store sau khi fetch - dung useEffect tranh setState-in-render
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser, setUser]);

  const logout = () => {
    authService.logout().catch(() => {});
    storeLogout();
    queryClient.clear();
    router.push('/login');
    toast.success('Đã đăng xuất');
  };

  return {
    user: currentUser || user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
