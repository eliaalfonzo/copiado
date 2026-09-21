import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { APP_CONFIG } from '@/shared/constants/config';

interface EndpointConfig {
  url: string;
  defaultSource: string;
}

/**
 * Adaptador de alta disponibilidad para la tasa de cambio oficial BCV.
 *
 * Emplea una estrategia de redundancia multi-proveedor con tolerancia a fallos:
 * 1. Proveedor primario: DolarApi Venezuela (ve.dolarapi.com/v1/dolares/oficial)
 *    - Cloudflare DYNAMIC cache (datos siempre frescos, sin stale cache).
 *    - CORS habilitado para consultas directas desde el navegador.
 *    - Respuesta tipica ultra-rapida (~200ms - 400ms).
 * 2. Respaldo 1: DolarVzla (rates.dolarvzla.com/bcv/current.json)
 * 3. Respaldo 2: JustCarlux BCV API (bcv.justcarlux.dev/api/v1/rates)
 * 4. Respaldo 3: bcv.today (JSON estático en GitHub Pages)
 *
 * Cada peticion usa `{ cache: 'no-store' }` y parametro anti-cache para evitar
 * que el navegador o proxies intermedios entreguen valores obsoletos.
 * Si un proveedor no responde en 4.5 segundos, pasa de inmediato al siguiente.
 */
export class ExchangeRateApiAdapter implements ExchangeRateProvider {
  private readonly primaryUrl = APP_CONFIG.exchangeRateApiUrl;
  private readonly fallbackUrls = APP_CONFIG.exchangeRateFallbackUrls ?? [];
  private readonly apiKey = APP_CONFIG.exchangeRateApiKey;

  async fetchCurrentRate(): Promise<ExchangeRate> {
    const endpoints = this.buildEndpointsList();
    const errors: string[] = [];

    for (const endpoint of endpoints) {
      try {
        const rate = await this.tryFetchEndpoint(endpoint);
        if (rate && rate.rate > 0) {
          return rate;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${endpoint.url}: ${message}`);
        // Continua de inmediato con el siguiente proveedor de respaldo
      }
    }

    throw new Error(
      `No se pudo obtener la tasa oficial desde ningún proveedor activo. Errores: ${errors.join(' | ')}`
    );
  }

  private buildEndpointsList(): EndpointConfig[] {
    const list: EndpointConfig[] = [
      { url: this.primaryUrl, defaultSource: 'BCV Oficial (DolarApi)' },
    ];

    for (const url of this.fallbackUrls) {
      if (!list.some((item) => item.url === url)) {
        list.push({
          url,
          defaultSource: this.guessSourceFromUrl(url),
        });
      }
    }

    return list;
  }

  private guessSourceFromUrl(url: string): string {
    if (url.includes('dolarapi')) return 'BCV Oficial (DolarApi)';
    if (url.includes('dolarvzla')) return 'BCV Oficial (DolarVzla)';
    if (url.includes('justcarlux')) return 'BCV Oficial (JustCarlux)';
    if (url.includes('bcv.today')) return 'BCV Oficial (bcv.today)';
    return 'BCV Oficial';
  }

  private async tryFetchEndpoint(endpoint: EndpointConfig): Promise<ExchangeRate> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // Agrega parametro anti-cache para obligar a una consulta fresca en vivo
      const separator = endpoint.url.includes('?') ? '&' : '?';
      const cacheBustUrl = `${endpoint.url}${separator}_t=${Date.now()}`;

      const response = await fetch(cacheBustUrl, {
        headers,
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const parsed = this.parseResponse(endpoint, data);

      if (!parsed || parsed.rate <= 0) {
        throw new Error('Estructura de respuesta inesperada o tasa <= 0');
      }

      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(endpoint: EndpointConfig, data: unknown): ExchangeRate | null {
    if (!data || typeof data !== 'object') return null;
    const nowIso = new Date().toISOString();
    const obj = data as Record<string, unknown>;

    // 1. Formato DolarApi (ve.dolarapi.com)
    // { moneda: "USD", promedio: 849.564, fechaActualizacion: "2026-09-21T00:00:00-04:00" }
    if (typeof obj.promedio === 'number' && obj.promedio > 0) {
      const officialDate = this.parseIsoDate(obj.fechaActualizacion) ?? nowIso;
      return {
        rate: obj.promedio,
        officialDate,
        fetchedAt: nowIso,
        source: 'BCV Oficial (DolarApi)',
        isManual: false,
      };
    }

    // Si viene como array (ej: /v1/dolares con oficial y paralelo)
    if (Array.isArray(data)) {
      const oficialItem = data.find(
        (it) => it && typeof it === 'object' && (it.fuente === 'oficial' || it.casa === 'oficial')
      );
      if (oficialItem && typeof oficialItem.promedio === 'number') {
        const officialDate = this.parseIsoDate(oficialItem.fechaActualizacion) ?? nowIso;
        return {
          rate: oficialItem.promedio,
          officialDate,
          fetchedAt: nowIso,
          source: 'BCV Oficial (DolarApi)',
          isManual: false,
        };
      }
    }

    // 2. Formato DolarVzla (rates.dolarvzla.com/bcv/current.json)
    // { current: { usd: 849.564, date: "2026-09-21" }, ... }
    const currentObj = obj.current as Record<string, unknown> | undefined;
    if (currentObj && typeof currentObj.usd === 'number' && currentObj.usd > 0) {
      const officialDate = this.parseIsoDate(currentObj.date) ?? nowIso;
      return {
        rate: currentObj.usd,
        officialDate,
        fetchedAt: nowIso,
        source: 'BCV Oficial (DolarVzla)',
        isManual: false,
      };
    }

    // 3. Formato JustCarlux (bcv.justcarlux.dev/api/v1/rates)
    // { rates: { usd: 849.564 }, updatedAt: 1789997330378 }
    const ratesObj = obj.rates as Record<string, unknown> | undefined;
    if (ratesObj && typeof ratesObj.usd === 'number' && ratesObj.usd > 0) {
      let officialDate = nowIso;
      if (typeof obj.updatedAt === 'number') {
        officialDate = new Date(obj.updatedAt).toISOString();
      }
      return {
        rate: ratesObj.usd,
        officialDate,
        fetchedAt: nowIso,
        source: 'BCV Oficial (JustCarlux)',
        isManual: false,
      };
    }

    // 4. Formato bcv.today
    // { USD: 849.564, effective_date: "2026-09-21" }
    if (typeof obj.USD === 'number' && obj.USD > 0) {
      const officialDate = this.parseIsoDate(obj.effective_date) ?? nowIso;
      return {
        rate: obj.USD,
        officialDate,
        fetchedAt: nowIso,
        source: 'BCV Oficial (bcv.today)',
        isManual: false,
      };
    }

    // 5. Formatos genericos anidados (monitors.bcv.price / bcv.price / price)
    const rate = this.extractGenericRate(obj);
    if (rate && rate > 0) {
      const officialDate = this.extractGenericOfficialDate(obj) ?? nowIso;
      return {
        rate,
        officialDate,
        fetchedAt: nowIso,
        source: endpoint.defaultSource,
        isManual: false,
      };
    }

    return null;
  }

  private parseIsoDate(val: unknown): string | null {
    if (!val) return null;
    if (typeof val === 'string') {
      const withTime = val.includes('T') ? val : `${val}T00:00:00`;
      const parsed = new Date(withTime);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    if (typeof val === 'number') {
      const parsed = new Date(val);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return null;
  }

  private extractGenericRate(obj: Record<string, unknown>): number | null {
    if (typeof obj.price === 'number') return obj.price;

    const bcv = this.getBcvNode(obj);
    if (bcv && typeof bcv.price === 'number') return bcv.price;
    if (bcv && typeof bcv.usd === 'number') return bcv.usd;

    return null;
  }

  private extractGenericOfficialDate(obj: Record<string, unknown>): string | null {
    if (typeof obj.date === 'string') return this.parseIsoDate(obj.date);
    if (typeof obj.last_update === 'string') return this.parseIsoDate(obj.last_update);

    const bcv = this.getBcvNode(obj);
    if (bcv && typeof bcv.last_update === 'string') return this.parseIsoDate(bcv.last_update);
    if (bcv && typeof bcv.date === 'string') return this.parseIsoDate(bcv.date);

    return null;
  }

  private getBcvNode(obj: Record<string, unknown>): Record<string, unknown> | null {
    const monitors = obj.monitors as Record<string, unknown> | undefined;
    if (monitors?.bcv && typeof monitors.bcv === 'object') {
      return monitors.bcv as Record<string, unknown>;
    }
    if (obj.bcv && typeof obj.bcv === 'object') {
      return obj.bcv as Record<string, unknown>;
    }
    return null;
  }
}