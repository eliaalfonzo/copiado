import { useCallback, useEffect, useRef, useState } from 'react';
import { container } from '@/infrastructure/container';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import type { ExchangeRateStatus } from '@/shared/types';
import { APP_CONFIG } from '@/shared/constants/config';
import { DomainError } from '@/domain/errors/DomainError';

interface UseExchangeRateResult {
  rate: ExchangeRate | null;
  status: ExchangeRateStatus;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  setManualRate: (value: number) => Promise<void>;
  clearManualRate: () => Promise<void>;
  savingManualRate: boolean;
}

/**
 * Hook de presentacion que orquesta el caso de uso de tasa de cambio:
 * la consulta al iniciar, el refresco automatico periodico, el
 * refresco manual y la posibilidad de fijar/quitar una tasa manual
 * personalizada. No contiene logica de negocio: solo coordina.
 */
export function useExchangeRate(): UseExchangeRateResult {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [status, setStatus] = useState<ExchangeRateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingManualRate, setSavingManualRate] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await container.getCurrentExchangeRate.execute();
      setRate(result.rate);
      setStatus(result.rate.isManual ? 'manual' : result.isStale ? 'stale' : 'updated');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof DomainError ? error.userMessage : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    void load();
    const minutes = APP_CONFIG.exchangeRateRefreshMinutes;
    intervalRef.current = setInterval(() => {
      void load();
    }, Math.max(1, minutes) * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const setManualRate = useCallback(
    async (value: number) => {
      setSavingManualRate(true);
      try {
        await container.setManualExchangeRate.setRate(value);
        await load();
      } finally {
        setSavingManualRate(false);
      }
    },
    [load]
  );

  const clearManualRate = useCallback(async () => {
    setSavingManualRate(true);
    try {
      await container.setManualExchangeRate.clearRate();
      await load();
    } finally {
      setSavingManualRate(false);
    }
  }, [load]);

  return { rate, status, errorMessage, refresh: load, setManualRate, clearManualRate, savingManualRate };
}
