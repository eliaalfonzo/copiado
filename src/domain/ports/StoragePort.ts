/**
 * Puerto de almacenamiento generico. Ninguna otra capa debe usar
 * localStorage/IndexedDB directamente: todo pasa por esta interfaz,
 * lo que permite sustituir el adaptador (DIP + LSP) sin tocar
 * repositorios ni casos de uso.
 */
export interface StoragePort {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}
