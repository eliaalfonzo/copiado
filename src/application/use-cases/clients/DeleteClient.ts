import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { SaleRepository } from '@/domain/ports/SaleRepository';
import { DomainError } from '@/domain/errors/DomainError';

export interface DeleteClientResult {
  hadSalesInHistory: boolean;
}

/**
 * Elimina un cliente del catalogo activo. Las ventas ya registradas NO
 * se ven afectadas: cada Sale conserva un `clientNameSnapshot` propio,
 * por lo que el historial y los reportes siguen mostrando el nombre del
 * cliente correctamente aunque el registro de Client se elimine.
 */
export class DeleteClient {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly saleRepository: SaleRepository
  ) {}

  async execute(clientId: string): Promise<DeleteClientResult> {
    const client = await this.clientRepository.getById(clientId);
    if (!client) {
      throw new DomainError('El cliente que intenta eliminar no existe.');
    }

    const allSales = await this.saleRepository.getAll();
    const hadSalesInHistory = allSales.some((sale) => sale.clientId === clientId);

    await this.clientRepository.delete(clientId);

    return { hadSalesInHistory };
  }
}
