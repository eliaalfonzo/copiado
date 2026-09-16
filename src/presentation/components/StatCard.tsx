import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: 'brand' | 'success' | 'neutral';
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'neutral' }: StatCardProps) {
  const iconColor =
    tone === 'brand' ? 'var(--color-brand)' : tone === 'success' ? 'var(--color-success)' : 'var(--color-text-secondary)';

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</span>
        <Icon size={18} color={iconColor} />
      </div>
      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </span>
      {hint && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{hint}</span>}
    </div>
  );
}
