import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-900/50 text-success-500 border border-success-900',
  warning: 'bg-warning-900/50 text-warning-500 border border-warning-900',
  danger:  'bg-danger-900/50 text-danger-500 border border-danger-900',
  info:    'bg-secondary-900/50 text-secondary-300 border border-secondary-900',
  neutral: 'bg-surface-2 text-neutral-400 border border-surface-3',
  primary: 'bg-primary-900/50 text-primary-400 border border-primary-900',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger:  'bg-danger-500',
  info:    'bg-secondary-400',
  neutral: 'bg-neutral-500',
  primary: 'bg-primary-500',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className,
  dot = false,
}) => (
  <span className={cn('badge', variantClasses[variant], className)}>
    {dot && (
      <span
        className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])}
        aria-hidden
      />
    )}
    {children}
  </span>
);
