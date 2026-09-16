import type { SaleRepository } from '@/domain/ports/SaleRepository';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * Anula una venta SIN eliminarla: se conserva integramente en el
 * almacenamiento para efectos de auditoria, pero se marca con
 * status = 'cancelled' y queda excluida de las estadisticas, del
 * dashboard y de los reportes (ver GetMonthlySummary).
 */
export class CancelSale {
  constructor(private readonly saleRepository: SaleRepository) {}

  async execute(saleId: string, reason?: string): Promise<void> {
    const sale = await this.saleRepository.getById(saleId);
    if (!sale) {
      throw new DomainError('La venta que intenta anular no existe.');
    }
    if (sale.status === 'cancelled') {
      throw new DomainError('Esta venta ya se encuentra anulada.');
    }

    await this.saleRepository.update({
      ...sale,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason?.trim() || undefined,
    });
  }
}
