import { cn } from '../../utils/cn';
import { formatInitials } from '../../utils/format';

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const dim =
    size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : size === 'xl' ? 'h-20 w-20 text-xl' : 'h-11 w-11 text-sm';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white shadow-sm', dim, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800',
        dim,
        className,
      )}
      aria-hidden
    >
      {formatInitials(name)}
    </span>
  );
}
