'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'reset'>('request');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      if (result.debug_code) {
        setDebugCode(result.debug_code);
        setStep('reset');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || 'Gagal membuat kode reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await resetPassword(email, code, newPassword);
      setMessage(result.message);
      setCode('');
      setNewPassword('');
      setStep('request');
      setDebugCode('');
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center justify-center">
        <div className="w-full rounded-4xl border border-slate-200/80 bg-white p-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 md:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                Lupa Password
              </p>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Reset password akun Anda
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Masukkan email sekolah, ambil kode reset, lalu set password baru.
              </p>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleRequest} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Minta kode reset</h2>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950/50"
                  placeholder="nama@sekolah.sch.id"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#111827,#334155)] px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[linear-gradient(135deg,#f59e0b,#d97706)]"
              >
                {loading ? 'Mengirim...' : 'Kirim Kode'}
              </button>
              {debugCode && (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  Kode reset: <span className="font-semibold">{debugCode}</span>
                </div>
              )}
            </form>

            <form onSubmit={handleReset} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">2. Set password baru</h2>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Kode reset</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950/50"
                  placeholder="Masukkan kode"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Password baru</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950/50"
                  placeholder="Minimal 6 karakter"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-950"
              >
                {loading ? 'Menyimpan...' : 'Ubah Password'}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jika kode sudah tidak berlaku, minta kode baru dari langkah pertama.
              </p>
            </form>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
