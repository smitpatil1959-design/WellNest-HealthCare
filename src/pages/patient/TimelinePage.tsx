import { useState, useMemo } from 'react';
import {
  Building2,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  Activity,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { AuthenticatedApiState } from '../../components/patient/AuthenticatedApiState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

interface TimelineEvent {
  id: string;
  kind: string;
  title: string;
  date: string | null;
  organization: string;
  detail: string;
}

const emptyEvents: TimelineEvent[] = [];

export default function TimelinePage() {
  const [filterKind, setFilterKind] = useState<string>('all');
  const query = useAuthenticatedApi<TimelineEvent[]>('/api/timeline');
  const events = query.data ?? emptyEvents;

  const filteredEvents = useMemo(() => {
    if (filterKind === 'all') return events;
    return events.filter((e) => {
      const k = (e.kind || '').toLowerCase();
      const t = (e.title || '').toLowerCase();
      if (filterKind === 'lab') return k.includes('lab') || t.includes('lab') || t.includes('test');
      if (filterKind === 'rx') return k.includes('rx') || t.includes('prescription') || t.includes('medication');
      if (filterKind === 'visit') return k.includes('visit') || t.includes('appointment') || t.includes('consult');
      return true;
    });
  }, [events, filterKind]);

  // Group by year
  const groupedByYear = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const event of filteredEvents) {
      const year = event.date ? new Date(event.date).getFullYear().toString() : 'Recent';
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    }
    return groups;
  }, [filteredEvents]);

  return (
    <>
      <Seo title="Health Timeline" description="Chronological view of your entire lifetime health history." />
      <PatientPageHeader
        eyebrow="Longitudinal Health Record"
        title="Health timeline"
        description="A unified chronology automatically assembled from your saved medical records, laboratory tests, hospital admissions, and doctor appointments."
      />

      {/* Metrics Stat Row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Timeline Events</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{events.length}</p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-brand-700">Healthcare Facilities</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-900">
            {new Set(events.map((event) => event.organization).filter(Boolean)).size}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-ink-500">Filtered Events</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">{filteredEvents.length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Events' },
          { id: 'lab', label: 'Lab & Diagnostics' },
          { id: 'rx', label: 'Prescriptions' },
          { id: 'visit', label: 'Visits & Consults' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterKind(tab.id)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
              filterKind === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-ink-600 border border-slate-200/80 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AuthenticatedApiState loading={query.isLoading} error={query.error} retry={() => { void query.refetch(); }}>
        {events.length === 0 ? (
          <EmptyState
            title="No timeline events recorded"
            description="Records, admissions, and clinical care events will automatically populate this timeline as care is received."
            icon={Activity}
          />
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a)).map((year) => (
              <div key={year} className="relative">
                <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 bg-surface-soft/90 py-1.5 backdrop-blur-xs">
                  <span className="rounded-md bg-teal-100 px-3 py-1 font-display text-sm font-bold text-teal-900 border border-teal-200">
                    {year}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                  {groupedByYear[year].map((event) => {
                    const isLab = event.kind === 'lab' || event.title.toLowerCase().includes('lab') || event.title.toLowerCase().includes('test');
                    const isRx = event.kind === 'rx' || event.title.toLowerCase().includes('prescription');
                    const isVisit = event.kind === 'visit' || event.title.toLowerCase().includes('appointment');

                    return (
                      <div key={event.id} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[33px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white ${
                            isLab
                              ? 'border-sky-500 text-sky-600'
                              : isRx
                                ? 'border-emerald-500 text-emerald-600'
                                : isVisit
                                  ? 'border-purple-500 text-purple-600'
                                  : 'border-brand-600 text-brand-600'
                          }`}
                        >
                          {isLab ? (
                            <FlaskConical className="h-3 w-3" />
                          ) : isRx ? (
                            <Pill className="h-3 w-3" />
                          ) : isVisit ? (
                            <Stethoscope className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                        </div>

                        {/* Content Card */}
                        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-brand-200 hover:shadow-xs">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors">
                                {event.title}
                              </h3>
                              {event.organization ? (
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500 font-medium">
                                  <Building2 className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                                  <span>{event.organization}</span>
                                </p>
                              ) : null}
                            </div>
                            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                              {formatDate(event.date ?? '')}
                            </span>
                          </div>

                          {event.detail ? (
                            <p className="mt-2.5 text-xs text-ink-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed">
                              {event.detail}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </AuthenticatedApiState>
    </>
  );
}
