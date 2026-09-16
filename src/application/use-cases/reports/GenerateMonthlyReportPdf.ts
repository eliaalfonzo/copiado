import type { PdfGenerator } from '@/domain/ports/PdfGenerator';
import type { SettingsRepository } from '@/domain/ports/SettingsRepository';
import type { Sale } from '@/domain/entities/Sale';
import { GetMonthlySummary } from '@/application/use-cases/sales/GetMonthlySummary';
import { getMonthlyPeriodLabel } from '@/shared/utils/date';
import { DomainError } from '@/domain/errors/DomainError';

export class GenerateMonthlyReportPdf {
  constructor(
    private readonly pdfGenerator: PdfGenerator,
    private readonly settingsRepository: SettingsRepository,
    private readonly getMonthlySummary: GetMonthlySummary = new GetMonthlySummary()
  ) {}

  async execute(periodKey: string, sales: Sale[]): Promise<Blob> {
    const activeSales = sales.filter((s) => s.status !== 'cancelled');
    if (activeSales.length === 0) {
      throw new DomainError('No hay ventas registradas en este periodo para generar un reporte.');
    }
    const business = await this.settingsRepository.getBusinessSettings();
    const summary = this.getMonthlySummary.execute(sales);

    return this.pdfGenerator.generateMonthlyReport(
      {
        periodLabel: getMonthlyPeriodLabel(periodKey),
        generatedAt: new Date().toISOString(),
        totalUsdCents: summary.totalUsdCents,
        totalBsCents: summary.totalBsCents,
        salesCount: summary.salesCount,
        clientsAttended: summary.clientsAttended,
        servicesSold: summary.servicesSold,
        averageTicketCents: summary.averageTicketCents,
        salesByCategory: summary.salesByCategory,
        salesByDay: summary.salesByDay,
        sales: activeSales,
      },
      business
    );
  }
}
