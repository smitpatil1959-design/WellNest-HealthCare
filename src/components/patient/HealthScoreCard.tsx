import { Sparkline } from '../ui/Sparkline';
import { healthScoreSeries, patientIdentity } from '../../constants/patientData';

export function HealthScoreCard() {
  const score = patientIdentity.healthScore;
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-50/50" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Health score</p>
      <div className="mt-4 flex items-center gap-5">
        <svg viewBox="0 0 108 108" className="h-24 w-24 shrink-0" aria-hidden>
          <circle cx="54" cy="54" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="54"
            cy="54"
            r={radius}
            fill="none"
            stroke="#0d9488"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 54 54)"
          />
          <text x="54" y="58" textAnchor="middle" className="fill-ink-900" fontSize="22" fontWeight="600">
            {score}
          </text>
        </svg>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink-900">{patientIdentity.healthLabel}</p>
          <p className="mt-1 text-sm leading-6 text-ink-500">UI estimate from recent vitals and adherence — not a diagnosis.</p>
          <Sparkline className="mt-3 h-10 w-full max-w-[180px]" points={healthScoreSeries} />
        </div>
      </div>
    </article>
  );
}
