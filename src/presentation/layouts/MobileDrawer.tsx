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
 * Menu desplegable (drawer) responsivo para navegacion completa en
 * pantallas pequenas. Muestra TODOS los items de navegacion (a
 * diferencia del bottom nav, que solo tiene espacio para unos pocos
 * accesos rapidos). Se abre desde el boton de menu en el Header y se
 * cierra al elegir una opcion, tocar fuera, o presionar Escape.
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
        className={`drawer-overlay ${open ? 'drawer-overlay-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`drawer-panel ${open ? 'drawer-panel-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacion"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {settings?.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt={settings.name} style={{ maxHeight: 58, maxWidth: '90%', objectFit: 'contain', borderRadius: 8 }} />
            ) : (
              <LoadingLogo size={48} />
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menu"
            style={{
              marginLeft: 12,
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

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
          Desarrollado por Elia
        </div>
      </div>

      <style>{`
        .drawer-overlay {
          position: fixed; inset: 0; background: rgba(10, 5, 10, 0.55);
          opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 800;
        }
        .drawer-overlay-open { opacity: 1; pointer-events: auto; }
        .drawer-panel {
          position: fixed; top: 0; left: 0; bottom: 0; width: 78vw; max-width: 320px;
          background: var(--color-surface); border-right: 1px solid var(--color-border);
          padding: 20px 16px; z-index: 850; transform: translateX(-100%);
          transition: transform 0.22s ease; overflow-y: auto; box-shadow: var(--shadow-elevated);
        }
        .drawer-panel-open { transform: translateX(0); }
        @media (min-width: 861px) {
          .drawer-overlay, .drawer-panel { display: none; }
        }
      `}</style>
    </>
  );
}