'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useLaporan } from '@/hooks/useLaporan';
import { useWithAuth } from '@/hooks/withAuth';
import { useKelas } from '@/hooks/useKelas';
import { shouldIgnoreUnauthorized } from '@/lib/auth';

type LaporanRow = {
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
};

type KelasOption = {
  id: number;
  nama_kelas: string;
  tingkat: number;
};

const daftarBulan = [
  { value: '1', name: 'Januari' },
  { value: '2', name: 'Februari' },
  { value: '3', name: 'Maret' },
  { value: '4', name: 'April' },
  { value: '5', name: 'Mei' },
  { value: '6', name: 'Juni' },
  { value: '7', name: 'Juli' },
  { value: '8', name: 'Agustus' },
  { value: '9', name: 'September' },
  { value: '10', name: 'Oktober' },
  { value: '11', name: 'November' },
  { value: '12', name: 'Desember' },
];

export default function KepsekPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { fetchLaporan, exportPDF } = useLaporan();
  const { fetchKelas, initDefaultKelas } = useKelas();
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [kelasId, setKelasId] = useState('');
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [data, setData] = useState<LaporanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useWithAuth(['kepsek']);

  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
  }, [isLoggedIn, router]);

  const kelasLabel = useMemo(() => {
    const current = kelasOptions.find((item) => String(item.id) === kelasId);
    return current ? current.nama_kelas : '-';
  }, [kelasId, kelasOptions]);

  const bulanLabel = useMemo(() => {
    const current = daftarBulan.find((b) => b.value === bulan);
    return current ? current.name : '';
  }, [bulan]);

  useEffect(() => {
    let active = true;
    const loadKelas = async () => {
      try {
        // Selalu panggil initDefaultKelas untuk membersihkan duplikat & seed jika perlu
        let data = await initDefaultKelas().catch(async () => {
          if (!active) return [];
          return await fetchKelas();
        });
        if (!active) return;
        setKelasOptions(data);
        if (data.length > 0) {
          setKelasId((current) => current || String(data[0].id));
        }
      } catch (error) {
        if (active) {
          const err = error as AxiosError<{ message?: string }>;
          if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
          setError(err.response?.data?.message || 'Gagal memuat data kelas.');
        }
      }
    };
    void loadKelas();
    return () => {
      active = false;
    };
  }, [fetchKelas]);

  useEffect(() => {
    if (!kelasId) return;
    let active = true;
    const loadData = async () => {
      setError('');
      setLoading(true);
      try {
        const result = await fetchLaporan(Number(bulan), Number(tahun), Number(kelasId));
        if (active) {
          setData(result);
          setCurrentPage(1);
        }
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        if (active) {
          if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
          setError(err.response?.data?.message || 'Gagal memuat laporan.');
          setData([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, [bulan, tahun, kelasId, fetchLaporan]);

  const handleExport = async () => {
    try {
      await exportPDF(Number(bulan), Number(tahun), Number(kelasId));
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
      setError(err.response?.data?.message || 'Gagal mengunduh PDF.');
    }
  };

  // Kalkulasi data terpaginasi
  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              <span>Executive Analytics</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Kelas {kelasLabel}</span>
            </div>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
              Rekap Absensi Bulanan
            </h1>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16v1a2 2 0 002 2h14a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Unduh Laporan PDF
          </button>
        </div>

        {/* NOTIFICATION ERROR */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0">
            {error}
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div className="grid gap-6 xl:grid-cols-[320px_1fr] items-stretch">
          
          {/* LEFT SIDEBAR: Filter Form */}
          <aside className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100/40 flex flex-col gap-5 h-full">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm tracking-tight">Filter Laporan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sesuaikan periode waktu dan kelas.</p>
            </div>

            <div className="flex-1 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400 uppercase tracking-wider">Bulan</span>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {daftarBulan.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400 uppercase tracking-wider">Tahun</span>
                <input
                  type="number"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-400 uppercase tracking-wider">Kelas</span>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {!kelasOptions.length && <option value="">Tidak ada data kelas</option>}
                  {kelasOptions.map((kelas) => (
                    <option key={kelas.id} value={kelas.id}>
                      Kelas {kelas.nama_kelas}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Status Target</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {bulanLabel} {tahun}
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT PANELS */}
          <div className="flex flex-col gap-6">
            
            {/* PANEL 1: Charts section */}
            <section className="rounded-4xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100/40 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="font-semibold text-slate-900 text-sm">Grafik Distribusi Kehadiran</h3>
                <p className="text-xs text-slate-400 mt-0.5">Komparasi persebaran status absen siswa.</p>
              </div>
              <div className="h-80 w-full min-w-0 p-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} aspect={2}>
                  <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="nama" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
                      }} 
                    />
                    <Bar dataKey="hadir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} name="Hadir" />
                    <Bar dataKey="sakit" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} name="Sakit" />
                    <Bar dataKey="izin" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} name="Izin" />
                    <Bar dataKey="alpha" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} name="Alpha" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* PANEL 2: Paginated Table summary */}
            <section className="flex flex-col rounded-4xl border border-slate-200/80 bg-white shadow-xl shadow-slate-100/40 overflow-hidden flex-1">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="font-semibold text-slate-900 text-sm">Lembar Tabel Rekapitulasi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rincian kuantitas kehadiran kumulatif seluruh siswa.</p>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">Nama Siswa</th>
                      <th className="px-6 py-3.5 text-center">Hadir</th>
                      <th className="px-6 py-3.5 text-center">Sakit</th>
                      <th className="px-6 py-3.5 text-center">Izin</th>
                      <th className="px-6 py-3.5 text-center">Alpha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td className="px-6 py-10 text-center text-slate-400" colSpan={5}>
                          Sinkronisasi rekap data laporan...
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td className="px-6 py-10 text-center text-slate-400" colSpan={5}>
                          Belum ada berkas rekapitulasi untuk periode terpilih.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row, index) => (
                        <tr key={row.nama} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                          <td className="px-6 py-3.5 font-medium text-slate-900">{row.nama}</td>
                          <td className="px-6 py-3.5 text-center text-emerald-600 font-semibold">{row.hadir}</td>
                          <td className="px-6 py-3.5 text-center text-blue-600 font-semibold">{row.sakit}</td>
                          <td className="px-6 py-3.5 text-center text-amber-600 font-semibold">{row.izin}</td>
                          <td className="px-6 py-3.5 text-center text-red-600 font-semibold">{row.alpha}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              {data.length > itemsPerPage && (
                <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                  <p className="text-xs text-slate-400">
                    Menampilkan <span className="font-medium text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span>-{Math.min(currentPage * itemsPerPage, data.length)} dari <span className="font-medium text-slate-700">{data.length}</span> rekap siswa
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
          </div>

        </div>
      </div>
    </main>
  );
}
