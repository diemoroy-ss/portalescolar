import React from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary-600 text-white',
    'hover:bg-primary-500 hover:shadow-glow-green',
    'active:bg-primary-700',
    'disabled:bg-primary-900 disabled:text-primary-700',
    'border border-primary-500/30',
  ].join(' '),
  secondary: [
    'bg-secondary-600 text-white',
    'hover:bg-secondary-500',
    'active:bg-secondary-700',
    'disabled:opacity-40',
  ].join(' '),
  ghost: [
    'bg-transparent text-neutral-300',
    'hover:bg-surface-2 hover:text-white',
    'active:bg-surface-3',
    'disabled:opacity-40',
  ].join(' '),
  danger: [
    'bg-danger-600 text-white',
    'hover:bg-danger-500',
    'active:bg-danger-900',
    'disabled:opacity-40',
  ].join(' '),
  outline: [
    'bg-transparent text-primary-400 border border-primary-700',
    'hover:bg-primary-900/30 hover:border-primary-500',
    'active:bg-primary-900/50',
    'disabled:opacity-40',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'cursor-pointer select-none touch-target',
        'hover:scale-[1.02] active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        isLoading && 'cursor-wait opacity-70',
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
