import type { SaleRepository } from '@/domain/ports/SaleRepository';
import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { Sale } from '@/domain/entities/Sale';
import type { SaleItem } from '@/domain/entities/SaleItem';
import { SaleCalculator } from '@/domain/services/SaleCalculator';
import { generateId } from '@/shared/utils/id';
import { getMonthlyPeriodKey } from '@/shared/utils/date';
import { DomainError } from '@/domain/errors/DomainError';

export interface CreateSaleInput {
  clientId: string;
  items: SaleItem[];
  exchangeRate: number;
}

export class CreateSale {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly clientRepository: ClientRepository
  ) { }

  async execute(input: CreateSaleInput): Promise<Sale> {
    if (input.items.length === 0) {
      throw new DomainError('Debe agregar al menos un servicio para registrar la venta.');
    }
    if (!input.exchangeRate || input.exchangeRate <= 0) {
      throw new DomainError('No hay una tasa de cambio valida para registrar la venta.');
    }

    const client = await this.clientRepository.getById(input.clientId);
    if (!client) {
      throw new DomainError('Debe seleccionar un cliente para la venta.');
    }

    const totalUsd = SaleCalculator.calculateTotalUsd(input.items);
    if (totalUsd.isZero() || totalUsd.isNegative()) {
      throw new DomainError('El total de la venta debe ser mayor a cero.');
    }
    const totalBs = SaleCalculator.calculateTotalBs(totalUsd, input.exchangeRate);

    const sale: Sale = {
      id: generateId('sale'),
      clientId: client.id,
      clientNameSnapshot: client.fullName,
      items: input.items,
      totalUsdCents: totalUsd.valueInCents,
      totalBsCents: totalBs.valueInCents,
      exchangeRateUsed: input.exchangeRate,
      createdAt: new Date().toISOString(),
      monthlyPeriod: getMonthlyPeriodKey(new Date()),
      status: 'completed',
    };

    await this.saleRepository.save(sale);
    return sale;
  }
}