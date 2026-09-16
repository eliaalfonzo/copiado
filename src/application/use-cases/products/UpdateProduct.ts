import type { ProductRepository } from '@/domain/ports/ProductRepository';
import type { Product } from '@/domain/entities/Product';
import { DomainError } from '@/domain/errors/DomainError';

export class UpdateProduct {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(product: Product): Promise<void> {
    const existing = await this.productRepository.getById(product.id);
    if (!existing) {
      throw new DomainError('El producto que intenta editar no existe.');
    }
    if (!product.name.trim()) {
      throw new DomainError('El nombre del producto es obligatorio.');
    }
    await this.productRepository.save(product);
  }
}
