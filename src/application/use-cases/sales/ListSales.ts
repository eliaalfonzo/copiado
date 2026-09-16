import type { SaleRepository } from '@/domain/ports/SaleRepository';
import type { Sale } from '@/domain/entities/Sale';
import { getMonthlyPeriodKey } from '@/shared/utils/date';

export class ListSales {
  constructor(private readonly saleRepository: SaleRepository) {}

  async executeCurrentPeriod(): Promise<Sale[]> {
    const period = getMonthlyPeriodKey(new Date());
    const sales = await this.saleRepository.getByPeriod(period);
    return [...sales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async executeAll(): Promise<Sale[]> {
    return this.saleRepository.getAll();
  }

  async executeByPeriod(periodKey: string): Promise<Sale[]> {
    const sales = await this.saleRepository.getByPeriod(periodKey);
    return [...sales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
