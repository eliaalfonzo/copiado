import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { container } from '@/infrastructure/container';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import type { ExchangeRateStatus } from '@/shared/types';
import { APP_CONFIG } from '@/shared/constants/config';
import { DomainError } from '@/domain/errors/DomainError';

export interface ExchangeRateContextValue {
  rate: ExchangeRate | null;
  status: ExchangeRateStatus;
  errorMessage: string | null;
  savingManualRate: boolean;
  lastChecked: Date | null;
  refresh: () => Promise<void>;
  setManualRate: (value: number) => Promise<void>;
  clearManualRate: () => Promise<void>;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue | null>(null);

/**
 * Determina si la hora actual en Venezuela (UTC-4) corresponde a la ventana crítica
 * de publicación de la nueva tasa del BCV (lunes a viernes de 4:00 PM a 6:30 PM).
 */
function isBcvUpdateWindow(): boolean {
  try {
    const now = new Date();
    // Obtener la hora actual en la zona horaria de Venezuela
    const vzlaFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Caracas',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short',
    });
    const parts = vzlaFormatter.formatToParts(now);
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const hourPart = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minutePart = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);

    const isWeekday = !['Sat', 'Sun'].includes(weekdayPart);
    const totalMinutes = hourPart * 60 + minutePart;
    // 16:00 = 960 min, 18:30 = 1110 min
    return isWeekday && totalMinutes >= 960 && totalMinutes <= 1110;
  } catch {
    // Si Intl falla por alguna razon, usar hora local
    const now = new Date();
    const day = now.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const hour = now.getHours();
    return isWeekday && hour >= 16 && hour <= 18;
  }
}

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [status, setStatus] = useState<ExchangeRateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingManualRate, setSavingManualRate] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const isFetchingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await container.getCurrentExchangeRate.execute();
      setRate(result.rate);
      setStatus(result.rate.isManual ? 'manual' : result.isStale ? 'stale' : 'updated');
      setLastChecked(new Date());
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof DomainError ? error.userMessage : 'Error al obtener la tasa de cambio');
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Carga inicial y configuracion del intervalo inteligente
  useEffect(() => {
    void load();

    const setupTimer = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Durante la tarde (4pm a 6:30pm Venezuela) el BCV actualiza la tasa: verificamos cada 2 minutos.
      // Fuera de esa ventana, verificamos cada APP_CONFIG.exchangeRateRefreshMinutes (5 min).
      const inUpdateWindow = isBcvUpdateWindow();
      const intervalMinutes = inUpdateWindow ? 2 : Math.max(1, APP_CONFIG.exchangeRateRefreshMinutes);
      const intervalMs = intervalMinutes * 60 * 1000;

      intervalRef.current = setInterval(() => {
        void load();
      }, intervalMs);
    };

    setupTimer();

    // Revisa si entramos o salimos de la ventana crítica cada 15 minutos
    const checkWindowInterval = setInterval(setupTimer, 15 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(checkWindowInterval);
    };
  }, [load]);

  // Revalida automaticamente al recuperar el foco o visibilidad si pasaron mas de 2 minutos
  useEffect(() => {
    const handleRevalidate = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const last = lastChecked ? lastChecked.getTime() : 0;
        // Si hace mas de 2 minutos que no se actualiza, refrescar en segundo plano
        if (now - last > 2 * 60 * 1000) {
          void load();
        }
      }
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, [lastChecked, load]);

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

  const value = useMemo(
    () => ({
      rate,
      status,
      errorMessage,
      savingManualRate,
      lastChecked,
      refresh: load,
      setManualRate,
      clearManualRate,
    }),
    [rate, status, errorMessage, savingManualRate, lastChecked, load, setManualRate, clearManualRate]
  );

  return <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>;
}

export function useExchangeRate(): ExchangeRateContextValue {
  const context = useContext(ExchangeRateContext);
  if (!context) {
    throw new Error('useExchangeRate debe usarse dentro de ExchangeRateProvider');
  }
  return context;
}
