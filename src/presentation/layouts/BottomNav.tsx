import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { NAV_ITEMS } from './navItems';

const QUICK_ITEMS = NAV_ITEMS.slice(0, 4);

interface BottomNavProps {
  onOpenMenu: () => void;
}

/**
 * Barra inferior de accesos rapidos para movil. Solo muestra los 4
 * items mas usados; el resto (incluyendo los que no caben aqui) se
 * accede mediante el boton "Mas", que abre el menu desplegable
 * (MobileDrawer) con la navegacion completa.
 */
export function BottomNav({ onOpenMenu }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav"
      aria-label="Navegacion principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'none',
        zIndex: 500,
      }}
    >
      <ul style={{ display: 'flex', width: '100%', margin: 0, padding: 0, listStyle: 'none' }}>
        {QUICK_ITEMS.map((item) => (
          <li key={item.to} style={{ flex: 1 }}>
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
                fontSize: 10.5,
                fontWeight: 600,
                color: isActive ? 'var(--color-brand-secondary)' : 'var(--color-text-muted)',
              })}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          </li>
        ))}
        <li style={{ flex: 1 }}>
          <button
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
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
            }}
          >
            <Menu size={20} />
            Mas
          </button>
        </li>
      </ul>
      <style>{`
        @media (max-width: 860px) {
          .bottom-nav { display: block; }
        }
      `}</style>
    </nav>
  );
}
