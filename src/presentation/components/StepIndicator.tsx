interface Step {
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }} role="list" aria-label="Pasos de la venta">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        return (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} role="listitem">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: '50%',
                fontWeight: 700,
                fontSize: 13,
                background: isActive
                  ? 'linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary))'
                  : isDone
                  ? 'var(--color-success)'
                  : 'var(--color-surface-alt)',
                color: isActive || isDone ? '#fff' : 'var(--color-text-secondary)',
                border: isActive ? '2px solid var(--color-brand-secondary)' : '1px solid var(--color-border)',
              }}
              aria-current={isActive ? 'step' : undefined}
            >
              {index + 1}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span style={{ color: 'var(--color-text-muted)', margin: '0 4px' }}>&rarr;</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
