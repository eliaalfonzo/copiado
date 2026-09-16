import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary))',
    color: '#fff',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--color-surface-alt)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-danger)',
    color: '#fff',
    border: '1px solid transparent',
  },
};

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 13, borderRadius: 'var(--radius-sm)' },
  md: { padding: '10px 18px', fontSize: 14, borderRadius: 'var(--radius-md)' },
  lg: { padding: '14px 22px', fontSize: 16, borderRadius: 'var(--radius-md)' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, disabled, children, style, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'transform 0.12s ease, filter 0.12s ease',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
      {...rest}
    >
      {loading && <Loader2 size={16} className="spin" style={{ animation: 'spin 0.8s linear infinite' }} />}
      {children}
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </button>
  );
});
