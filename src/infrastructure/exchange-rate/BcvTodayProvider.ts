import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { APP_CONFIG } from '@/shared/constants/config';
import { getVenezuelaTodayKey } from '@/shared/utils/date';

/**
 * Adaptador que consulta la tasa oficial BCV a traves de bcv.today.
 *
 * BCV suele publicar durante la tarde la tasa correspondiente al
 * siguiente dia habil. Por eso no basta con consultar solamente
 * rate.json: durante ese periodo podemos encontrar en history.json
 * una tasa cuya Fecha Valor sea posterior al dia calendario actual.
 *
 * Si esa tasa futura ya fue publicada por BCV Today, se utiliza
 * inmediatamente, sin esperar a medianoche.
 */
export class BcvTodayProvider implements ExchangeRateProvider {
    private readonly apiUrl = APP_CONFIG.exchangeRateApiUrl;

    async fetchCurrentRate(): Promise<ExchangeRate> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const currentData = await this.fetchJson(this.apiUrl, controller.signal);

            const currentRate = this.extractRate(currentData);
            const currentOfficialDate = this.extractOfficialDate(currentData);

            if (!currentRate || currentRate <= 0) {
                throw new Error('bcv.today devolvio un formato inesperado.');
            }

            const fetchedAt = new Date().toISOString();
            const today = getVenezuelaTodayKey();

            /**
             * Primero intentamos encontrar en el historial una nueva
             * tasa ya publicada para un dia posterior al actual.
             *
             * Esto permite que, por ejemplo:
             *
             * 23/09 - 16:20
             *     ↓
             * effective_date = 24/09
             *     ↓
             * la app use esa tasa inmediatamente.
             */
            const futureRate = await this.findFutureRate(
                today,
                controller.signal
            );

            if (futureRate) {
                return {
                    rate: futureRate.rate,
                    officialDate: futureRate.officialDate,
                    fetchedAt,
                    source: 'BCV (bcv.today)',
                    isManual: false,
                };
            }

            return {
                rate: currentRate,
                officialDate: currentOfficialDate ?? fetchedAt,
                fetchedAt,
                source: 'BCV (bcv.today)',
                isManual: false,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Consulta un JSON de BCV Today agregando un parametro unico a la URL
     * para evitar que el navegador reutilice una respuesta anterior.
     */
    private async fetchJson(
        url: string,
        signal: AbortSignal
    ): Promise<unknown> {
        const cacheBustingUrl =
            `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;

        const response = await fetch(cacheBustingUrl, {
            signal,
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(
                `bcv.today respondio con estado ${response.status}`
            );
        }

        return response.json();
    }

    /**
     * Busca en el historico la primera tasa cuya Fecha Valor sea
     * posterior al dia calendario actual.
     *
     * No asumimos que la siguiente fecha sea necesariamente mañana,
     * porque pueden existir fines de semana o dias feriados.
     */
    private async findFutureRate(
        today: string,
        signal: AbortSignal
    ): Promise<{ rate: number; officialDate: string } | null> {
        const historyUrl = `${this.apiUrl.replace(
            /\/rate\.json$/,
            '/history.json'
        )}`;

        const data = await this.fetchJson(historyUrl, signal);

        if (!Array.isArray(data)) {
            return null;
        }

        const futureRates = data
            .map((entry) => {
                const rate = this.extractRate(entry);
                const officialDate = this.extractOfficialDate(entry);

                if (
                    !rate ||
                    rate <= 0 ||
                    !officialDate ||
                    officialDate <= today
                ) {
                    return null;
                }

                return {
                    rate,
                    officialDate,
                };
            })
            .filter(
                (
                    entry
                ): entry is { rate: number; officialDate: string } =>
                    entry !== null
            );

        if (futureRates.length === 0) {
            return null;
        }

        /**
         * Si existen varias fechas futuras, tomamos la mas cercana
         * al dia actual. Esa representa la proxima Fecha Valor que
         * BCV ya haya publicado.
         */
        return futureRates.reduce((closest, candidate) =>
            candidate.officialDate < closest.officialDate
                ? candidate
                : closest
        );
    }

    private extractRate(data: unknown): number | null {
        if (!data || typeof data !== 'object') return null;

        const obj = data as Record<string, unknown>;

        if (typeof obj.USD === 'number') {
            return obj.USD;
        }

        if (typeof obj.price === 'number') {
            return obj.price;
        }

        return null;
    }

    private extractOfficialDate(data: unknown): string | null {
        if (!data || typeof data !== 'object') return null;

        const obj = data as Record<string, unknown>;

        if (typeof obj.effective_date !== 'string') {
            return null;
        }

        const date = obj.effective_date.trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return null;
        }

        return date;
    }
}