import { Moon, Sun, Menu, RefreshCw } from 'lucide-react';
import { useTheme } from '@/presentation/theme/ThemeContext';
import { useSettings } from '@/presentation/hooks/useSettings';
import { useExchangeRate } from '@/presentation/hooks/useExchangeRate';
import { LoadingLogo } from '@/presentation/components/LoadingLogo';
import { formatTime } from '@/shared/utils/date';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
}

export function Header({ title, subtitle, onOpenMenu }: HeaderProps) {
  const { mode, toggleMode } = useTheme();
  const { settings } = useSettings();
  const { rate, status, refresh } = useExchangeRate();

  const getStatusColor = () => {
    switch (status) {
      case 'updated':
        return '#10B981'; // Verde vivo
      case 'manual':
        return 'var(--color-brand)'; // Morado/marca
      case 'stale':
        return 'var(--color-warning)'; // Ambar
      case 'error':
        return 'var(--color-danger)'; // Rojo
      default:
        return 'var(--color-text-muted)';
    }
  };

  const getTooltip = () => {
    if (!rate) return 'Consultando tasa oficial del BCV...';
    const hora = rate.fetchedAt ? formatTime(rate.fetchedAt) : '';
    const fuente = rate.source || 'BCV Oficial';
    return `${fuente} — Última verificación: ${hora}. Clic en el botón para refrescar en vivo.`;
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <button
          type="button"
          className="header-menu-button"
          onClick={onOpenMenu}
          aria-label="Abrir menu de navegacion"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Menu size={19} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {settings?.logoDataUrl ? (
            <img src={settings.logoDataUrl} alt={settings.name} style={{ height: 36, objectFit: 'contain', borderRadius: 6 }} />
          ) : (
            <LoadingLogo size={32} />
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Widget del Dolar BCV en Vivo 24/7 */}
        <div
          title={getTooltip()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              display: 'inline-block',
              boxShadow: status === 'updated' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
              flexShrink: 0,
            }}
          />
          {rate ? (
            <span style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, marginRight: 2 }}>$1 =</span>
              {rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </span>
          ) : (
            <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>Cargando...</span>
          )}

          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Verificar tasa de cambio ahora"
            title="Refrescar tasa en vivo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              padding: 2,
              marginLeft: 2,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            <RefreshCw
              size={12}
              style={{
                animation: status === 'loading' ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>

        <button
          onClick={toggleMode}
          aria-label={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-brand-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}