/**
 * Claves de almacenamiento centralizadas para evitar strings magicos
 * repetidos y colisiones accidentales entre repositorios.
 */
export const STORAGE_KEYS = {
  clients: 'copiado_alfonzo.clients',
  products: 'copiado_alfonzo.products',
  sales: 'copiado_alfonzo.sales',
  businessSettings: 'copiado_alfonzo.business_settings',
  themeMode: 'copiado_alfonzo.theme_mode',
  currentPeriod: 'copiado_alfonzo.current_period',
  cachedExchangeRate: 'copiado_alfonzo.cached_exchange_rate',
  manualExchangeRate: 'copiado_alfonzo.manual_exchange_rate',
  seedVersion: 'copiado_alfonzo.seed_version',
} as const;
