import { useCallback, useEffect, useState } from 'react';
import { container } from '@/infrastructure/container';
import type { BusinessSettings } from '@/domain/entities/BusinessSettings';

export function useSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const current = await container.getBusinessSettings.execute();
    setSettings(current);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateSettings = useCallback(
    async (newSettings: BusinessSettings) => {
      await container.updateBusinessSettings.execute(newSettings);
      await reload();
    },
    [reload]
  );

  return { settings, loading, updateSettings, reload };
}