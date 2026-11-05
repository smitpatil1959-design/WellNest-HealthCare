import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export function AppointmentCalendar({ month = new Date(), appointments = [] }: {
  month?: Date;
  appointments?: readonly { date: string; status?: string }[];
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(month.getFullYear(), month.getMonth(), 1));
  const year = visibleMonth.getFullYear();
  const mo = visibleMonth.getMonth();
  const first = new Date(year, mo, 1).getDay();
  const days = new Date(year, mo + 1, 0).getDate();
  const cells = Array.from({ length: first + days }, (_, index) => index < first ? null : index - first + 1);
  const marks = new Map(appointments.map(item => [item.date.slice(0, 10), item.status]));
  const monthLabel = visibleMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <section aria-label="Appointment calendar" className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 aria-live="polite" className="text-xs font-semibold text-ink-900">{monthLabel}</h2>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(new Date(year, mo - 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-line text-ink-500 hover:bg-brand-50"><ChevronLeft size={14} /></button>
          <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(year, mo + 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-line text-ink-500 hover:bg-brand-50"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-ink-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <abbr key={day} title={day} className="no-underline">{day.slice(0, 1)}</abbr>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const dateKey = `${year}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = marks.get(dateKey);
          const today = new Date();
          const isToday = year === today.getFullYear() && mo === today.getMonth() && day === today.getDate();
          return <span key={day} aria-current={isToday ? 'date' : undefined} title={status ? `${dateKey}: ${status}` : dateKey} className={cn('flex h-8 items-center justify-center rounded-lg text-xs', isToday && 'ring-1 ring-brand-300', status === 'upcoming' || status === 'waiting' ? 'bg-brand-700 font-semibold text-white' : status === 'completed' ? 'bg-emerald-50 text-emerald-700' : status === 'canceled' ? 'bg-rose-50 text-rose-600 line-through' : 'text-ink-600')}>{day}</span>;
        })}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[9px] leading-5 text-ink-400">Highlighted dates have scheduled visits.</p>
    </section>
  );
}
