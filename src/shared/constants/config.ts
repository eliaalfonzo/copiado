/**
 * Configuracion de entorno centralizada. Ningun otro modulo debe leer
 * import.meta.env directamente: todos deben pasar por aqui (DIP).
 */
export const APP_CONFIG = {
  exchangeRateApiUrl:
    import.meta.env.VITE_EXCHANGE_RATE_API_URL ??
    'https://bcv.today/api/v1/rate.json',
  exchangeRateApiUrlFallback:
    import.meta.env.VITE_EXCHANGE_RATE_API_URL_FALLBACK ??
    'https://pydolarve.org/api/v2/dollar?page=bcv',
  exchangeRateApiUrlFallback2:
    import.meta.env.VITE_EXCHANGE_RATE_API_URL_FALLBACK_2 ??
    'https://ve.dolarapi.com/v1/dolares/oficial',
  exchangeRateApiKey: import.meta.env.VITE_EXCHANGE_RATE_API_KEY ?? '',
  exchangeRateRefreshMinutes: Number(
    import.meta.env.VITE_EXCHANGE_RATE_REFRESH_MINUTES ?? 10
  ),
  business: {
    defaultName: 'Copiado Alfonzo',
    defaultEmail: 'copiadoalfonzo@gmail.com',
  },
} as const;