import type { SettingsRepository } from '@/domain/ports/SettingsRepository';
import type { BusinessSettings } from '@/domain/entities/BusinessSettings';
import { DomainError } from '@/domain/errors/DomainError';

export class UpdateBusinessSettings {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(settings: BusinessSettings): Promise<void> {
    if (!settings.name.trim()) {
      throw new DomainError('El nombre del negocio es obligatorio.');
    }
    await this.settingsRepository.saveBusinessSettings(settings);
  }
}
