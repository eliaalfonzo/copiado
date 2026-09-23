import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRateCache, ManualExchangeRateRepository } from '@/domain/ports/SettingsRepository';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { DomainError } from '@/domain/errors/DomainError';
import { isRateForFutureDate } from '@/shared/utils/date';

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
 * 2. Tasa obtenida desde el proveedor (API publica, que internamente
 *    combina varias fuentes y usa la mas reciente entre ellas).
 * 3. Ultima tasa valida en cache, si el proveedor falla.
 *
 * Esto nunca rompe el flujo de venta: siempre se intenta devolver
 * alguna tasa utilizable, o se informa con un error claro si de verdad
 * no existe ninguna.
 *
 * IMPORTANTE sobre "tasa del proximo dia": el BCV suele publicar en la
 * tarde la tasa con fecha valor del SIGUIENTE dia habil, y esa tasa
 * entra en vigencia comercial de inmediato esa misma tarde. Por eso
 * `rate.rate` (el numero que se usa en TODOS los calculos de venta) se
 * usa siempre tal cual llega del proveedor, sin esperar a que el
 * calendario cambie de dia. `isNextDayRate` es solo informativo, para
 * que la interfaz pueda mostrarlo claramente al trabajador.
 */
export class GetCurrentExchangeRate {
  constructor(
    private readonly provider: ExchangeRateProvider,
    private readonly cache: ExchangeRateCache,
    private readonly manualRateRepository: ManualExchangeRateRepository
  ) { }

  async execute(): Promise<ExchangeRateResult> {
    const manualRate = await this.manualRateRepository.getManualRate();
    if (manualRate) {
      return { rate: manualRate, isStale: false };
    }

    const previousCached = await this.cache.getCachedRate();

    try {
      const fetched = await this.provider.fetchCurrentRate();
      const rate = this.enrichWithChange(fetched, previousCached);
      await this.cache.saveCachedRate(rate);
      return { rate, isStale: false };
    } catch {
      if (previousCached) {
        return { rate: previousCached, isStale: true };
      }
      throw new DomainError(
        'No pudimos obtener la tasa de cambio y no existe una tasa previa guardada. Puede fijar una tasa manual en Configuracion.'
      );
    }
  }

  /**
   * Calcula la variacion respecto a la tasa anterior conocida (la que
   * estaba en cache antes de esta consulta) y marca si la tasa nueva
   * corresponde a una fecha valor futura (BCV publico la del
   * siguiente dia habil).
   */
  private enrichWithChange(rate: ExchangeRate, previous: ExchangeRate | null): ExchangeRate {
    const isNextDayRate = isRateForFutureDate(rate.officialDate);

    if (!previous || previous.rate === rate.rate) {
      return { ...rate, isNextDayRate };
    }

    const changeAmount = rate.rate - previous.rate;
    const changePercentage = (changeAmount / previous.rate) * 100;

    return {
      ...rate,
      previousRate: previous.rate,
      changeAmount,
      changePercentage,
      isNextDayRate,
    };
  }
}