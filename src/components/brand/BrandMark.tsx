import { cn } from '../../utils/cn';

/** The WellNest W: two protective wings held by the curves of a nest. */
export function BrandMark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  const background = inverted ? '#dce7ca' : '#173f35';
  const foreground = inverted ? '#173f35' : '#faf9f5';
  const nest = inverted ? '#59724a' : '#c3d4a8';

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" className={cn('size-11 shrink-0', className)}>
      <rect width="64" height="64" rx="19" fill={background} />
      <circle cx="32" cy="16" r="3.5" fill="#dfa285" />
      <path d="M14 23c1.4 7.6 4.1 13.3 9 17l9-15 9 15c4.9-3.7 7.6-9.4 9-17" stroke={foreground} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 43c8 10 22 10 30 0" stroke={nest} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 51c6 3 12 3 18 0" stroke={nest} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
