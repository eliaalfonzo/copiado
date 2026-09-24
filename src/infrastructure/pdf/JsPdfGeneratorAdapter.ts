import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PdfGenerator, MonthlyReportData } from '@/domain/ports/PdfGenerator';
import type { Sale } from '@/domain/entities/Sale';
import type { BusinessSettings } from '@/domain/entities/BusinessSettings';
import { formatDate, formatTime, formatDateTime } from '@/shared/utils/date';

const BRAND_FUCHSIA: [number, number, number] = [255, 20, 147];
const DARK_TEXT: [number, number, number] = [30, 20, 28];
const GRAY_TEXT: [number, number, number] = [110, 95, 105];

const HEADER_MARGIN_X = 40;
const HEADER_TOP_Y = 46;
const LOGO_MAX_HEIGHT = 40;
const LOGO_MAX_WIDTH = 190;
const HEADER_TEXT_GAP = 14;

function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBs(cents: number): string {
  return `Bs. ${(cents / 100).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Detecta el formato de imagen (PNG/JPEG/WEBP) a partir del data URL, para pasarselo correctamente a jsPDF. */
function getImageFormat(dataUrl: string): string {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);/.exec(dataUrl);
  const type = match?.[1]?.toUpperCase() ?? 'PNG';
  if (type === 'JPG') return 'JPEG';
  return type;
}

/**
 * Adaptador concreto de generacion de PDF usando jsPDF + autotable.
 * Ninguna otra parte de la aplicacion sabe que se usa jsPDF: todo pasa
 * por el puerto PdfGenerator.
 */
export class JsPdfGeneratorAdapter implements PdfGenerator {
  async generateInvoice(sale: Sale, business: BusinessSettings): Promise<Blob> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = HEADER_MARGIN_X;

    let cursorY = this.drawHeader(doc, business, marginX, HEADER_TOP_Y);
    cursorY += 26;

    if (sale.status === 'cancelled') {
      doc.setFontSize(46);
      doc.setTextColor(255, 77, 103);
      doc.text('ANULADA', 300, 400, { angle: 30, align: 'center' });
    }

    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(11);
    doc.text(`Cliente: ${sale.clientNameSnapshot}`, marginX, cursorY);
    doc.text(`Fecha: ${formatDate(sale.createdAt)}`, 380, cursorY);
    cursorY += 16;
    doc.text(`Comprobante: ${sale.id}`, marginX, cursorY);
    doc.text(`Hora: ${formatTime(sale.createdAt)}`, 380, cursorY);
    cursorY += 20;

    autoTable(doc, {
      startY: cursorY,
      head: [['Servicio', 'Modalidad', 'Cant.', 'Precio Unit.', 'Total']],
      body: sale.items.map((item) => [
        item.productNameSnapshot + (item.appliedPromotionLabel ? ` (Promo)` : ''),
        item.variantNameSnapshot,
        String(item.quantity),
        formatUsd(item.unitPriceCents),
        formatUsd(item.subtotalCents),
      ]),
      headStyles: { fillColor: BRAND_FUCHSIA, textColor: [255, 255, 255] },
      styles: { fontSize: 10, textColor: DARK_TEXT },
      alternateRowStyles: { fillColor: [250, 240, 247] },
      margin: { left: marginX, right: marginX },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
    const discountAmountCents = sale.discountAmountCents ?? 0;
    const hasDiscount = discountAmountCents > 0;

    let labelY = finalY;
    doc.setFontSize(12);
    doc.setTextColor(...GRAY_TEXT);

    if (hasDiscount) {
      doc.text('SUBTOTAL', marginX, labelY);
      doc.setFontSize(12);
      doc.setTextColor(...DARK_TEXT);
      doc.text(formatUsd(sale.subtotalUsdCents ?? sale.totalUsdCents), 220, labelY);
      labelY += 18;

      doc.setTextColor(...GRAY_TEXT);
      doc.text(`DESCUENTO (${sale.discountPercentage ?? 0}%)`, marginX, labelY);
      doc.setTextColor(...BRAND_FUCHSIA);
      doc.text(`-${formatUsd(discountAmountCents)}`, 220, labelY);
      labelY += 18;
      doc.setTextColor(...GRAY_TEXT);
    }

    doc.text('TOTAL USD', marginX, labelY);
    doc.text('TASA UTILIZADA', marginX, labelY + 18);
    doc.text('TOTAL Bs', marginX, labelY + 36);

    doc.setFontSize(14);
    doc.setTextColor(...BRAND_FUCHSIA);
    doc.text(formatUsd(sale.totalUsdCents), 220, labelY);
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(12);
    doc.text(`Bs. ${sale.exchangeRateUsed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}/USD`, 220, labelY + 18);
    doc.setFontSize(14);
    doc.setTextColor(...BRAND_FUCHSIA);
    doc.text(formatBs(sale.totalBsCents), 220, labelY + 36);

    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text('Gracias por preferir Copiado Alfonzo.', marginX, 780);

    return doc.output('blob');
  }

  async generateMonthlyReport(data: MonthlyReportData, business: BusinessSettings): Promise<Blob> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = HEADER_MARGIN_X;

    let cursorY = this.drawHeader(doc, business, marginX, HEADER_TOP_Y);
    cursorY += 22;

    doc.setFontSize(16);
    doc.setTextColor(...DARK_TEXT);
    doc.text(`Reporte mensual - ${data.periodLabel}`, marginX, cursorY);
    cursorY += 18;
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`Generado: ${formatDateTime(data.generatedAt)}`, marginX, cursorY);
    cursorY += 24;

    const summaryRows: [string, string][] = [
      ['Total vendido (USD)', formatUsd(data.totalUsdCents)],
      ['Total vendido (Bs)', formatBs(data.totalBsCents)],
      ['Cantidad de ventas', String(data.salesCount)],
      ['Clientes atendidos', String(data.clientsAttended)],
      ['Servicios vendidos', String(data.servicesSold)],
      ['Ticket promedio', formatUsd(data.averageTicketCents)],
    ];

    autoTable(doc, {
      startY: cursorY,
      head: [['Indicador', 'Valor']],
      body: summaryRows,
      headStyles: { fillColor: BRAND_FUCHSIA, textColor: [255, 255, 255] },
      styles: { fontSize: 10, textColor: DARK_TEXT },
      margin: { left: marginX, right: marginX },
      tableWidth: 300,
    });

    let afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

    doc.setFontSize(12);
    doc.setTextColor(...DARK_TEXT);
    doc.text('Ventas por categoria', marginX, afterY);
    afterY += 8;

    autoTable(doc, {
      startY: afterY,
      head: [['Categoria', 'Total USD']],
      body: data.salesByCategory.map((c) => [c.category, formatUsd(c.totalUsdCents)]),
      headStyles: { fillColor: [255, 77, 184], textColor: [255, 255, 255] },
      styles: { fontSize: 9, textColor: DARK_TEXT },
      margin: { left: marginX, right: marginX },
      tableWidth: 300,
    });

    doc.addPage();
    let pageCursorY = 50;
    doc.setFontSize(13);
    doc.setTextColor(...DARK_TEXT);
    doc.text('Detalle de ventas del periodo', marginX, pageCursorY);
    pageCursorY += 12;

    autoTable(doc, {
      startY: pageCursorY,
      head: [['Fecha', 'Cliente', 'Items', 'Total USD', 'Total Bs']],
      body: data.sales.map((sale) => [
        `${formatDate(sale.createdAt)} ${formatTime(sale.createdAt)}`,
        sale.clientNameSnapshot,
        String(sale.items.reduce((sum, i) => sum + i.quantity, 0)),
        formatUsd(sale.totalUsdCents),
        formatBs(sale.totalBsCents),
      ]),
      headStyles: { fillColor: BRAND_FUCHSIA, textColor: [255, 255, 255] },
      styles: { fontSize: 8, textColor: DARK_TEXT },
      alternateRowStyles: { fillColor: [250, 240, 247] },
      margin: { left: marginX, right: marginX },
    });

    return doc.output('blob');
  }

  /**
   * Dibuja el encabezado (logo + datos del negocio) y devuelve la
   * posicion Y donde termina el bloque, para que el contenido
   * siguiente nunca se superponga con el logo.
   *
   * El logo se dibuja respetando SIEMPRE su proporcion original
   * (ancho/alto reales de la imagen, obtenidos con
   * doc.getImageProperties), nunca forzado a un cuadro fijo: eso es lo
   * que antes lo deformaba/aplastaba. El nombre del negocio se coloca
   * DEBAJO del logo (no al lado), porque el logo de Copiado Alfonzo es
   * panoramico y ponerlo al lado del texto lo apretaria demasiado.
   */
  private drawHeader(doc: jsPDF, business: BusinessSettings, marginX: number, y: number): number {
    let cursorY = y;

    if (business.logoDataUrl) {
      try {
        const format = getImageFormat(business.logoDataUrl);
        const props = doc.getImageProperties(business.logoDataUrl);
        const naturalRatio = props.width / props.height;

        let drawHeight = LOGO_MAX_HEIGHT;
        let drawWidth = drawHeight * naturalRatio;
        if (drawWidth > LOGO_MAX_WIDTH) {
          drawWidth = LOGO_MAX_WIDTH;
          drawHeight = drawWidth / naturalRatio;
        }

        doc.addImage(business.logoDataUrl, format, marginX, cursorY, drawWidth, drawHeight);
        cursorY += drawHeight + HEADER_TEXT_GAP;
      } catch {
        // Si el logo no puede dibujarse (formato no soportado), se omite
        // silenciosamente en lugar de romper la generacion del PDF.
      }
    }

    doc.setFontSize(13);
    doc.setTextColor(...BRAND_FUCHSIA);
    doc.text(business.name.toUpperCase(), marginX, cursorY);
    cursorY += 14;
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(business.additionalInfo ?? 'Centro de Copiado', marginX, cursorY);
    cursorY += 12;
    doc.text(business.email, marginX, cursorY);

    return cursorY;
  }
}