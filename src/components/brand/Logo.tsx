import { Link } from 'react-router-dom';
import { paths } from '../../routes/paths';
import { cn } from '../../utils/cn';
import { BrandMark } from './BrandMark';

export function Logo({
  className,
  compact = false,
  inverted = false,
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <Link
      to={paths.home}
      className={cn('group inline-flex items-center gap-3 select-none', className)}
      aria-label="WellNest home"
    >
      <BrandMark inverted={inverted} className="transition-transform duration-300 group-hover:scale-[1.04]" />

      {!compact ? (
        <span className="flex flex-col justify-center leading-none">
          <span className="font-sans text-[25px] leading-none tracking-[-0.045em]">
            <span className={cn('font-bold', inverted ? 'text-[#f4f5e9]' : 'text-[#173f35]')}>Well</span>
            <span className={cn('font-medium', inverted ? 'text-[#c3d4ad]' : 'text-[#667b52]')}>Nest</span>
          </span>
          <span
            className={cn(
              'mt-2 font-sans text-[7px] font-semibold uppercase tracking-[0.30em]',
              inverted ? 'text-[#c3d4ad]' : 'text-[#718568]',
            )}
          >
            Connected care
          </span>
        </span>
      ) : null}
    </Link>
  );
}
