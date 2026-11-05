import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FlaskConical,
  Pill,
  Calendar,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { Seo } from '../seo/Seo';
import { PatientPageHeader } from '../patient/PatientPageHeader';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useAuth } from '../../providers/AuthProvider';
import { safeApiFetch } from '../../utils/apiFetch';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  href: string;
}

export function NotificationFeed({ title, description }: { title: string; description: string }) {
  const { session } = useAuth();
  const query = useAuthenticatedApi<AppNotification[]>('/api/app-notifications');
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');

  const notifications = query.data ?? [];

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;

  const filtered = useMemo(() => {
    if (filterMode === 'unread') return notifications.filter((n) => !n.read);
    if (filterMode === 'read') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filterMode]);

  const setRead = async (notification: AppNotification, read: boolean) => {
    if (!session?.access_token) {
      setActionError('Your session is not ready. Sign in again.');
      return;
    }
    setActionError('');
    setSavingId(notification.id);
    const result = await safeApiFetch('/api/app-notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notification.id, read }),
    });
    setSavingId('');
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    await query.refetch();
  };

  const getIcon = (kind: string) => {
    const k = kind.toLowerCase();
    if (k.includes('lab') || k.includes('report')) return FlaskConical;
    if (k.includes('rx') || k.includes('prescription') || k.includes('med')) return Pill;
    if (k.includes('access') || k.includes('consent') || k.includes('security')) return ShieldCheck;
    if (k.includes('appointment') || k.includes('visit')) return Calendar;
    return Bell;
  };

  return (
    <>
      <Seo title={title} description={description} />
      <PatientPageHeader
        eyebrow="Notifications & Action Center"
        title={title}
        description={description}
      />

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Total Alerts</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Unread Notices</span>
            {unreadCount > 0 && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-amber-900">{unreadCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Archived / Read</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{readCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800">Delivery Status</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-emerald-900">Real-Time</p>
        </div>
      </div>

      {actionError ? (
        <Alert tone="error" title="Read state was not saved" className="mb-4">
          {actionError}
        </Alert>
      ) : null}

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Alerts (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'read', label: `Read Archive (${readCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterMode(tab.id as typeof filterMode)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
              filterMode === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : null}

      {query.isError ? (
        <Alert tone="error" title="Notifications unavailable">
          {query.error?.message || 'Check your connection and retry.'}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => void query.refetch()}
          >
            Retry
          </button>
        </Alert>
      ) : null}

      {!query.isLoading && !query.isError && filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications in this view"
          description={
            filterMode === 'unread'
              ? 'You are all caught up! No unread notifications.'
              : 'New access decisions, laboratory releases, and care updates will appear here automatically.'
          }
        />
      ) : null}

      {!query.isError && filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const IconComp = getIcon(item.kind);

            return (
              <li key={item.id}>
                <Card
                  className={cn(
                    'transition-all hover:border-brand-300 hover:shadow-xs',
                    item.read
                      ? 'border-slate-200/80 bg-white'
                      : 'border-brand-200 bg-gradient-to-r from-teal-50/20 via-white to-white'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      to={item.href}
                      onClick={() => {
                        if (!item.read) void setRead(item, true);
                      }}
                      className="flex min-w-0 flex-1 gap-3.5 group"
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border mt-0.5',
                          item.read
                            ? 'border-slate-200 bg-slate-50 text-slate-500'
                            : 'border-teal-200 bg-teal-50 text-brand-700'
                        )}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                            {item.kind.replaceAll('_', ' ')}
                          </p>
                          {!item.read && (
                            <span className="flex h-2 w-2 rounded-full bg-brand-600" aria-label="Unread indicator" />
                          )}
                        </div>
                        <h2 className="mt-0.5 font-bold text-ink-900 group-hover:text-brand-700 transition-colors text-sm sm:text-base">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-xs text-ink-600 leading-relaxed">{item.body}</p>
                        <time className="mt-2 block text-[11px] font-mono text-ink-400">
                          {formatDate(item.created_at)}
                        </time>
                      </div>
                    </Link>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={savingId === item.id}
                      onClick={() => void setRead(item, !item.read)}
                      className="shrink-0 text-xs"
                    >
                      {item.read ? 'Mark unread' : 'Mark read'}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
