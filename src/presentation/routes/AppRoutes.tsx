import { Routes, Route } from 'react-router-dom';
import { Dashboard } from '@/presentation/pages/Dashboard';
import { NewSale } from '@/presentation/pages/NewSale';
import { Clients } from '@/presentation/pages/Clients';
import { Products } from '@/presentation/pages/Products';
import { Sales } from '@/presentation/pages/Sales';
import { Reports } from '@/presentation/pages/Reports';
import { Settings } from '@/presentation/pages/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/nueva-venta" element={<NewSale />} />
      <Route path="/clientes" element={<Clients />} />
      <Route path="/productos" element={<Products />} />
      <Route path="/ventas" element={<Sales />} />
      <Route path="/reportes" element={<Reports />} />
      <Route path="/configuracion" element={<Settings />} />
    </Routes>
  );
}
