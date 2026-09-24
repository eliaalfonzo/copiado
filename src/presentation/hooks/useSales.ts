import { useCallback, useEffect, useState } from 'react';
import { container } from '@/infrastructure/container';
import type { Sale } from '@/domain/entities/Sale';
import type { SaleItem } from '@/domain/entities/SaleItem';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await container.listSales.executeCurrentPeriod();
    setSales(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createSale = useCallback(
    async (clientId: string, items: SaleItem[], exchangeRate: number, discountPercentage = 0): Promise<Sale> => {
      const sale = await container.createSale.execute({ clientId, items, exchangeRate, discountPercentage });
      await reload();
      return sale;
    },
    [reload]
  );

  const cancelSale = useCallback(
    async (saleId: string, reason?: string) => {
      await container.cancelSale.execute(saleId, reason);
      await reload();
    },
    [reload]
  );

  const deleteSale = useCallback(
    async (saleId: string) => {
      await container.deleteSale.execute(saleId);
      await reload();
    },
    [reload]
  );

  const summary = container.getMonthlySummary.execute(sales);

  return { sales, loading, reload, createSale, cancelSale, deleteSale, summary };
}