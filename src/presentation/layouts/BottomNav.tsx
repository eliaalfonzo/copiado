import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { NAV_ITEMS } from './navItems';

const QUICK_ITEMS = NAV_ITEMS.slice(0, 4);

interface BottomNavProps {
  onOpenMenu: () => void;
}

/**
 * Barra inferior de accesos rapidos para movil. Muestra los 4 items
 * mas usados sin necesidad de abrir el menu; el resto (y el acceso
 * completo a las 7 secciones) esta a un toque mediante el boton "Mas",
 * que abre el menu desplegable (MobileDrawer).
 */
export function BottomNav({ onOpenMenu }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav"
      aria-label="Accesos rapidos"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        zIndex: 500,
      }}
    >
      <ul style={{ display: 'flex', width: '100%', height: '100%', margin: 0, padding: 0, listStyle: 'none' }}>
        {QUICK_ITEMS.map((item) => (
          <li key={item.to} style={{ flex: 1, minWidth: 0 }}>
            <NavLink
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                height: '100%',
                textDecoration: 'none',
                fontSize: 10,
                fontWeight: 600,
                color: isActive ? 'var(--color-brand-secondary)' : 'var(--color-text-muted)',
              })}
            >
              <item.icon size={19} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {item.label}
              </span>
            </NavLink>
          </li>
        ))}
        <li style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Ver mas opciones del menu"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
            }}
          >
            <Menu size={19} />
            Mas
          </button>
        </li>
      </ul>
    </nav>
  );
}