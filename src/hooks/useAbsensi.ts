'use client';

import { useCallback } from 'react';
import api from '@/lib/axios';

export type AbsensiPayload = {
  siswa_id: number;
  kelas_id: number;
  guru_id: number;
  tanggal: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpha';
};

export type AbsensiBatchPayload = {
  kelas_id: number;
  guru_id: number;
  tanggal: string;
  items: Array<{
    siswa_id: number;
    status: AbsensiPayload['status'];
  }>;
};

export function useAbsensi() {
  const fetchAbsensi = useCallback(async (kelas_id: number, tanggal: string) => {
    const response = await api.get('/absensi', {
      params: { kelas_id, tanggal },
    });
    return response.data;
  }, []);

  const submitAbsensi = useCallback(async (data: AbsensiPayload) => {
    const response = await api.post('/absensi', data);
    return response.data;
  }, []);

  const submitAbsensiBatch = useCallback(async (data: AbsensiBatchPayload) => {
    const response = await api.post('/absensi', data);
    return response.data;
  }, []);

  return { fetchAbsensi, submitAbsensi, submitAbsensiBatch };
}
