import React, { useState, useId } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  required,
  disabled,
  value,
  defaultValue,
  ...props
}) => {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '' || defaultValue !== undefined && defaultValue !== null && defaultValue !== '';
  const isDateType = props.type === 'date' || props.type === 'time' || props.type === 'datetime-local' || props.type === 'month' || props.type === 'week';
  const isFloated = isFocused || hasValue || isDateType;

  return (
    <div className="relative w-full">
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none z-10">
            {leftIcon}
          </span>
        )}

        <input
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
            'transition-all duration-200 outline-none',
            'placeholder:text-transparent',
            leftIcon ? 'pl-10 pr-4' : 'px-4',
            rightIcon ? 'pr-10' : '',
            'border-surface-3',
            isFocused && 'border-primary-600 ring-1 ring-primary-600/30',
            error && 'border-danger-500 ring-1 ring-danger-500/30',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
          {...props}
        />

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

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </span>
        )}
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
