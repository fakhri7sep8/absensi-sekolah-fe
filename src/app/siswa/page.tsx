"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import * as Yup from "yup";
import Navbar from "@/components/Navbar";
import GuruSidebar from "@/components/GuruSidebar";
import { useWithAuth } from "@/hooks/withAuth";
import { useSiswa, type SiswaItem } from "@/hooks/useSiswa";
import { useKelas } from "@/hooks/useKelas";
import { shouldIgnoreUnauthorized } from "@/lib/auth";

type KelasOption = {
  id: number;
  nama_kelas: string;
  tingkat: number;
};

type SiswaRow = {
  id: number;
  nama: string;
  nis: string;
  kelas_id: number;
  kelas: {
    nama_kelas: string;
    tingkat: number;
  };
};

const siswaSchema = Yup.object({
  nama: Yup.string()
    .trim()
    .min(3, "Nama siswa minimal 3 karakter")
    .required("Nama siswa wajib diisi"),
  nis: Yup.string()
    .trim()
    .matches(/^\d+$/, "NIS harus berupa angka")
    .length(8, "NIS wajib 8 digit")
    .required("NIS wajib diisi"),
  kelas_id: Yup.number()
    .typeError("Kelas wajib dipilih")
    .integer()
    .positive()
    .required("Kelas wajib dipilih"),
});

function mapSiswa(item: SiswaItem): SiswaRow {
  return {
    id: item.id,
    nama: item.nama,
    nis: item.nis,
    kelas_id: item.kelas_id,
    kelas: item.kelas ?? { nama_kelas: "-", tingkat: 0 },
  };
}

export default function SiswaPage() {
  useWithAuth(["guru"]);

  const { fetchSiswa, createSiswa, updateSiswa, deleteSiswa } = useSiswa();
  const { fetchKelas, initDefaultKelas } = useKelas();
  const [items, setItems] = useState<SiswaRow[]>([]);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    nama?: string;
    nis?: string;
    kelas_id?: string;
  }>({});
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [nis, setNis] = useState("");
  const [kelasId, setKelasId] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [siswaRes] = await Promise.all([
          fetchSiswa(),
        ]);
        if (!active) return;
        setItems(siswaRes.map(mapSiswa));
        // Selalu panggil initDefaultKelas untuk membersihkan duplikat & seed jika perlu
        const kelasList = await initDefaultKelas().catch(async () => {
          return await fetchKelas();
        });
        setKelasOptions(kelasList);
        if (kelasList.length > 0) {
          setKelasId((current) => current || String(kelasList[0].id));
        }
      } catch (error) {
        if (!active) return;
        const err = error as AxiosError<{ message?: string }>;
        if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
        setError(err.response?.data?.message || "Gagal memuat data siswa.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, [fetchSiswa]);

  const openCreate = () => {
    setEditingId(null);
    setNama("");
    setNis("");
    setFieldErrors({});
    setOpen(true);
  };

  const openEdit = (item: SiswaRow) => {
    setEditingId(item.id);
    setNama(item.nama);
    setNis(item.nis);
    setFieldErrors({});
    setKelasId(String(item.kelas_id));
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Yakin hapus siswa ini? Data absensi terkait tetap ada.",
    );
    if (!confirmDelete) return;

    setError("");
    try {
      await deleteSiswa(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
      setError(err.response?.data?.message || "Gagal menghapus siswa.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const payload = await siswaSchema.validate(
        {
          nama,
          nis,
          kelas_id: Number(kelasId),
        },
        { abortEarly: false, stripUnknown: true },
      );

      const saved = editingId
        ? await updateSiswa(editingId, payload)
        : await createSiswa(payload);

      const normalized = mapSiswa(saved);
      setItems((prev) => {
        if (editingId) {
          return prev.map((item) =>
            item.id === editingId ? normalized : item,
          );
        }
        return [normalized, ...prev];
      });
      setNama("");
      setNis("");
      setEditingId(null);
      setOpen(false);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const nextErrors: { nama?: string; nis?: string; kelas_id?: string } =
          {};
        error.inner.forEach((item) => {
          if (item.path && !nextErrors[item.path as keyof typeof nextErrors]) {
            nextErrors[item.path as keyof typeof nextErrors] = item.message;
          }
        });
        setFieldErrors(nextErrors);
      } else {
        const err = error as AxiosError<{ message?: string }>;
        if (err.response?.status === 401 && shouldIgnoreUnauthorized()) return;
        setError(err.response?.data?.message || "Gagal menyimpan siswa.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] md:flex">
      <div className="hidden md:block">
        <GuruSidebar />
      </div>

      <div className="min-w-0 flex-1">
        <div className="md:hidden">
          <Navbar />
        </div>

        <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
                  Master Data
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  Manajemen Siswa
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Siswa ditambahkan oleh guru, bukan mendaftar sendiri. NIS
                  wajib 8 digit.
                </p>
              </div>
              <div className="flex items-center gap-4 self-end md:self-auto">
                <button
                  onClick={openCreate}
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md"
                >
                  Tambah Siswa
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-sm text-slate-500">
                    <th className="px-5 py-4 font-medium">Nama</th>
                    <th className="px-5 py-4 font-medium">NIS</th>
                    <th className="px-5 py-4 font-medium">Kelas</th>
                    <th className="px-5 py-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        className="px-5 py-4 text-sm text-slate-500"
                        colSpan={4}
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        className="px-5 py-4 text-sm text-slate-500"
                        colSpan={4}
                      >
                        Belum ada data siswa.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                        }
                      >
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {item.nama}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {item.nis}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {item.kelas?.nama_kelas} - {item.kelas?.tingkat}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                              aria-label="Edit siswa"
                              title="Edit siswa"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path d="M4 20h4l10-10a2.5 2.5 0 0 0-4-4L4 16v4Z" />
                                <path d="M13.5 6.5l4 4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                              aria-label="Hapus siswa"
                              title="Hapus siswa"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M6 6l1 14h10l1-14" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-4xl border border-slate-200/80 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Edit Siswa" : "Tambah Siswa"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Nama
                </span>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Nama siswa"
                />
                {fieldErrors.nama && (
                  <p className="mt-2 text-xs text-red-600">
                    {fieldErrors.nama}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  NIS
                </span>
                <input
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="8 digit angka"
                />
                {fieldErrors.nis ? (
                  <p className="mt-2 text-xs text-red-600">
                    {fieldErrors.nis}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    NIS wajib angka semua dan tepat 8 digit.
                  </p>
                )}
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Kelas
                </span>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Pilih kelas
                  </option>
                  {kelasOptions.map((kelas) => (
                    <option
                      key={kelas.id}
                      value={kelas.id}
                    >
                      {kelas.nama_kelas} - {kelas.tingkat}
                    </option>
                  ))}
                </select>
                {fieldErrors.kelas_id && (
                  <p className="mt-2 text-xs text-red-600">
                    {fieldErrors.kelas_id}
                  </p>
                )}
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
