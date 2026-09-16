import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';

export function MainLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Bloquea el scroll del fondo mientras el menu movil esta abierto,
  // para que no se vea contenido brincando o solapado detras de el.
  useEffect(() => {
    document.body.classList.toggle('drawer-open', drawerOpen);
    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [drawerOpen]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header title={title} subtitle={subtitle} onOpenMenu={() => setDrawerOpen(true)} />
        <main className="app-content">{children}</main>
      </div>
      <BottomNav onOpenMenu={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}