import type { SaleItem } from './SaleItem';

export type SaleStatus = 'completed' | 'cancelled';

export interface Sale {
  id: string;
  clientId: string;
  clientNameSnapshot: string;
  items: SaleItem[];
  /** Suma de los subtotales de los items, ANTES de aplicar el descuento. */
  subtotalUsdCents: number;
  /**
   * Porcentaje de descuento aplicado a esta venta (0 si no se aplico
   * ninguno). Se captura manualmente por el trabajador cuando el
   * trabajo lo amerita (ej: documentos grandes), nunca automatico.
   */
  discountPercentage: number;
  /** Monto del descuento en centavos de USD, ya calculado y congelado. */
  discountAmountCents: number;
  /** Total final DESPUES del descuento (lo que realmente se cobro). */
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