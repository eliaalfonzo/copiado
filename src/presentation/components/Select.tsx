import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, style, children, ...rest },
  ref
) {
  const selectId = id ?? `select-${label?.replace(/\s+/g, '-').toLowerCase() ?? Math.random()}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label htmlFor={selectId} style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)',
          color: 'var(--color-text)',
          fontSize: 14,
          width: '100%',
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
});
