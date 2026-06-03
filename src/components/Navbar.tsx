'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Notification from './Notification';
import { getCookie } from '@/lib/cookies';

export default function Navbar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const role = typeof window !== 'undefined' ? getCookie('role') : null;
  const isKepsek = role === 'kepsek' || pathname?.startsWith('/kepsek');

  const menu = isKepsek
    ? [{ href: '/kepsek', label: 'Dashboard Rekap' }]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/siswa', label: 'Siswa' },
        { href: '/kelas', label: 'Kelas' },
        { href: '/riwayat', label: 'Riwayat' },
      ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#111827,#374151)] text-sm font-bold text-white shadow-lg shadow-slate-900/20">
            SA
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-700">School Attendance OS</p>
            <h1 className="text-sm font-semibold text-slate-900 md:text-base">
              Sistem Otomasi Rekap Absensi Sekolah
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <nav className="flex flex-wrap items-center gap-2">
            {menu.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'border border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {!isKepsek && <Notification />}
            <button
              onClick={logout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
