import type { StoragePort } from '@/domain/ports/StoragePort';
import type { SettingsRepository, ExchangeRateCache, ManualExchangeRateRepository } from '@/domain/ports/SettingsRepository';
import type { BusinessSettings } from '@/domain/entities/BusinessSettings';
import type { MonthlyPeriod } from '@/domain/entities/MonthlyPeriod';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import type { ThemeMode } from '@/shared/types';
import { APP_CONFIG } from '@/shared/constants/config';
import { DEFAULT_LOGO_DATA_URL } from '@/shared/assets/defaultLogo';
import { STORAGE_KEYS } from './storageKeys';

const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  name: APP_CONFIG.business.defaultName,
  email: APP_CONFIG.business.defaultEmail,
  logoDataUrl: DEFAULT_LOGO_DATA_URL,
  additionalInfo: 'Centro de Copiado',
};

export class LocalStorageSettingsRepository
  implements SettingsRepository, ExchangeRateCache, ManualExchangeRateRepository
{
  constructor(private readonly storage: StoragePort) {}

  async getBusinessSettings(): Promise<BusinessSettings> {
    const settings = await this.storage.getItem<BusinessSettings>(STORAGE_KEYS.businessSettings);
    return settings ?? DEFAULT_BUSINESS_SETTINGS;
  }

  async saveBusinessSettings(settings: BusinessSettings): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.businessSettings, settings);
  }

  async getThemeMode(): Promise<ThemeMode> {
    const mode = await this.storage.getItem<ThemeMode>(STORAGE_KEYS.themeMode);
    return mode ?? 'dark';
  }

  async saveThemeMode(mode: ThemeMode): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.themeMode, mode);
  }

  async getCurrentPeriod(): Promise<MonthlyPeriod | null> {
    return this.storage.getItem<MonthlyPeriod>(STORAGE_KEYS.currentPeriod);
  }

  async saveCurrentPeriod(period: MonthlyPeriod): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.currentPeriod, period);
  }

  async getCachedRate(): Promise<ExchangeRate | null> {
    return this.storage.getItem<ExchangeRate>(STORAGE_KEYS.cachedExchangeRate);
  }

  async saveCachedRate(rate: ExchangeRate): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.cachedExchangeRate, rate);
  }

  async getManualRate(): Promise<ExchangeRate | null> {
    return this.storage.getItem<ExchangeRate>(STORAGE_KEYS.manualExchangeRate);
  }

  async saveManualRate(rate: number): Promise<void> {
    const now = new Date().toISOString();
    const manualRate: ExchangeRate = {
      rate,
      officialDate: now,
      fetchedAt: now,
      source: 'Tasa manual fijada por el trabajador',
      isManual: true,
    };
    await this.storage.setItem(STORAGE_KEYS.manualExchangeRate, manualRate);
  }

  async clearManualRate(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEYS.manualExchangeRate);
  }
}
