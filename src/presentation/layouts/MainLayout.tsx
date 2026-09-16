import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';

const MOBILE_BREAKPOINT = 860;

export function MainLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bloquea el scroll del fondo mientras el menu movil esta abierto.
  useEffect(() => {
    document.body.classList.toggle('drawer-open', drawerOpen);

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [drawerOpen]);

  // Sincroniza la navegacion al cambiar entre movil y escritorio.
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setDrawerOpen(false);
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // En movil abre el drawer.
  // En escritorio muestra u oculta el sidebar.
  const handleMenuClick = () => {
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      setSidebarOpen((current) => !current);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} />

      <div className="app-main">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMenu={handleMenuClick}
        />

        <main className="app-content">{children}</main>
      </div>

      <BottomNav onOpenMenu={() => setDrawerOpen(true)} />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
