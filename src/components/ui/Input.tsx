import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightIcon, className, id, ...props },
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
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 shadow-xs outline-none transition-all placeholder:text-ink-400',
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {rightIcon ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-ink-400">{rightIcon}</span>
        ) : null}
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
