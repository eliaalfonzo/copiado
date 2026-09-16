import type { SaleRepository } from '@/domain/ports/SaleRepository';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * Elimina PERMANENTEMENTE una venta del almacenamiento local.
 *
 * A diferencia de CancelSale (que preserva la venta para auditoria),
 * esta operacion es irreversible y borra el registro por completo.
 * Se reserva para casos de errores de captura evidentes; el flujo
 * recomendado para la operativa diaria es anular, no eliminar.
 */
export class DeleteSale {
  constructor(private readonly saleRepository: SaleRepository) {}

  async execute(saleId: string): Promise<void> {
    const sale = await this.saleRepository.getById(saleId);
    if (!sale) {
      throw new DomainError('La venta que intenta eliminar no existe.');
    }
    await this.saleRepository.delete(saleId);
  }
}
