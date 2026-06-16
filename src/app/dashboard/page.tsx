'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { useAbsensi, type AbsensiPayload } from '@/hooks/useAbsensi';
import { useWithAuth } from '@/hooks/withAuth';
import { useSiswa, type SiswaItem } from '@/hooks/useSiswa';
import { useKelas, type KelasItem } from '@/hooks/useKelas';
import GuruSidebar from '@/components/GuruSidebar';
import { getCookie } from '@/lib/cookies';
import { shouldIgnoreUnauthorized } from '@/lib/auth';

type StudentRow = {
  siswa_id: number;
  nama: string;
  kelas_id: number;
  status: AbsensiPayload['status'] | '';
};

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { fetchAbsensi, submitAbsensiBatch } = useAbsensi();
  const { fetchSiswa } = useSiswa();
  const { fetchKelas, initDefaultKelas } = useKelas();
  const [kelasId, setKelasId] = useState('');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [kelasOptions, setKelasOptions] = useState<KelasItem[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useWithAuth(['guru']);

  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
  }, [isLoggedIn, router]);

  const kelasName = useMemo(() => {
    const current = kelasOptions.find((item) => String(item.id) === kelasId);
    return current ? current.nama_kelas : '-';
  }, [kelasId, kelasOptions]);

  const loadKelas = async () => {
  let data: KelasItem[] = [];

  try {
    data = await initDefaultKelas();
  } catch {
    // silent
  }

  if (!Array.isArray(data) || data.length === 0) {
    data = await fetchKelas();
  }

  // Deduplicate by nama_kelas (case-insensitive)
  const seen = new Set<string>();
  const uniqueKelas = data.filter((kelas) => {
    const key = kelas.nama_kelas.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  setKelasOptions(uniqueKelas);
  if (uniqueKelas.length > 0) {
    setKelasId(String(uniqueKelas[0].id));
  }
  return uniqueKelas;
};

  const loadStudents = async (selectedKelasId: string, currentTanggal: string) => {
    const siswaList = await fetchSiswa(Number(selectedKelasId));
    const absensiList = await fetchAbsensi(Number(selectedKelasId), currentTanggal).catch(
      () => [] as Array<{ siswa_id: number; status: StudentRow['status'] }>,
    );

    const absensiMap = new Map<number, StudentRow['status']>();
    absensiList.forEach((item: { siswa_id: number; status: StudentRow['status'] }) => {
      absensiMap.set(item.siswa_id, item.status);
    });

    setRows(
      siswaList.map((siswa: SiswaItem) => ({
        siswa_id: siswa.id,
        nama: siswa.nama,
        kelas_id: siswa.kelas_id,
        status: absensiMap.get(siswa.id) || '',
      })),
    );
    setCurrentPage(1);
  };

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      setLoading(true);
      setError('');
      try {
        const kelasData = await loadKelas();
        const defaultKelasId = kelasData[0] ? String(kelasData[0].id) : '';
        if (active && defaultKelasId) {
          await loadStudents(defaultKelasId, tanggal);
        }
      } catch (error) {
        if (active) {
          const err = error as AxiosError<{ message?: string }>;
          if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
          setError(err.response?.data?.message || 'Gagal memuat data dashboard.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void bootstrap();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!kelasId) return;
      setLoading(true);
      setError('');
      try {
        await loadStudents(kelasId, tanggal);
      } catch (error) {
        if (active) {
          const err = error as AxiosError<{ message?: string }>;
          if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
          setError(err.response?.data?.message || 'Gagal memuat siswa.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    return () => { active = false; };
  }, [kelasId, tanggal]);

  const updateStatus = (siswa_id: number, status: StudentRow['status']) => {
    setRows((prev) => prev.map((item) => (item.siswa_id === siswa_id ? { ...item, status } : item)));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    const missing = rows.filter((row) => !row.status);
    if (missing.length > 0) {
      setError(`Absensi belum lengkap. ${missing.length} siswa masih kosong.`);
      return;
    }
    setLoading(true);
    try {
      const storedGuru = getCookie('guru');
      const guruId = storedGuru ? Number(JSON.parse(storedGuru).id) : 1;
      await submitAbsensiBatch({
        kelas_id: Number(kelasId),
        guru_id: guruId,
        tanggal,
        items: rows.map((row) => ({
          siswa_id: row.siswa_id,
          status: row.status as AbsensiPayload['status'],
        })),
      });
      setSuccess('Absensi berhasil dikirim.');
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
      setError(err.response?.data?.message || 'Gagal mengirim absensi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Logic pemotongan data untuk pagination
  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return rows.slice(startIndex, startIndex + itemsPerPage);
  }, [rows, currentPage]);

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'hadir': return 'text-emerald-600 border-emerald-200 bg-emerald-50/50';
      case 'sakit': return 'text-blue-600 border-blue-200 bg-blue-50/50';
      case 'izin': return 'text-amber-600 border-amber-200 bg-amber-50/50';
      case 'alpha': return 'text-red-600 border-red-200 bg-red-50/50';
      default: return 'text-slate-700 border-slate-200 bg-white';
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] md:flex">
      <div className="hidden md:block">
        <GuruSidebar />
      </div>

      <div className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 flex flex-col">
        {/* TOP HEADER SECTION */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              <span>Workspace</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Kelas {kelasName}</span>
            </div>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
              Panel Absensi Harian
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white/80 p-2 text-sm text-slate-600 shadow-sm backdrop-blur-md">
            <span className="rounded-xl bg-slate-100 px-3 py-1 font-semibold">{tanggal}</span>
            <span className="pr-2 font-medium">{rows.length} Total Siswa</span>
          </div>
        </div>

        {/* NOTIFICATION TOASTS */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shrink-0">
            {success}
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-stretch flex-1 min-h-125">
          
          {/* LEFT COLUMN: Lembar Input */}
          <section className="flex flex-col rounded-4xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100/40 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5 shrink-0">
              <h3 className="font-semibold text-slate-900">Lembar Input Kehadiran</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tentukan status kehadiran individu siswa di bawah ini.</p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 bg-slate-50/70">Informasi Siswa</th>
                    <th className="px-6 py-4 w-48 text-right bg-slate-50/70">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-sm text-slate-400" colSpan={2}>
                        {loading ? 'Sedang menyinkronkan data siswa...' : 'Tidak ada data siswa ditemukan di kelas ini.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.siswa_id} className="group transition hover:bg-slate-50/50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-sm text-blue-600">
                              {row.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 transition group-hover:text-blue-600">{row.nama}</p>
                              <p className="text-[11px] text-slate-400">System ID: #{row.siswa_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <select
                            value={row.status}
                            onChange={(e) => updateStatus(row.siswa_id, e.target.value as StudentRow['status'])}
                            className={`w-full max-w-40 inline-block rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition focus:ring-4 focus:ring-blue-500/10 ${getStatusColorClass(row.status)}`}
                          >
                            <option value="">Pilih status</option>
                            <option value="hadir" className="text-emerald-600 font-semibold">Hadir</option>
                            <option value="sakit" className="text-blue-600 font-semibold">Sakit</option>
                            <option value="izin" className="text-amber-600 font-semibold">Izin</option>
                            <option value="alpha" className="text-red-600 font-semibold">Alpha</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {rows.length > itemsPerPage && (
              <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 bg-slate-50/50">
                <p className="text-xs text-slate-400">
                  Menampilkan <span className="font-medium text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span>-{Math.min(currentPage * itemsPerPage, rows.length)} dari <span className="font-medium text-slate-700">{rows.length}</span> siswa
                </p>
                <nav className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </nav>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Konfigurasi Data */}
          <aside className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100/40 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm tracking-tight">Konfigurasi Data</h3>
                <p className="text-xs text-slate-400 mt-0.5">Atur filter kelas dan tanggal pemrosesan.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400 uppercase tracking-wider">Target Kelas</label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {!kelasOptions.length && <option value="">Memuat opsi kelas...</option>}
                    {kelasOptions.map((kelas: KelasItem) => (
                      <option key={kelas.id} value={kelas.id}>
                        Kelas {kelas.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400 uppercase tracking-wider">Tanggal Absen</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="pt-6 border-t border-slate-100 mt-6 lg:mt-0">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/10 transition hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sinkronisasi...
                  </span>
                ) : 'Kirim Berkas Absensi'}
              </button>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
