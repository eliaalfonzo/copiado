import type { SettingsRepository } from '@/domain/ports/SettingsRepository';
import type { BusinessSettings } from '@/domain/entities/BusinessSettings';

export class GetBusinessSettings {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(): Promise<BusinessSettings> {
    return this.settingsRepository.getBusinessSettings();
  }
}
