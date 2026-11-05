import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '../ui/Input';

export const PasswordField = forwardRef<HTMLInputElement, InputProps>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="rounded-lg p-1 text-ink-400 hover:text-ink-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
});
