import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '@/presentation/theme/ThemeContext';
import { useSettings } from '@/presentation/hooks/useSettings';
import { LoadingLogo } from '@/presentation/components/LoadingLogo';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
}

export function Header({ title, subtitle, onOpenMenu }: HeaderProps) {
  const { mode, toggleMode } = useTheme();
  const { settings } = useSettings();

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
        }}
      >
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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {settings?.logoDataUrl ? (
            <img
              src={settings.logoDataUrl}
              alt={settings.name}
              style={{
                height: 36,
                objectFit: 'contain',
                borderRadius: 6,
              }}
            />
          ) : (
            <LoadingLogo size={32} />
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={toggleMode}
          aria-label={
            mode === 'dark'
              ? 'Cambiar a modo claro'
              : 'Cambiar a modo oscuro'
          }
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
