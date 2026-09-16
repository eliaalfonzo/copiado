import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '48px 20px',
        color: 'var(--color-text-secondary)',
      }}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={24} style={{ animation: 'spin 0.9s linear infinite', color: 'var(--color-brand-secondary)' }} />
      <span style={{ fontSize: 14 }}>{label}</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </div>
  );
}
