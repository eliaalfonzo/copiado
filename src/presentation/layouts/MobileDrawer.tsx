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
 * pequenas. Muestra TODOS los items de navegacion (a diferencia del
 * bottom nav, que solo tiene espacio para los accesos rapidos). Se
 * abre desde el boton de menu en el Header o el boton "Mas" del bottom
 * nav, y se cierra al elegir una opcion, tocar fuera, o Escape.
 *
 * IMPORTANTE: el estado abierto/cerrado se aplica con `style` en
 * linea (calculado en JS a partir de `open`), NO solo con una clase
 * CSS. Esto es deliberado: un estilo en linea SIEMPRE se aplica de
 * inmediato con el render, sin depender de que el navegador ya haya
 * descargado/aplicado la hoja de estilos externa ni de el orden en
 * que se cargan otras reglas. Asi se evita que el menu aparezca
 * "abierto por defecto" si por cualquier motivo el CSS externo tarda,
 * falla o queda en cache vieja.
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
        onClick={onClose}
        aria-hidden={!open}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 5, 10, 0.6)',
          zIndex: 900,
          transition: 'opacity 0.2s ease',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegacion"
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '82vw',
          maxWidth: 320,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          padding: '18px 16px 24px',
          zIndex: 950,
          overflowY: 'auto',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.22s ease, visibility 0.22s ease',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          visibility: open ? 'visible' : 'hidden',
        }}
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