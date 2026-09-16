import type { StoragePort } from '@/domain/ports/StoragePort';
import { INITIAL_PRODUCTS } from '@/shared/constants/catalog';
import { STORAGE_KEYS } from './storageKeys';

const CURRENT_SEED_VERSION = 1;

/**
 * Siembra el catalogo inicial UNA sola vez (primera ejecucion de la
 * aplicacion en el navegador). No sobreescribe datos si el trabajador
 * ya modifico productos previamente.
 */
export async function seedInitialData(storage: StoragePort): Promise<void> {
  const seedVersion = await storage.getItem<number>(STORAGE_KEYS.seedVersion);
  if (seedVersion === CURRENT_SEED_VERSION) {
    return;
  }

  const existingProducts = await storage.getItem(STORAGE_KEYS.products);
  if (!existingProducts) {
    await storage.setItem(STORAGE_KEYS.products, INITIAL_PRODUCTS);
  }

  await storage.setItem(STORAGE_KEYS.seedVersion, CURRENT_SEED_VERSION);
}
