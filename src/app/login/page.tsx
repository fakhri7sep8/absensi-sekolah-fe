"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await login(email, password);
      router.push(response?.guru?.role === "kepsek" ? "/kepsek" : "/dashboard");
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setError(
        err.response?.data?.message || "Login gagal. Cek email dan password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="relative grid w-full overflow-hidden rounded-4xl border border-slate-200/80 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.12)] md:grid-cols-[1.05fr_0.95fr]">
          {/* Section Kiri - Info */}
          <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#172036_0%,#1b2640_52%,#111827_100%)] p-10 text-white md:flex md:min-h-190 md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_30%)]" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold shadow-lg shadow-black/10">
                  SA
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-blue-200">
                    Absensi Sekolah
                  </p>
                </div>
              </div>
            </div>

            <div className="relative max-w-md">
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-blue-200/90">
                Sistem Absensi
              </p>
              <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight text-white">
                Kelola absensi kelas dengan mudah
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">
                Data tercatat rapi, rekap bulanan siap kapan saja dibutuhkan,
                dan akses guru serta kepala sekolah tetap terpisah.
              </p>
            </div>

            <div className="relative space-y-3">
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                Catat kehadiran siswa
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                Rekap otomatis per bulan
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                Akses guru & kepala sekolah
              </div>
            </div>
          </section>

          {/* Section Kanan - Form Login */}
          <section className="relative bg-white px-6 py-8 text-slate-900 md:px-10 md:py-10">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Sistem Absensi
                </p>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
                  Masuk ke akun Anda
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Gunakan email sekolah dan password yang telah diberikan admin.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    @
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="nama@sekolah.sch.id"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M6 10V8a6 6 0 0 1 12 0v2" />
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-16 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 my-2 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    title={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.5 10.6a2.5 2.5 0 0 0 3.4 3.4" />
                        <path d="M7.4 7.7A10.8 10.8 0 0 0 2.5 12s3 6.5 9.5 6.5c1.2 0 2.3-.2 3.4-.6" />
                        <path d="M14.8 4.9A10.8 10.8 0 0 1 21.5 12s-1.1 2.4-3.4 4.5" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Lupa password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-400">atau</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-500">
              Butuh bantuan? Hubungi admin sekolah.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
