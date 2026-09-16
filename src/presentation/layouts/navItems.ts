import { Home, ShoppingCart, Users, Package, Receipt, BarChart3, Settings as SettingsIcon } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/nueva-venta', label: 'Nueva venta', icon: ShoppingCart, end: false },
  { to: '/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/productos', label: 'Productos', icon: Package, end: false },
  { to: '/ventas', label: 'Ventas', icon: Receipt, end: false },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, end: false },
  { to: '/configuracion', label: 'Configuracion', icon: SettingsIcon, end: false },
] as const;
