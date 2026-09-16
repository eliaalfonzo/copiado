import { useCallback, useEffect, useState } from 'react';
import { container } from '@/infrastructure/container';
import type { PeriodCheckResult } from '@/application/use-cases/period/CloseMonthlyPeriod';

/**
 * Detecta si comenzo un nuevo mes calendario y expone la informacion
 * necesaria para que la UI (por ejemplo, el Dashboard) ofrezca cerrar
 * el periodo anterior de forma segura antes de continuar operando.
 */
export function useMonthlyPeriod() {
  const [check, setCheck] = useState<PeriodCheckResult | null>(null);

  const reload = useCallback(async () => {
    const result = await container.closeMonthlyPeriod.checkForNewPeriod();
    setCheck(result);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const closeAndAdvance = useCallback(
    async (previousPeriodKey: string, newPeriodKey: string) => {
      await container.closeMonthlyPeriod.closeAndAdvance(previousPeriodKey, newPeriodKey);
      await reload();
    },
    [reload]
  );

  return { check, closeAndAdvance, reload };
}
