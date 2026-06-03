'use client';

import api from '@/lib/axios';

export type SiswaItem = {
  id: number;
  nama: string;
  nis: string;
  kelas_id: number;
  kelas?: {
    id: number;
    nama_kelas: string;
    tingkat: number;
  };
};

export function useSiswa() {
  const fetchSiswa = async (kelasId?: number) => {
    const response = await api.get('/siswa', {
      params: kelasId ? { kelas_id: kelasId } : undefined,
    });
    return response.data as SiswaItem[];
  };

  const createSiswa = async (payload: { nama: string; nis: string; kelas_id: number }) => {
    const response = await api.post('/siswa', payload);
    return response.data as SiswaItem;
  };

  const updateSiswa = async (
    id: number,
    payload: { nama: string; nis: string; kelas_id: number },
  ) => {
    const response = await api.patch(`/siswa/${id}`, payload);
    return response.data as SiswaItem;
  };

  const deleteSiswa = async (id: number) => {
    const response = await api.delete(`/siswa/${id}`);
    return response.data as { message: string };
  };

  return { fetchSiswa, createSiswa, updateSiswa, deleteSiswa };
}
