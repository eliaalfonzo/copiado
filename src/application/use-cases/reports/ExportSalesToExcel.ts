import type { ExcelExporter } from '@/domain/ports/ExcelExporter';
import type { Sale } from '@/domain/entities/Sale';
import { GetMonthlySummary } from '@/application/use-cases/sales/GetMonthlySummary';
import { DomainError } from '@/domain/errors/DomainError';

export class ExportSalesToExcel {
  constructor(
    private readonly excelExporter: ExcelExporter,
    private readonly getMonthlySummary: GetMonthlySummary = new GetMonthlySummary()
  ) {}

  async execute(sales: Sale[]): Promise<Blob> {
    const activeSales = sales.filter((s) => s.status !== 'cancelled');
    if (activeSales.length === 0) {
      throw new DomainError('No hay ventas registradas en este periodo para exportar.');
    }
    const summary = this.getMonthlySummary.execute(sales);
    return this.excelExporter.exportMonthlySales(activeSales, {
      totalUsdCents: summary.totalUsdCents,
      clientsAttended: summary.clientsAttended,
      servicesSold: summary.servicesSold,
      averageTicketCents: summary.averageTicketCents,
      salesByCategory: summary.salesByCategory,
    });
  }
}
