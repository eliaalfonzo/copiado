import type { BusinessSettings } from '@/domain/entities/BusinessSettings';
import type { MonthlyPeriod } from '@/domain/entities/MonthlyPeriod';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import type { ThemeMode } from '@/shared/types';

export interface SettingsRepository {
  getBusinessSettings(): Promise<BusinessSettings>;
  saveBusinessSettings(settings: BusinessSettings): Promise<void>;
  getThemeMode(): Promise<ThemeMode>;
  saveThemeMode(mode: ThemeMode): Promise<void>;
  getCurrentPeriod(): Promise<MonthlyPeriod | null>;
  saveCurrentPeriod(period: MonthlyPeriod): Promise<void>;
}

/**
 * Interfaz segregada (ISP) para el cacheo de la ultima tasa de cambio
 * valida. Se mantiene separada de SettingsRepository para no forzar a
 * quien solo necesita ajustes de negocio a implementar tambien el cache
 * de tasas.
 */
export interface ExchangeRateCache {
  getCachedRate(): Promise<ExchangeRate | null>;
  saveCachedRate(rate: ExchangeRate): Promise<void>;
}

/**
 * Interfaz segregada para la tasa manual que el trabajador puede fijar
 * cuando la API publica presenta demoras. Mientras exista una tasa
 * manual activa, tiene prioridad sobre la tasa obtenida por API.
 */
export interface ManualExchangeRateRepository {
  getManualRate(): Promise<ExchangeRate | null>;
  saveManualRate(rate: number): Promise<void>;
  clearManualRate(): Promise<void>;
}
