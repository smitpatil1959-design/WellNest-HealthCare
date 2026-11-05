import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1180px] px-5 sm:px-6 lg:px-8', className)} {...props} />;
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('py-20 sm:py-24 lg:py-28', className)}>
      {children}
    </section>
  );
}
