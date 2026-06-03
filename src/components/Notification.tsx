'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotifikasi, type NotifikasiItem } from '@/hooks/useNotifikasi';

export default function Notification() {
  const { fetchNotifikasi, markAsRead } = useNotifikasi();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setItems(await fetchNotifikasi());
      } catch {
        setItems([]);
      }
    };
    void load();
  }, [fetchNotifikasi]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = items.filter((item) => !item.is_read).length;

  const handleRead = async (id: number) => {
    const updated = await markAsRead(id);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label="Notifikasi"
      >
        <span className="text-lg" aria-hidden="true">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex min-h-5 min-w-5 -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifikasi</p>
            <p className="text-xs text-slate-500">Klik item untuk menandai sudah dibaca</p>
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">Tidak ada notifikasi baru.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRead(item.id)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    item.is_read ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-sm text-slate-800">{item.pesan}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString('id-ID')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
