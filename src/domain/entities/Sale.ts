import type { SaleItem } from './SaleItem';

export type SaleStatus = 'completed' | 'cancelled';

export interface Sale {
  id: string;
  clientId: string;
  clientNameSnapshot: string;
  items: SaleItem[];
  totalUsdCents: number;
  totalBsCents: number;
  exchangeRateUsed: number;
  createdAt: string;
  monthlyPeriod: string;
  /**
   * Estado de auditoria de la venta. Una venta 'cancelled' NUNCA se
   * borra automaticamente: permanece visible en el historial (con una
   * marca clara) mientras se descuenta de las estadisticas y reportes,
   * para preservar la trazabilidad de todas las operaciones realizadas.
   */
  status: SaleStatus;
  cancelledAt?: string;
  cancellationReason?: string;
}
