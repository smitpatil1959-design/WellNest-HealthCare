import { Calendar, Clock, MapPin } from 'lucide-react';
import type { Appointment } from '../../types/patient';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/format';

const tone = {
  upcoming: 'brand',
  completed: 'emerald',
  canceled: 'rose',
} as const;

export function AppointmentCard({ item }: { item: Appointment }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5 transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={item.doctor} src={item.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink-900">{item.title}</h3>
            <Badge tone={tone[item.status]} className="capitalize">
              {item.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {item.doctor} · {item.specialty}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-ink-600 sm:grid-cols-3">
        <div className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 text-ink-400" /> {formatDate(item.date)}
        </div>
        <div className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-ink-400" /> {item.time}
        </div>
        <div className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4 text-ink-400" /> {item.hospital}
        </div>
      </dl>
      <p className="mt-3 text-sm leading-6 text-ink-500">{item.reason}</p>
    </article>
  );
}
