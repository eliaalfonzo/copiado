import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';

/**
 * Combina varios proveedores de tasa de cambio.
 *
 * Cada proveedor consulta una fuente de datos del BCV.
 *
 * La aplicacion selecciona la tasa cuya Fecha Valor oficial
 * sea mas reciente.
 *
 * Esto es importante porque el BCV puede publicar durante
 * la tarde la tasa correspondiente al siguiente dia habil.
 *
 * Ejemplo:
 *
 * BCV Today:
 * 853.4993 -> 23/09
 *
 * DolarApi:
 * 854.4637 -> 24/09
 *
 * Se selecciona DolarApi porque tiene una Fecha Valor
 * posterior y ya representa la nueva tasa oficial publicada.
 */
export class CompositeExchangeRateProvider
    implements ExchangeRateProvider {
    constructor(
        private readonly providers: ExchangeRateProvider[]
    ) { }

    async fetchCurrentRate(): Promise<ExchangeRate> {
        const results = await Promise.allSettled(
            this.providers.map((provider) =>
                provider.fetchCurrentRate()
            )
        );

        const successful = results
            .filter(
                (
                    result
                ): result is PromiseFulfilledResult<ExchangeRate> =>
                    result.status === 'fulfilled'
            )
            .map((result) => result.value);

        if (successful.length === 0) {
            const firstError = results.find(
                (
                    result
                ): result is PromiseRejectedResult =>
                    result.status === 'rejected'
            );

            throw new Error(
                firstError instanceof Object &&
                    'reason' in firstError
                    ? String(firstError.reason)
                    : 'Todas las fuentes de tasa de cambio fallaron.'
            );
        }

        /**
         * Seleccionamos la tasa cuya Fecha Valor sea
         * la mas reciente.
         *
         * No utilizamos fetchedAt porque una consulta mas
         * reciente no significa necesariamente que la tasa
         * oficial sea mas nueva.
         *
         * La fecha importante es officialDate.
         */
        return successful.reduce((latest, candidate) => {
            const latestDate =
                latest.officialDate.slice(0, 10);

            const candidateDate =
                candidate.officialDate.slice(0, 10);

            return candidateDate > latestDate
                ? candidate
                : latest;
        });
    }
}