import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { paths } from '../../routes/paths';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { safeApiFetch } from '../../utils/apiFetch';
import { formatDate } from '../../utils/format';

interface Notice { id: string; title: string; body: string; created_at: string; read: boolean; href: string }

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { role, session } = useAuth();
  const query = useAuthenticatedApi<Notice[]>('/api/app-notifications', Boolean(role));
  const items = (query.data ?? []).slice(0, 4);
  const unread = items.some((item) => !item.read);
  const notificationsPath = role === 'patient' ? paths.app.patientNotifications
    : role === 'doctor' ? paths.app.doctorNotifications
      : role === 'hospital' ? paths.app.hospitalNotifications
        : role === 'laboratory' ? paths.app.labNotifications
          : role === 'pharmacy' ? paths.app.pharmacyNotifications
            : role === 'insurance' ? paths.app.insuranceNotifications
              : role === 'administrator' ? paths.app.adminNotifications : null;

  const markRead = (notice: Notice) => {
    if (notice.read || !session?.access_token) return;
    void safeApiFetch('/api/app-notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notice.id, read: true }),
    }).then((result) => { if (result.ok) void query.refetch(); });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" aria-label="Unread notifications" /> : null}
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,340px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Notifications</p>
              {notificationsPath ? (
                <Link to={notificationsPath} className="text-xs font-semibold text-brand-700 hover:text-brand-800" onClick={() => setOpen(false)}>
                  See all
                </Link>
              ) : null}
            </div>
            {query.isLoading ? (
              <p className="px-3 py-4 text-xs text-ink-500">Loading notifications…</p>
            ) : query.isError ? (
              <p className="px-3 py-4 text-xs text-rose-700">{query.error instanceof Error ? query.error.message : 'Notifications unavailable.'}</p>
            ) : items.length ? (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={() => { markRead(item); setOpen(false); }}
                    className="flex gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-slate-300' : 'bg-brand-600'}`} />
                    <span className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{item.body}</p>
                      <p className="mt-1 text-[10px] text-ink-400">{formatDate(item.created_at)}</p>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="px-3 py-5 text-center text-xs text-ink-400">No notifications yet.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
