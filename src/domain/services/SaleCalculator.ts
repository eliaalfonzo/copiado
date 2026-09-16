import { Money } from '@/domain/value-objects/Money';
import type { Product } from '@/domain/entities/Product';
import type { ProductVariant } from '@/domain/entities/ProductVariant';
import type { SaleItem } from '@/domain/entities/SaleItem';
import { generateId } from '@/shared/utils/id';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * Servicio de dominio responsable UNICAMENTE del calculo de una linea
 * de venta (SRP). No sabe nada de almacenamiento, PDF, Excel ni React.
 *
 * Si el producto tiene una promocion activa y la cantidad solicitada es
 * multiplo de la cantidad requerida por la promocion, se aplica el
 * precio promocional; el resto de unidades (si las hay) se cobra al
 * precio unitario normal de la variante.
 */
export class SaleCalculator {
  static calculateLine(product: Product, variant: ProductVariant, quantity: number): SaleItem {
    if (quantity <= 0) {
      throw new DomainError('La cantidad debe ser mayor a cero.');
    }
    if (!variant.active) {
      throw new DomainError('Esta modalidad no esta disponible actualmente.');
    }

    const promotion = product.promotion;

    if (promotion && promotion.requiredQuantity > 0) {
      const promoUnits = Math.floor(quantity / promotion.requiredQuantity);
      const remainderUnits = quantity % promotion.requiredQuantity;

      if (promoUnits > 0) {
        const promoTotal = Money.fromCents(promotion.totalPriceCents).multiply(promoUnits);
        const remainderTotal = Money.fromCents(variant.unitPriceCents).multiply(remainderUnits);
        const subtotal = promoTotal.add(remainderTotal);

        return {
          id: generateId('item'),
          productId: product.id,
          productNameSnapshot: product.name,
          variantId: variant.id,
          variantNameSnapshot: variant.name,
          quantity,
          unitPriceCents: variant.unitPriceCents,
          subtotalCents: subtotal.valueInCents,
          appliedPromotionLabel: promotion.label,
        };
      }
    }

    const subtotal = Money.fromCents(variant.unitPriceCents).multiply(quantity);

    return {
      id: generateId('item'),
      productId: product.id,
      productNameSnapshot: product.name,
      variantId: variant.id,
      variantNameSnapshot: variant.name,
      quantity,
      unitPriceCents: variant.unitPriceCents,
      subtotalCents: subtotal.valueInCents,
    };
  }

  static calculateTotalUsd(items: SaleItem[]): Money {
    return items.reduce(
      (total, item) => total.add(Money.fromCents(item.subtotalCents)),
      Money.zero()
    );
  }

  static calculateTotalBs(totalUsd: Money, exchangeRate: number): Money {
    return totalUsd.toBolivares(exchangeRate);
  }
}
