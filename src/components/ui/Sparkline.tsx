export function Sparkline({
  points,
  className,
  color = '#0d9488',
}: {
  points: number[];
  className?: string;
  color?: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const w = 160;
  const h = 48;
  const path = points
    .map((point, index) => {
      const x = points.length < 2 ? w / 2 : (index / (points.length - 1)) * w;
      const y = h - ((point - min) / (max - min || 1)) * (h - 6) - 3;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      {points.length === 1 ? (
        <circle cx={w / 2} cy={h - ((points[0] - min) / (max - min || 1)) * (h - 6) - 3} r="2.5" fill={color} />
      ) : (
        <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
