import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRateCache, ManualExchangeRateRepository } from '@/domain/ports/SettingsRepository';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { DomainError } from '@/domain/errors/DomainError';

export interface ExchangeRateResult {
  rate: ExchangeRate;
  isStale: boolean;
}

/**
 * Obtiene la tasa de cambio a utilizar, con el siguiente orden de
 * prioridad:
 *
 * 1. Tasa MANUAL activa (fijada por el trabajador cuando la API publica
 *    presenta demoras). Tiene prioridad absoluta mientras exista.
 * 2. Tasa obtenida desde el proveedor (API publica).
 * 3. Ultima tasa valida en cache, si el proveedor falla.
 *
 * Esto nunca rompe el flujo de venta: siempre se intenta devolver
 * alguna tasa utilizable, o se informa con un error claro si de verdad
 * no existe ninguna.
 */
export class GetCurrentExchangeRate {
  constructor(
    private readonly provider: ExchangeRateProvider,
    private readonly cache: ExchangeRateCache,
    private readonly manualRateRepository: ManualExchangeRateRepository
  ) {}

  async execute(): Promise<ExchangeRateResult> {
    const manualRate = await this.manualRateRepository.getManualRate();
    if (manualRate) {
      return { rate: manualRate, isStale: false };
    }

    try {
      const rate = await this.provider.fetchCurrentRate();
      await this.cache.saveCachedRate(rate);
      return { rate, isStale: false };
    } catch {
      const cached = await this.cache.getCachedRate();
      if (cached) {
        return { rate: cached, isStale: true };
      }
      throw new DomainError(
        'No pudimos obtener la tasa de cambio y no existe una tasa previa guardada. Puede fijar una tasa manual en Configuracion.'
      );
    }
  }
}
