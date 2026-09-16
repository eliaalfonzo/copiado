import type { StoragePort } from '@/domain/ports/StoragePort';
import type { ProductRepository } from '@/domain/ports/ProductRepository';
import type { Product } from '@/domain/entities/Product';
import { STORAGE_KEYS } from './storageKeys';

export class LocalStorageProductRepository implements ProductRepository {
  constructor(private readonly storage: StoragePort) { }

  async getAll(): Promise<Product[]> {
    const products = await this.storage.getItem<Product[]>(STORAGE_KEYS.products);
    return products ?? [];
  }

  async getActive(): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter((p) => p.active);
  }

  async getById(id: string): Promise<Product | null> {
    const products = await this.getAll();
    return products.find((p) => p.id === id) ?? null;
  }

  async save(product: Product): Promise<void> {
    const products = await this.getAll();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    await this.storage.setItem(STORAGE_KEYS.products, products);
  }

  async replaceAll(products: Product[]): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.products, products);
  }
}