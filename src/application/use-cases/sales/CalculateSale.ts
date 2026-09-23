import { SaleCalculator } from '@/domain/services/SaleCalculator';
import type { Product } from '@/domain/entities/Product';
import type { SaleItem } from '@/domain/entities/SaleItem';
import { Money } from '@/domain/value-objects/Money';

export interface CalculateSaleResult {
  items: SaleItem[];
  totalUsd: Money;
  totalBs: Money;
}

/**
 * Caso de uso puro de calculo (sin persistencia).
 *
 * Se utiliza mientras el trabajador arma el carrito para mostrar
 * el total en tiempo real sin necesidad de guardar la venta todavia.
 */
export class CalculateSale {
  addLine(
    product: Product,
    variantId: string,
    quantity: number,
    existingItems: SaleItem[],
    usePromotion: boolean = false
  ): SaleItem[] {
    const variant = product.variants.find(
      (v) => v.id === variantId
    );

    if (!variant) {
      throw new Error('Modalidad no encontrada');
    }

    const newItem = SaleCalculator.calculateLine(
      product,
      variant,
      quantity,
      usePromotion
    );

    return [...existingItems, newItem];
  }

  /**
   * Recalcula una linea existente.
   *
   * Si la linea fue creada como promocion, se mantiene como promocion
   * al aumentar o disminuir su cantidad.
   *
   * Si era una venta individual, continua usando el precio normal.
   */
  recalculateLine(
    product: Product,
    variantId: string,
    quantity: number,
    itemId: string,
    items: SaleItem[],
    usePromotion?: boolean
  ): SaleItem[] {
    const variant = product.variants.find(
      (v) => v.id === variantId
    );

    if (!variant) {
      throw new Error('Modalidad no encontrada');
    }

    const existingItem = items.find(
      (item) => item.id === itemId
    );

    /**
     * Si no recibimos explicitamente usePromotion, intentamos
     * conservar el tipo de venta de la linea existente.
     *
     * Esto permite que los botones + y - de una promocion
     * sigan calculando el precio promocional.
     */
    const shouldUsePromotion =
      usePromotion ??
      Boolean(existingItem?.appliedPromotionLabel);

    const updated = SaleCalculator.calculateLine(
      product,
      variant,
      quantity,
      shouldUsePromotion
    );

    return items.map((item) =>
      item.id === itemId
        ? {
          ...updated,
          id: itemId,
        }
        : item
    );
  }

  /**
   * Elimina una linea del carrito.
   */
  removeLine(
    itemId: string,
    items: SaleItem[]
  ): SaleItem[] {
    return items.filter(
      (item) => item.id !== itemId
    );
  }

  /**
   * Calcula los totales de la venta.
   */
  totals(
    items: SaleItem[],
    exchangeRate: number
  ): CalculateSaleResult {
    const totalUsd =
      SaleCalculator.calculateTotalUsd(items);

    const totalBs =
      SaleCalculator.calculateTotalBs(
        totalUsd,
        exchangeRate
      );

    return {
      items,
      totalUsd,
      totalBs,
    };
  }
}