'use client';

import { getCookie } from './cookies';

export function hasAuthToken() {
  if (typeof window === 'undefined') return false;
  return Boolean(getCookie('token'));
}

export function shouldIgnoreUnauthorized() {
  return !hasAuthToken();
}
