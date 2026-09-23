export interface ExchangeRate {
  /** Valor: cuantos bolivares equivale 1 dolar. */
  rate: number;
  /**
   * Fecha/hora en que el PROVEEDOR (ej. BCV) emitio oficialmente esta
   * tasa (su "Fecha Valor"). El BCV suele publicar en la tarde la tasa
   * con fecha valor del SIGUIENTE dia habil; esa tasa entra en
   * vigencia comercial de inmediato esa misma tarde, aunque el
   * calendario todavia no haya cambiado de dia. Por eso esta fecha es
   * puramente informativa: el campo `rate` de arriba se usa de
   * inmediato en todos los calculos sin esperar a que el dia
   * calendario coincida con `officialDate`.
   */
  officialDate: string;
  /** Fecha/hora en que la aplicacion realizo la consulta. */
  fetchedAt: string;
  source: string;
  /** true si el trabajador fijo esta tasa manualmente. */
  isManual: boolean;
  /** Tasa vigente inmediatamente anterior a esta, si se pudo determinar. */
  previousRate?: number;
  /** Variacion porcentual respecto a `previousRate` (+/-). */
  changePercentage?: number;
  /** Variacion en bolivares respecto a `previousRate` (+/-). */
  changeAmount?: number;
  /**
   * true si `officialDate` corresponde a un dia calendario posterior
   * al dia actual en Venezuela (America/Caracas): es decir, el BCV ya
   * publico la tasa del siguiente dia habil y esta app ya la esta
   * usando, sin esperar a que el calendario cambie.
   */
  isNextDayRate?: boolean;
}