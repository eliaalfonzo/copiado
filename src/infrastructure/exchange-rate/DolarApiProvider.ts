import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { APP_CONFIG } from '@/shared/constants/config';
import { getVenezuelaTodayKey } from '@/shared/utils/date';

/**
 * Adaptador para consultar el Dolar Oficial de Venezuela
 * a traves de DolarApi.com.
 *
 * DolarApi utiliza al BCV como fuente de datos para el
 * Dolar Oficial.
 *
 * Ademas de consultar la cotizacion actual, se consulta
 * el historico para detectar cuando el BCV ya publico
 * durante la tarde la tasa correspondiente al siguiente
 * dia habil.
 *
 * Ejemplo:
 *
 * Hoy: 23/09/2026
 *
 * Cotizacion actual:
 * 853.4993 - Fecha: 23/09/2026
 *
 * Historico:
 * 854.4637 - Fecha: 24/09/2026
 *
 * En ese caso se utiliza inmediatamente 854.4637,
 * sin esperar a que cambie el dia calendario.
 */
export class DolarApiProvider implements ExchangeRateProvider {
    private readonly apiUrl = APP_CONFIG.exchangeRateApiUrlFallback2;

    async fetchCurrentRate(): Promise<ExchangeRate> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const currentData = await this.fetchJson(
                this.apiUrl,
                controller.signal
            );

            if (
                !currentData ||
                typeof currentData !== 'object'
            ) {
                throw new Error(
                    'dolarapi.com devolvio un formato inesperado.'
                );
            }

            const currentObj = currentData as Record<string, unknown>;

            const currentRate =
                typeof currentObj.promedio === 'number'
                    ? currentObj.promedio
                    : null;

            if (!currentRate || currentRate <= 0) {
                throw new Error(
                    'dolarapi.com devolvio un formato inesperado.'
                );
            }

            const fetchedAt = new Date().toISOString();
            const today = getVenezuelaTodayKey();

            /**
             * Buscamos si DolarApi ya tiene publicada
             * una tasa con Fecha Valor posterior a hoy.
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
                    source: 'BCV (dolarapi.com)',
                    isManual: false,
                };
            }

            /**
             * Si todavia no existe una tasa futura,
             * utilizamos la cotizacion actual.
             */
            const currentOfficialDate =
                this.extractOfficialDate(currentObj) ?? fetchedAt;

            return {
                rate: currentRate,
                officialDate: currentOfficialDate,
                fetchedAt,
                source: 'BCV (dolarapi.com)',
                isManual: false,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Consulta un endpoint JSON evitando que el navegador
     * reutilice una respuesta cacheada.
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
                `dolarapi.com respondio con estado ${response.status}`
            );
        }

        return response.json();
    }

    /**
     * Busca en el historico de DolarApi una tasa cuyo
     * Fecha Valor sea posterior al dia actual en Venezuela.
     *
     * Si existen varias fechas futuras, toma la mas cercana.
     *
     * Ejemplo:
     *
     * Hoy = 2026-09-23
     *
     * 2026-09-24 -> 854.4637
     *
     * Se devuelve 2026-09-24.
     */
    private async findFutureRate(
        today: string,
        signal: AbortSignal
    ): Promise<{ rate: number; officialDate: string } | null> {
        const historyUrl =
            'https://ve.dolarapi.com/v1/historicos/dolares/oficial';

        const data = await this.fetchJson(historyUrl, signal);

        if (!Array.isArray(data)) {
            return null;
        }

        const futureRates = data
            .map((entry) => {
                if (!entry || typeof entry !== 'object') {
                    return null;
                }

                const obj = entry as Record<string, unknown>;

                const rate =
                    typeof obj.promedio === 'number'
                        ? obj.promedio
                        : null;

                const officialDate =
                    typeof obj.fecha === 'string'
                        ? obj.fecha.trim()
                        : null;

                if (
                    !rate ||
                    rate <= 0 ||
                    !officialDate ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(officialDate) ||
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
                ): entry is {
                    rate: number;
                    officialDate: string;
                } => entry !== null
            );

        if (futureRates.length === 0) {
            return null;
        }

        /**
         * Si por alguna razon existen varias fechas futuras,
         * tomamos la mas cercana al dia actual.
         */
        return futureRates.reduce((closest, candidate) =>
            candidate.officialDate < closest.officialDate
                ? candidate
                : closest
        );
    }

    /**
     * Extrae la fecha de actualizacion de la cotizacion actual.
     */
    private extractOfficialDate(
        obj: Record<string, unknown>
    ): string | null {
        if (typeof obj.fechaActualizacion !== 'string') {
            return null;
        }

        const parsed = new Date(obj.fechaActualizacion);

        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed.toISOString();
    }
}