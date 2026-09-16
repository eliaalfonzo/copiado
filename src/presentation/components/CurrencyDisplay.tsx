interface CurrencyDisplayProps {
  usdCents: number;
  bsCents?: number;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right' | 'center';
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBs(cents: number): string {
  return `Bs. ${(cents / 100).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SIZES = {
  sm: { usd: 15, bs: 12 },
  md: { usd: 20, bs: 13 },
  lg: { usd: 32, bs: 15 },
};

export function CurrencyDisplay({ usdCents, bsCents, size = 'md', align = 'left' }: CurrencyDisplayProps) {
  const sizes = SIZES[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: align, alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
      <span style={{ fontSize: sizes.usd, fontWeight: 800, color: 'var(--color-brand-secondary)', lineHeight: 1.1 }}>
        {formatUsd(usdCents)}
      </span>
      {bsCents !== undefined && (
        <span style={{ fontSize: sizes.bs, color: 'var(--color-text-secondary)', marginTop: 2 }}>{formatBs(bsCents)}</span>
      )}
    </div>
  );
}
