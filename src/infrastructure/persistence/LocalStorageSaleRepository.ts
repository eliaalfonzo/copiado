import type { StoragePort } from '@/domain/ports/StoragePort';
import type { SaleRepository } from '@/domain/ports/SaleRepository';
import type { Sale } from '@/domain/entities/Sale';
import { STORAGE_KEYS } from './storageKeys';

export class LocalStorageSaleRepository implements SaleRepository {
  constructor(private readonly storage: StoragePort) {}

  async getAll(): Promise<Sale[]> {
    const sales = await this.storage.getItem<Sale[]>(STORAGE_KEYS.sales);
    return sales ?? [];
  }

  async getByPeriod(periodKey: string): Promise<Sale[]> {
    const sales = await this.getAll();
    return sales.filter((s) => s.monthlyPeriod === periodKey);
  }

  async getById(id: string): Promise<Sale | null> {
    const sales = await this.getAll();
    return sales.find((s) => s.id === id) ?? null;
  }

  async save(sale: Sale): Promise<void> {
    const sales = await this.getAll();
    sales.push(sale);
    await this.storage.setItem(STORAGE_KEYS.sales, sales);
  }

  async update(sale: Sale): Promise<void> {
    const sales = await this.getAll();
    const index = sales.findIndex((s) => s.id === sale.id);
    if (index === -1) return;
    sales[index] = sale;
    await this.storage.setItem(STORAGE_KEYS.sales, sales);
  }

  async delete(id: string): Promise<void> {
    const sales = await this.getAll();
    const remaining = sales.filter((s) => s.id !== id);
    await this.storage.setItem(STORAGE_KEYS.sales, remaining);
  }

  async archiveAndClearPeriod(periodKey: string): Promise<void> {
    const sales = await this.getAll();
    const remaining = sales.filter((s) => s.monthlyPeriod !== periodKey);
    await this.storage.setItem(STORAGE_KEYS.sales, remaining);
  }
}
