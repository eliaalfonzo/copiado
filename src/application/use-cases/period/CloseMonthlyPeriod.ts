import type { SaleRepository } from '@/domain/ports/SaleRepository';
import type { SettingsRepository } from '@/domain/ports/SettingsRepository';
import type { MonthlyPeriod } from '@/domain/entities/MonthlyPeriod';
import { getMonthlyPeriodKey, getMonthlyPeriodLabel } from '@/shared/utils/date';

export interface PeriodCheckResult {
  needsClosing: boolean;
  previousPeriod: MonthlyPeriod | null;
  currentPeriodKey: string;
  hasPendingSales: boolean;
}

/**
 * Gestiona la transicion segura entre periodos mensuales.
 *
 * IMPORTANTE: nunca se limpia todo el almacenamiento local. Solo se
 * archivan/eliminan las ventas asociadas al periodo cerrado. Clientes,
 * productos, precios, configuracion, logo y tema permanecen intactos.
 */
export class CloseMonthlyPeriod {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly settingsRepository: SettingsRepository
  ) {}

  async checkForNewPeriod(): Promise<PeriodCheckResult> {
    const currentPeriodKey = getMonthlyPeriodKey(new Date());
    const storedPeriod = await this.settingsRepository.getCurrentPeriod();

    if (!storedPeriod) {
      await this.settingsRepository.saveCurrentPeriod({
        key: currentPeriodKey,
        label: getMonthlyPeriodLabel(currentPeriodKey),
        closed: false,
      });
      return {
        needsClosing: false,
        previousPeriod: null,
        currentPeriodKey,
        hasPendingSales: false,
      };
    }

    if (storedPeriod.key === currentPeriodKey) {
      return {
        needsClosing: false,
        previousPeriod: storedPeriod,
        currentPeriodKey,
        hasPendingSales: false,
      };
    }

    const pendingSales = await this.saleRepository.getByPeriod(storedPeriod.key);
    return {
      needsClosing: true,
      previousPeriod: storedPeriod,
      currentPeriodKey,
      hasPendingSales: pendingSales.length > 0,
    };
  }

  /**
   * Cierra formalmente el periodo anterior (marcandolo como cerrado) y
   * elimina unicamente sus ventas del almacenamiento operativo activo,
   * asumiendo que ya fueron exportadas/respaldadas por el trabajador.
   */
  async closeAndAdvance(previousPeriodKey: string, newPeriodKey: string): Promise<void> {
    await this.saleRepository.archiveAndClearPeriod(previousPeriodKey);
    await this.settingsRepository.saveCurrentPeriod({
      key: newPeriodKey,
      label: getMonthlyPeriodLabel(newPeriodKey),
      closed: false,
    });
  }
}
