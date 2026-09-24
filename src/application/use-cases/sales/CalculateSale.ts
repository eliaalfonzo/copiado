import { SaleCalculator } from '@/domain/services/SaleCalculator';
import type { Product } from '@/domain/entities/Product';
import type { SaleItem } from '@/domain/entities/SaleItem';
import { Money } from '@/domain/value-objects/Money';

export interface CalculateSaleResult {
  items: SaleItem[];
  subtotalUsd: Money;
  discountPercentage: number;
  discountAmount: Money;
  totalUsd: Money;
  totalBs: Money;
}

export class CalculateSale {
  addLine(
    product: Product,
    variantId: string,
    quantity: number,
    existingItems: SaleItem[],
    usePromotion: boolean = false
  ): SaleItem[] {
    const variant = product.variants.find((v) => v.id === variantId);

    if (!variant) {
      throw new Error('Modalidad no encontrada');
    }

    const newItem = SaleCalculator.calculateLine(product, variant, quantity, usePromotion);

    return [...existingItems, newItem];
  }

  recalculateLine(
    product: Product,
    variantId: string,
    quantity: number,
    itemId: string,
    items: SaleItem[],
    usePromotion?: boolean
  ): SaleItem[] {
    const variant = product.variants.find((v) => v.id === variantId);

    if (!variant) {
      throw new Error('Modalidad no encontrada');
    }

    const existingItem = items.find((item) => item.id === itemId);

    const shouldUsePromotion =
      usePromotion ?? Boolean(existingItem?.appliedPromotionLabel);

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

  removeLine(itemId: string, items: SaleItem[]): SaleItem[] {
    return items.filter((item) => item.id !== itemId);
  }

  totals(
    items: SaleItem[],
    exchangeRate: number,
    discountPercentage = 0
  ): CalculateSaleResult {
    const subtotalUsd = SaleCalculator.calculateTotalUsd(items);

    const discountAmount = SaleCalculator.calculateDiscount(
      subtotalUsd,
      discountPercentage
    );

    const totalUsd = subtotalUsd.subtract(discountAmount);

    const totalBs = SaleCalculator.calculateTotalBs(totalUsd, exchangeRate);

    return {
      items,
      subtotalUsd,
      discountPercentage,
      discountAmount,
      totalUsd,
      totalBs,
    };
  }
}