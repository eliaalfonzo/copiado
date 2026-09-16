import { GetCurrentExchangeRate, type ExchangeRateResult } from './GetCurrentExchangeRate';

/**
 * Caso de uso explicito para el refresco manual (boton "Actualizar").
 * Se mantiene separado de GetCurrentExchangeRate para dejar clara la
 * intencion en la capa de presentacion, aunque internamente reutiliza
 * la misma logica (SRP + reutilizacion sin duplicar codigo).
 */
export class RefreshExchangeRate {
  constructor(private readonly getCurrentExchangeRate: GetCurrentExchangeRate) {}

  async execute(): Promise<ExchangeRateResult> {
    return this.getCurrentExchangeRate.execute();
  }
}
