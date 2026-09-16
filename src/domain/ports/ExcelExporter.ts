import type { Sale } from '@/domain/entities/Sale';

export interface MonthlySummaryForExport {
  totalUsdCents: number;
  clientsAttended: number;
  servicesSold: number;
  averageTicketCents: number;
  salesByCategory: { category: string; totalUsdCents: number }[];
}

export interface ExcelExporter {
  exportMonthlySales(sales: Sale[], summary: MonthlySummaryForExport): Promise<Blob>;
}
