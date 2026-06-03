'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { href: '/siswa', label: 'Tambah Siswa' },
  { href: '/dashboard', label: 'Absen Siswa' },
];

export default function GuruSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-80 shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#172036_0%,#1b2640_52%,#111827_100%)] text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 font-semibold">Guru Console</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">Absensi Sekolah</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Tambah data, isi absensi harian, lalu pantau riwayat dengan rapi.
        </p>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-slate-950 shadow-lg shadow-blue-500/10 font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bagian Bawah: Menggabungkan Tombol Theme Toggle dan Logout */}
      <div className="flex items-center gap-3 border-t border-white/10 p-4">
        <button
          onClick={logout}
          className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-md shadow-blue-600/10"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
