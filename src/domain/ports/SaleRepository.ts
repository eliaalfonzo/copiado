import type { Sale } from '@/domain/entities/Sale';

export interface SaleRepository {
  getAll(): Promise<Sale[]>;
  getByPeriod(periodKey: string): Promise<Sale[]>;
  getById(id: string): Promise<Sale | null>;
  save(sale: Sale): Promise<void>;
  update(sale: Sale): Promise<void>;
  /** Elimina permanentemente una venta especifica del almacenamiento. */
  delete(id: string): Promise<void>;
  /** Elimina las ventas de un periodo ya cerrado y respaldado. */
  archiveAndClearPeriod(periodKey: string): Promise<void>;
}
