import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, style, ...rest },
  ref
) {
  const inputId = id ?? `input-${label?.replace(/\s+/g, '-').toLowerCase() ?? Math.random()}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          background: 'var(--color-surface-alt)',
          color: 'var(--color-text)',
          fontSize: 14,
          width: '100%',
          ...style,
        }}
        {...rest}
      />
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{hint}</span>}
      {error && (
        <span id={`${inputId}-error`} style={{ fontSize: 12, color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
});
