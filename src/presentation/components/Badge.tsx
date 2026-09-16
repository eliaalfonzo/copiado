import type { ReactNode } from 'react';

type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'neutral';

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: 'rgba(255, 20, 147, 0.16)', fg: 'var(--color-brand-secondary)' },
  success: { bg: 'rgba(53, 208, 127, 0.16)', fg: 'var(--color-success)' },
  danger: { bg: 'rgba(255, 77, 103, 0.16)', fg: 'var(--color-danger)' },
  warning: { bg: 'rgba(255, 184, 77, 0.18)', fg: 'var(--color-warning)' },
  neutral: { bg: 'var(--color-surface-alt)', fg: 'var(--color-text-secondary)' },
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const colors = TONE_COLORS[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: colors.bg,
        color: colors.fg,
      }}
    >
      {children}
    </span>
  );
}
