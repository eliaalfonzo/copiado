/**
 * Configuracion de entorno centralizada. Ningun otro modulo debe leer
 * import.meta.env directamente: todos deben pasar por aqui (DIP).
 */
export const APP_CONFIG = {
  exchangeRateApiUrl:
    import.meta.env.VITE_EXCHANGE_RATE_API_URL ??
    'https://ve.dolarapi.com/v1/dolares/oficial',
  exchangeRateFallbackUrls: [
    'https://rates.dolarvzla.com/bcv/current.json',
    'https://bcv.justcarlux.dev/api/v1/rates',
    'https://bcv.today/api/v1/rate.json',
  ],
  exchangeRateApiKey: import.meta.env.VITE_EXCHANGE_RATE_API_KEY ?? '',
  exchangeRateRefreshMinutes: Number(
    import.meta.env.VITE_EXCHANGE_RATE_REFRESH_MINUTES ?? 5
  ),
  business: {
    defaultName: 'Copiado Alfonzo',
    defaultEmail: 'copiadoalfonzo@gmail.com',
  },
} as const;