'use client';

import { useCallback } from 'react';
import api from '@/lib/axios';

export type KelasItem = {
  id: number;
  nama_kelas: string;
  tingkat: number;
};

export function useKelas() {
  const fetchKelas = useCallback(async () => {
    const response = await api.get('/kelas');
    return response.data as KelasItem[];
  }, []);

  const initDefaultKelas = useCallback(async () => {
    const response = await api.get('/kelas/init');
    return response.data as KelasItem[];
  }, []);

  const createKelas = useCallback(async (payload: { nama_kelas: string; tingkat: number }) => {
    const response = await api.post('/kelas', payload);
    return response.data as KelasItem;
  }, []);

  return { fetchKelas, initDefaultKelas, createKelas };
}
