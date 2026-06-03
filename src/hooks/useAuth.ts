'use client';

import { useCallback } from 'react';
import api from '@/lib/axios';
import { getCookie, removeCookie, setCookie } from '@/lib/cookies';

export function useAuth() {
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const token = response.data?.access_token;
    if (!token) {
      throw new Error('Token tidak ditemukan dari server');
    }
    setCookie('token', token);
    if (response.data?.guru) {
      setCookie('guru', JSON.stringify(response.data.guru));
      setCookie('role', response.data.guru.role || 'guru');
    }
    return response.data;
  }, []);

  const logout = useCallback(() => {
    removeCookie('token');
    removeCookie('guru');
    removeCookie('role');
    window.location.replace('/login');
  }, []);

  const isLoggedIn = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(getCookie('token'));
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data as { message: string; debug_code?: string; expires_at?: string };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, new_password: string) => {
    const response = await api.post('/auth/reset-password', { email, code, new_password });
    return response.data as { message: string };
  }, []);

  return { login, logout, isLoggedIn, forgotPassword, resetPassword };
}
