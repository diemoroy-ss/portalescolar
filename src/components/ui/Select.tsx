import React, { useState, useId } from 'react';
import { cn } from '@/utils/cn';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  hint,
  leftIcon,
  className,
  required,
  disabled,
  value,
  defaultValue,
  children,
  ...props
}) => {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  
  // Native selects always show the selected option's text (e.g. 'Seleccione...'),
  // which causes overlap if the label doesn't float. We always float it for Select.
  const isFloated = true;

  return (
    <div className="relative w-full">
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none z-10">
            {leftIcon}
          </span>
        )}

        <select
          id={id}
          value={value}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            'w-full rounded-xl border bg-surface-1 pt-5 pb-2 text-sm text-neutral-100',
            'transition-all duration-200 outline-none appearance-none',
            leftIcon ? 'pl-10 pr-10' : 'pl-4 pr-10',
            'border-surface-3',
            isFocused && 'border-primary-600 ring-1 ring-primary-600/30',
            error && 'border-danger-500 ring-1 ring-danger-500/30',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        
        {/* Custom Chevron for select */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <label
          htmlFor={id}
          className={cn(
            'absolute left-4 pointer-events-none transition-all duration-200',
            leftIcon && 'left-10',
            isFloated
              ? 'top-2 text-2xs font-medium'
              : 'top-1/2 -translate-y-1/2 text-sm',
            isFocused && !error ? 'text-primary-400' : 'text-neutral-500',
            error && isFloated ? 'text-danger-400' : '',
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-danger-500" aria-hidden>*</span>}
        </label>
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
};
