import type { ProductRepository } from '@/domain/ports/ProductRepository';
import { DomainError } from '@/domain/errors/DomainError';

export class ToggleProductActive {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string): Promise<void> {
    const product = await this.productRepository.getById(productId);
    if (!product) {
      throw new DomainError('El producto no existe.');
    }
    product.active = !product.active;
    await this.productRepository.save(product);
  }
}
