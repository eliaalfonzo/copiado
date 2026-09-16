import type { ProductRepository } from '@/domain/ports/ProductRepository';
import type { Product } from '@/domain/entities/Product';

export class ListProducts {
  constructor(private readonly productRepository: ProductRepository) {}

  async executeAll(): Promise<Product[]> {
    return this.productRepository.getAll();
  }

  async executeActive(): Promise<Product[]> {
    return this.productRepository.getActive();
  }
}
