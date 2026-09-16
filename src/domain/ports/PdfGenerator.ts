import type { Sale } from '@/domain/entities/Sale';
import type { BusinessSettings } from '@/domain/entities/BusinessSettings';

export interface MonthlyReportData {
  periodLabel: string;
  generatedAt: string;
  totalUsdCents: number;
  totalBsCents: number;
  salesCount: number;
  clientsAttended: number;
  servicesSold: number;
  averageTicketCents: number;
  salesByCategory: { category: string; totalUsdCents: number }[];
  salesByDay: { day: string; totalUsdCents: number }[];
  sales: Sale[];
}

export interface PdfGenerator {
  generateInvoice(sale: Sale, business: BusinessSettings): Promise<Blob>;
  generateMonthlyReport(data: MonthlyReportData, business: BusinessSettings): Promise<Blob>;
}
