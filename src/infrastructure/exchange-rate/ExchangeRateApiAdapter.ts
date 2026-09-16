import type { ExchangeRateProvider } from '@/domain/ports/ExchangeRateProvider';
import type { ExchangeRate } from '@/domain/entities/ExchangeRate';
import { APP_CONFIG } from '@/shared/constants/config';

/**
 * Adaptador concreto que consulta la tasa oficial BCV a traves de
 * bcv.today (https://github.com/grupoclip/bcv-api), un JSON estatico
 * publicado en GitHub Pages que se actualiza cada 30 minutos.
 *
 * Se eligio este proveedor en lugar de otras APIs de terceros porque:
 * 1. Es un archivo JSON estatico servido por GitHub Pages, por lo que
 *    permite peticiones directas desde el navegador sin bloqueos de
 *    CORS (a diferencia de varias APIs dinamicas que SI bloquean el
 *    origen del navegador y provocan que la app se quede "sin datos").
 * 2. Expone `effective_date`: la fecha en que la tasa es oficialmente
 *    valida segun el propio BCV, ya resuelta para fines de semana y
 *    feriados (si hoy es domingo, `effective_date` apunta al ultimo
 *    dia habil, tal como corresponde).
 *
 * Este adaptador es la UNICA parte de la aplicacion que conoce la forma
 * exacta de esta respuesta. Cambiar de proveedor en el futuro solo
 * implica reescribir esta clase (o crear otra que implemente
 * ExchangeRateProvider) sin tocar dominio, casos de uso ni UI.
 *
 * Nota de seguridad: este proveedor es publico y no requiere clave.
 * Si en el futuro se integra un proveedor que exija una clave privada,
 * esa clave NO debe colocarse en variables VITE_*, ya que quedarian
 * expuestas en el bundle del navegador. En ese caso se necesitaria un
 * pequeno servicio intermedio (proxy) que guarde la clave del lado del
 * servidor.
 */
export class ExchangeRateApiAdapter implements ExchangeRateProvider {
  private readonly apiUrl = APP_CONFIG.exchangeRateApiUrl;
  private readonly apiKey = APP_CONFIG.exchangeRateApiKey;

  async fetchCurrentRate(): Promise<ExchangeRate> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.apiUrl, { headers, signal: controller.signal });

      if (!response.ok) {
        throw new Error(`La API de tasa de cambio respondio con estado ${response.status}`);
      }

      const data = await response.json();
      const rate = this.extractRate(data);
      const officialDate = this.extractOfficialDate(data);

      if (!rate || rate <= 0) {
        throw new Error('La API de tasa de cambio devolvio un formato inesperado.');
      }

      const fetchedAt = new Date().toISOString();

      return {
        rate,
        officialDate: officialDate ?? fetchedAt,
        fetchedAt,
        source: 'BCV (bcv.today)',
        isManual: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Soporta tanto la forma actual de bcv.today ({ USD: number, ... })
   * como formatos anidados alternativos (monitors.bcv.price / bcv.price
   * / price), por si se cambia de proveedor mas adelante sin reescribir
   * este metodo desde cero.
   */
  private extractRate(data: unknown): number | null {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;

    if (typeof obj.USD === 'number') return obj.USD;
    if (typeof obj.price === 'number') return obj.price;

    const bcv = this.getBcvNode(data);
    if (bcv && typeof bcv.price === 'number') return bcv.price;

    return null;
  }

  /**
   * Extrae la fecha en que la tasa es oficialmente valida. bcv.today ya
   * resuelve fines de semana/feriados en `effective_date` (fecha, sin
   * hora); si no viene, se intenta `last_update` (formato de otros
   * proveedores, con fecha y hora completa).
   */
  private extractOfficialDate(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;

    if (typeof obj.effective_date === 'string') {
      const parsed = new Date(`${obj.effective_date}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    const bcv = this.getBcvNode(data);
    const rawDate = bcv?.last_update;
    if (typeof rawDate === 'string') {
      const parsed = new Date(rawDate);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    return null;
  }

  private getBcvNode(data: unknown): Record<string, unknown> | null {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;

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