import type { ProductRepository } from '@/domain/ports/ProductRepository';
import { DomainError } from '@/domain/errors/DomainError';

export class UpdateProductPrice {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string, variantId: string, newPriceCents: number): Promise<void> {
    if (newPriceCents < 0) {
      throw new DomainError('El precio no puede ser negativo.');
    }
    const product = await this.productRepository.getById(productId);
    if (!product) {
      throw new DomainError('El producto no existe.');
    }
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new DomainError('La modalidad de producto no existe.');
    }
    variant.unitPriceCents = newPriceCents;
    await this.productRepository.save(product);
  }
}
