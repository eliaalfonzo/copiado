import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { useSettings } from '@/presentation/hooks/useSettings';
import { LoadingLogo } from '@/presentation/components/LoadingLogo';

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const { settings } = useSettings();

  return (
    <aside
      className={`sidebar-desktop ${open ? 'is-open' : 'is-collapsed'}`}
      style={{
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 16px',
        gap: 24,
      }}
    >
      {/*
        El logo NO se envuelve en una caja con fondo propio: la imagen
        ya trae su propio fondo fucsia/negro incorporado, asi que se
        muestra directamente sobre el fondo oscuro del sidebar.
      */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '4px 0',
        }}
      >
        {settings?.logoDataUrl ? (
          <img
            src={settings.logoDataUrl}
            alt={settings.name}
            style={{
              width: '100%',
              maxWidth: 216,
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 10,
            }}
          />
        ) : (
          <LoadingLogo size={64} />
        )}
      </div>

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              color: isActive
                ? '#fff'
                : 'var(--color-text-secondary)',
              background: isActive
                ? 'linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary))'
                : 'transparent',
            })}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--color-text-muted)',
        }}
      >
        Desarrollado por Elia
      </div>
    </aside>
  );
}