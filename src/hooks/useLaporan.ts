'use client';

import { useCallback } from 'react';
import api from '@/lib/axios';

type LaporanRow = {
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
};

export function useLaporan() {
  const fetchLaporan = useCallback(async (bulan: number, tahun: number, kelas_id: number) => {
    const response = await api.get('/laporan/bulanan', {
      params: { bulan, tahun, kelas_id },
    });
    return response.data as LaporanRow[];
  }, []);

  const exportPDF = useCallback(async (bulan: number, tahun: number, kelas_id: number) => {
    const response = await api.get('/laporan/export-pdf', {
      params: { bulan, tahun, kelas_id },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-absensi-${tahun}-${String(bulan).padStart(2, '0')}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  return { fetchLaporan, exportPDF };
}
