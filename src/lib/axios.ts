'use client';

import axios from 'axios';
import { getCookie, removeCookie } from './cookies';
import { shouldIgnoreUnauthorized } from './auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getCookie('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error?.config?.url ?? '');
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (
      error?.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !isAuthRoute &&
      !shouldIgnoreUnauthorized()
    ) {
      removeCookie('token');
      removeCookie('guru');
      removeCookie('role');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

export default api;
