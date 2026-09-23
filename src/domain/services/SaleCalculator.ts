import { Money } from '@/domain/value-objects/Money';
import type { Product } from '@/domain/entities/Product';
import type { ProductVariant } from '@/domain/entities/ProductVariant';
import type { SaleItem } from '@/domain/entities/SaleItem';
import { generateId } from '@/shared/utils/id';
import { DomainError } from '@/domain/errors/DomainError';

/**
 * Servicio de dominio responsable UNICAMENTE del calculo de una linea
 * de venta (SRP).
 *
 * No sabe nada de almacenamiento, PDF, Excel ni React.
 *
 * Las promociones se aplican EXPLICITAMENTE cuando el usuario selecciona
 * la modalidad promocional.
 */
export class SaleCalculator {
  static calculateLine(
    product: Product,
    variant: ProductVariant,
    quantity: number,
    usePromotion: boolean = false
  ): SaleItem {
    if (quantity <= 0) {
      throw new DomainError('La cantidad debe ser mayor a cero.');
    }

    if (!variant.active) {
      throw new DomainError(
        'Esta modalidad no esta disponible actualmente.'
      );
    }

    const promotion = product.promotion;

    /**
     * PROMOCION
     * La promocion solo se aplica si el usuario la selecciono
     * explicitamente.
     *
     * La cantidad representa cuantos paquetes promocionales
     * se estan vendiendo.
     */
    if (usePromotion) {
      if (!promotion || promotion.totalPriceCents <= 0) {
        throw new DomainError(
          'La promocion seleccionada no esta disponible.'
        );
      }

      const subtotal = Money.fromCents(
        promotion.totalPriceCents
      ).multiply(quantity);

      return {
        id: generateId('item'),
        productId: product.id,
        productNameSnapshot: product.name,
        variantId: variant.id,
        variantNameSnapshot: promotion.label,
        quantity,
        unitPriceCents: promotion.totalPriceCents,
        subtotalCents: subtotal.valueInCents,
        appliedPromotionLabel: promotion.label,
      };
    }

    const subtotal = Money.fromCents(
      variant.unitPriceCents
    ).multiply(quantity);

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

  /**
   * Calcula el total de la venta en dolares.
   */
  static calculateTotalUsd(items: SaleItem[]): Money {
    return items.reduce(
      (total, item) =>
        total.add(Money.fromCents(item.subtotalCents)),
      Money.zero()
    );
  }

  /**
   * Calcula el total de la venta en bolivares
   * utilizando la tasa de cambio recibida.
   */
  static calculateTotalBs(
    totalUsd: Money,
    exchangeRate: number
  ): Money {
    return totalUsd.toBolivares(exchangeRate);
  }
}