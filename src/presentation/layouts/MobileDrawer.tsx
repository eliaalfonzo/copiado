import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { useSettings } from '@/presentation/hooks/useSettings';
import { LoadingLogo } from '@/presentation/components/LoadingLogo';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Menu desplegable (drawer) para navegacion completa en pantallas
 * pequenas: muestra TODOS los items de navegacion (a diferencia del
 * bottom nav, que solo tiene espacio para los accesos rapidos). Se
 * abre desde el boton de menu en el Header o el boton "Mas" del bottom
 * nav, y se cierra al elegir una opcion, tocar fuera, o Escape.
 *
 * Todo el CSS responsivo (posicion, animacion, que se oculte en
 * escritorio) vive centralizado en theme.css bajo las clases
 * .drawer-overlay / .drawer-panel, para evitar reglas repartidas entre
 * componentes que puedan pisarse entre si.
 */
export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { settings } = useSettings();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-overlay${open ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`drawer-panel${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacion"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {settings?.logoDataUrl ? (
              <img
                src={settings.logoDataUrl}
                alt={settings.name}
                style={{ maxHeight: 52, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <LoadingLogo size={44} />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-alt)',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 15,
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                background: isActive ? 'linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary))' : 'transparent',
              })}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
          Desarrollado por Elia
        </div>
      </div>
    </>
  );
}