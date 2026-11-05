import { cn } from '../../utils/cn';

export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-10 w-10 border-4' : 'h-6 w-6 border-2';
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-brand-200 border-t-brand-600', dim, className)}
      role="status"
      aria-label="Loading"
    />
  );
}
