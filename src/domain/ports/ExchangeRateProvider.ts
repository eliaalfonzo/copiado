import type { ExchangeRate } from '@/domain/entities/ExchangeRate';

/**
 * Puerto para obtener la tasa de cambio actual. La logica de negocio
 * depende UNICAMENTE de esta interfaz; el proveedor concreto
 * (API HTTP, otro backend, etc.) vive en infraestructura y puede
 * sustituirse sin afectar casos de uso ni componentes.
 */
export interface ExchangeRateProvider {
  fetchCurrentRate(): Promise<ExchangeRate>;
}
