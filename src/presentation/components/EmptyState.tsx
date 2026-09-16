import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        padding: '48px 20px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface-alt)',
          color: 'var(--color-brand-secondary)',
        }}
      >
        <Icon size={26} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{title}</p>
      {description && <p style={{ fontSize: 13, margin: 0, maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  );
}
