'use client';

import { useCallback } from 'react';
import api from '@/lib/axios';

export type NotifikasiItem = {
  id: number;
  guru_id: number;
  pesan: string;
  is_read: boolean;
  created_at: string;
};

export function useNotifikasi() {
  const fetchNotifikasi = useCallback(async () => {
    const response = await api.get('/notifikasi');
    return response.data as NotifikasiItem[];
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    const response = await api.patch(`/notifikasi/${id}/read`);
    return response.data as NotifikasiItem;
  }, []);

  return { fetchNotifikasi, markAsRead };
}
