import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: string;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading,
    leftIcon,
    rightIcon,
    fullWidth,
    children,
    disabled,
    type = 'button',
    to,
    ...props
  },
  ref,
) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const content = (
    <>
      {loading ? <Spinner size="sm" className="border-current border-t-transparent" /> : leftIcon}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(classes, (disabled || loading) && 'pointer-events-none opacity-50')}
        aria-disabled={disabled || loading || undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  );
});
