import type { StoragePort } from '@/domain/ports/StoragePort';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * Unica clase de todo el proyecto que toca `window.localStorage`
 * directamente. Cualquier otra parte de la aplicacion depende de
 * StoragePort, nunca de esta clase concreta (DIP).
 */
export class LocalStorageAdapter implements StoragePort {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Datos corruptos: se ignoran en lugar de romper la aplicacion.
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new DomainError(
          'El almacenamiento local del navegador esta lleno. Elimine datos antiguos o exporte e informe al administrador.'
        );
      }
      throw new DomainError('No se pudo guardar la informacion en este dispositivo.');
    }
  }

  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }
}
