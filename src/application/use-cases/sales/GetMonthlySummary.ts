import type { Sale } from '@/domain/entities/Sale';
import { getDayKey } from '@/shared/utils/date';

export interface MonthlySummary {
  totalUsdCents: number;
  totalBsCents: number;
  salesCount: number;
  clientsAttended: number;
  servicesSold: number;
  averageTicketCents: number;
  salesByCategory: { category: string; totalUsdCents: number }[];
  salesByDay: { day: string; totalUsdCents: number }[];
  topProducts: { name: string; quantity: number }[];
}

/**
 * Calcula las estadisticas del periodo a partir de ventas reales.
 * No se utilizan datos ficticios: si no hay ventas, todo queda en cero.
 *
 * IMPORTANTE: las ventas con status 'cancelled' se excluyen de TODOS
 * los totales y graficos (no se borran del historial, solo no cuentan
 * para efectos estadisticos).
 */
export class GetMonthlySummary {
  execute(allSales: Sale[]): MonthlySummary {
    const sales = allSales.filter((s) => s.status !== 'cancelled');

    const totalUsdCents = sales.reduce((sum, s) => sum + s.totalUsdCents, 0);
    const totalBsCents = sales.reduce((sum, s) => sum + s.totalBsCents, 0);
    const clientsAttended = new Set(sales.map((s) => s.clientId)).size;
    const servicesSold = sales.reduce(
      (sum, s) => sum + s.items.reduce((q, i) => q + i.quantity, 0),
      0
    );
    const averageTicketCents = sales.length > 0 ? Math.round(totalUsdCents / sales.length) : 0;

    const categoryMap = new Map<string, number>();
    const productMap = new Map<string, number>();
    const dayMap = new Map<string, number>();

    for (const sale of sales) {
      const dayKey = getDayKey(sale.createdAt);
      dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + sale.totalUsdCents);

      for (const item of sale.items) {
        categoryMap.set(
          item.productNameSnapshot,
          (categoryMap.get(item.productNameSnapshot) ?? 0) + item.subtotalCents
        );
        productMap.set(
          `${item.productNameSnapshot} (${item.variantNameSnapshot})`,
          (productMap.get(`${item.productNameSnapshot} (${item.variantNameSnapshot})`) ?? 0) +
            item.quantity
        );
      }
    }

    return {
      totalUsdCents,
      totalBsCents,
      salesCount: sales.length,
      clientsAttended,
      servicesSold,
      averageTicketCents,
      salesByCategory: [...categoryMap.entries()]
        .map(([category, totalUsdCents]) => ({ category, totalUsdCents }))
        .sort((a, b) => b.totalUsdCents - a.totalUsdCents),
      salesByDay: [...dayMap.entries()]
        .map(([day, totalUsdCents]) => ({ day, totalUsdCents }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      topProducts: [...productMap.entries()]
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
    };
  }
}
