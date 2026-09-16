import type { ManualExchangeRateRepository } from '@/domain/ports/SettingsRepository';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * Permite al trabajador fijar (o quitar) una tasa manual cuando la API
 * publica de tasa de cambio presenta demoras o esta fuera de servicio.
 * Mientras la tasa manual este activa, tiene prioridad sobre la API
 * (ver GetCurrentExchangeRate).
 */
export class SetManualExchangeRate {
  constructor(private readonly manualRateRepository: ManualExchangeRateRepository) {}

  async setRate(rate: number): Promise<void> {
    if (!rate || rate <= 0) {
      throw new DomainError('La tasa manual debe ser un numero mayor a cero.');
    }
    await this.manualRateRepository.saveManualRate(rate);
  }

  async clearRate(): Promise<void> {
    await this.manualRateRepository.clearManualRate();
  }
}
