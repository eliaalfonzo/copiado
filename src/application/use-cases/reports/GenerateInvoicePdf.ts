import type { PdfGenerator } from '@/domain/ports/PdfGenerator';
import type { SettingsRepository } from '@/domain/ports/SettingsRepository';
import type { Sale } from '@/domain/entities/Sale';

export class GenerateInvoicePdf {
  constructor(
    private readonly pdfGenerator: PdfGenerator,
    private readonly settingsRepository: SettingsRepository
  ) {}

  async execute(sale: Sale): Promise<Blob> {
    const business = await this.settingsRepository.getBusinessSettings();
    return this.pdfGenerator.generateInvoice(sale, business);
  }
}
