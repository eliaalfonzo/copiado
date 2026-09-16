export interface ExchangeRate {
  /** Valor: cuantos bolivares equivale 1 dolar. */
  rate: number;
  /**
   * Fecha/hora en que el PROVEEDOR (ej. BCV) emitio oficialmente esta
   * tasa. Puede ser distinta a `fetchedAt` (ej: un viernes por la tarde,
   * un sabado o un feriado, cuando el BCV no publica tasa nueva).
   */
  officialDate: string;
  /** Fecha/hora en que la aplicacion realizo la consulta. */
  fetchedAt: string;
  source: string;
  /** true si el trabajador fijo esta tasa manualmente. */
  isManual: boolean;
}
