interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    id?: string;
}

/**
 * Interruptor (toggle) accesible reutilizable. Se usa, por ejemplo,
 * para activar/desactivar el descuento en una venta.
 */
export function Switch({ checked, onChange, label, id }: SwitchProps) {
    const switchId = id ?? `switch-${label?.replace(/\s+/g, '-').toLowerCase() ?? Math.random()}`;

    return (
        <label htmlFor={switchId} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <button
                type="button"
                id={switchId}
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                style={{
                    width: 42,
                    height: 24,
                    borderRadius: 999,
                    border: '1px solid var(--color-border)',
                    background: checked
                        ? 'linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary))'
                        : 'var(--color-surface-alt)',
                    position: 'relative',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    transition: 'background 0.15s ease',
                }}
            >
                <span
                    style={{
                        position: 'absolute',
                        top: 2,
                        left: checked ? 20 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                    }}
                />
            </button>
            {label && <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>}
        </label>
    );
}