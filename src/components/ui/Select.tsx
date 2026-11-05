import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label ? (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-white px-3.5 pr-10 text-sm text-ink-900 shadow-xs outline-none transition-all',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </span>
      {error ? (
        <span id={`${inputId}-error`} className="mt-1.5 block text-xs font-medium text-rose-600">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="mt-1.5 block text-xs text-ink-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
});
