import type { ProductRepository } from '@/domain/ports/ProductRepository';
import type { Product } from '@/domain/entities/Product';
import type { ProductVariant } from '@/domain/entities/ProductVariant';
import type { Promotion } from '@/domain/entities/Promotion';
import { generateId } from '@/shared/utils/id';
import { DomainError } from '@/domain/errors/DomainError';

export interface CreateProductInput {
  name: string;
  category: string;
  variants: Omit<ProductVariant, 'id' | 'active'>[];
  promotion?: Omit<Promotion, 'id'> | null;
}

export class CreateProduct {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    if (!input.name.trim()) {
      throw new DomainError('El nombre del producto es obligatorio.');
    }
    if (input.variants.length === 0) {
      throw new DomainError('El producto debe tener al menos una modalidad de precio.');
    }
    if (input.variants.some((v) => v.unitPriceCents < 0)) {
      throw new DomainError('El precio no puede ser negativo.');
    }

    const product: Product = {
      id: generateId('prod'),
      name: input.name.trim(),
      category: input.category.trim() || 'general',
      active: true,
      createdAt: new Date().toISOString(),
      variants: input.variants.map((v) => ({
        id: generateId('var'),
        name: v.name,
        unitPriceCents: v.unitPriceCents,
        active: true,
      })),
      promotion: input.promotion
        ? { id: generateId('promo'), ...input.promotion }
        : null,
    };

    await this.productRepository.save(product);
    return product;
  }
}
