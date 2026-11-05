import { useRef } from 'react';
import { cn } from '../../utils/cn';

export function OtpInput({
  length = 6,
  value,
  onChange,
}: {
  length?: number;
  value: string;
  onChange: (next: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, index) => value[index] ?? '');

  const focusAt = (index: number) => refs.current[index]?.focus();

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={char}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            'h-12 w-10 rounded-2xl border border-line bg-white text-center text-lg font-semibold text-ink-900 shadow-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50 sm:h-14 sm:w-12',
          )}
          onChange={(event) => {
            const digit = event.target.value.replace(/\D/g, '').slice(-1);
            const next = chars.map((item, i) => (i === index ? digit : item)).join('');
            onChange(next);
            if (digit) focusAt(Math.min(length - 1, index + 1));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !chars[index]) focusAt(Math.max(0, index - 1));
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            onChange(pasted);
            focusAt(Math.min(length - 1, pasted.length));
          }}
        />
      ))}
    </div>
  );
}
