import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'min-h-28 w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-xs outline-none transition-all placeholder:text-ink-400',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-200 hover:border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20',
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
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
