'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookies';

export function useWithAuth(allowedRoles?: string[]) {
  const router = useRouter();
  const allowedRolesKey = useMemo(() => allowedRoles?.join('|') || '', [allowedRoles]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getCookie('token');
    const role = getCookie('role');
    const roles = allowedRolesKey ? allowedRolesKey.split('|') : [];
    if (!token) {
      router.replace('/login');
      return;
    }
    if (roles.length && (!role || !roles.includes(role))) {
      router.replace(role === 'kepsek' ? '/kepsek' : '/dashboard');
    }
  }, [allowedRolesKey, router]);
}
