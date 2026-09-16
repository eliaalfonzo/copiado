import * as XLSX from 'xlsx';
import type { ExcelExporter, MonthlySummaryForExport } from '@/domain/ports/ExcelExporter';
import type { Sale } from '@/domain/entities/Sale';
import { formatDate, formatTime } from '@/shared/utils/date';

/**
 * Adaptador concreto de exportacion a Excel usando SheetJS (xlsx).
 * Encapsula el detalle de como se construyen las hojas; el resto de la
 * aplicacion solo conoce el puerto ExcelExporter.
 */
export class XlsxExporterAdapter implements ExcelExporter {
  async exportMonthlySales(sales: Sale[], summary: MonthlySummaryForExport): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    const salesRows: Record<string, string | number>[] = [];
    for (const sale of sales) {
      for (const item of sale.items) {
        salesRows.push({
          Fecha: formatDate(sale.createdAt),
          Hora: formatTime(sale.createdAt),
          Cliente: sale.clientNameSnapshot,
          Servicio: item.productNameSnapshot,
          Modalidad: item.variantNameSnapshot,
          Cantidad: item.quantity,
          'Precio unitario USD': item.unitPriceCents / 100,
          'Subtotal USD': item.subtotalCents / 100,
          'Tasa USD/Bs': sale.exchangeRateUsed,
          'Subtotal Bs': Math.round((item.subtotalCents / 100) * sale.exchangeRateUsed * 100) / 100,
        });
      }
    }

    const salesSheet = XLSX.utils.json_to_sheet(salesRows);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventas');

    const summaryRows: Record<string, string | number>[] = [
      { Indicador: 'Total de ventas (USD)', Valor: summary.totalUsdCents / 100 },
      { Indicador: 'Clientes atendidos', Valor: summary.clientsAttended },
      { Indicador: 'Servicios vendidos', Valor: summary.servicesSold },
      { Indicador: 'Ticket promedio (USD)', Valor: summary.averageTicketCents / 100 },
      { Indicador: '', Valor: '' },
      { Indicador: 'Ventas por categoria', Valor: '' },
      ...summary.salesByCategory.map((c) => ({
        Indicador: c.category,
        Valor: c.totalUsdCents / 100,
      })),
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows, { skipHeader: false });
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
