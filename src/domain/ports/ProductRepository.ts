import type { Product } from '@/domain/entities/Product';

export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getActive(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  /** Reemplaza el catalogo completo. Se usa para restablecer los productos por defecto. */
  replaceAll(products: Product[]): Promise<void>;
}