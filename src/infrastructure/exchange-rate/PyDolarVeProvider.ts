import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { APP_CONFIG } from '@/shared/constants/config';

/**
 * Adaptador de RESPALDO que consulta la tasa oficial BCV a traves de
 * pydolarve.org (proyecto pyDolarVenezuela). Se usa en conjunto con
 * BcvTodayProvider (ver CompositeExchangeRateProvider): si una de las
 * dos fuentes aun no detecto la publicacion mas reciente del BCV
 * (cada fuente depende de su propio robot/horario de actualizacion),
 * la otra puede que si, y la app usa automaticamente la mas nueva.
 *
 * Al igual que en BcvTodayProvider, NO se agregan cabeceras
 * personalizadas (Cache-Control, Pragma, etc.) para no arriesgar un
 * bloqueo por verificacion CORS; el anti-cache se logra solo con un
 * parametro unico en la URL.
 */
export class PyDolarVeProvider implements ExchangeRateProvider {
    private readonly apiUrl = APP_CONFIG.exchangeRateApiUrlFallback;

    async fetchCurrentRate(): Promise<ExchangeRate> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const cacheBustingUrl = `${this.apiUrl}${this.apiUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;

            const response = await fetch(cacheBustingUrl, {
                signal: controller.signal,
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`pydolarve.org respondio con estado ${response.status}`);
            }

            const data = await response.json();
            const bcv = this.getBcvNode(data);
            const rate = bcv && typeof bcv.price === 'number' ? bcv.price : null;

            if (!rate || rate <= 0) {
                throw new Error('pydolarve.org devolvio un formato inesperado.');
            }

            const fetchedAt = new Date().toISOString();
            const officialDate = this.extractOfficialDate(bcv) ?? fetchedAt;

            return {
                rate,
                officialDate,
                fetchedAt,
                source: 'BCV (pydolarve.org)',
                isManual: false,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    private getBcvNode(data: unknown): Record<string, unknown> | null {
        if (!data || typeof data !== 'object') return null;
        const obj = data as Record<string, unknown>;
        const monitors = obj.monitors as Record<string, unknown> | undefined;
        if (monitors?.bcv && typeof monitors.bcv === 'object') {
            return monitors.bcv as Record<string, unknown>;
        }
        if (obj.bcv && typeof obj.bcv === 'object') {
            return obj.bcv as Record<string, unknown>;
        }
        return null;
    }

    private extractOfficialDate(bcv: Record<string, unknown> | null): string | null {
        const rawDate = bcv?.last_update;
        if (typeof rawDate !== 'string') return null;
        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString();
    }
}