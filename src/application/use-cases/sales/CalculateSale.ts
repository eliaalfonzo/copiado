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
 * Caso de uso puro de calculo (sin persistencia). Se utiliza mientras
 * el trabajador arma el carrito, para poder mostrar el total en tiempo
 * real sin necesidad de guardar nada todavia.
 */
export class CalculateSale {
  addLine(product: Product, variantId: string, quantity: number, existingItems: SaleItem[]): SaleItem[] {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error('Modalidad no encontrada');
    }
    const newItem = SaleCalculator.calculateLine(product, variant, quantity);
    return [...existingItems, newItem];
  }

  recalculateLine(product: Product, variantId: string, quantity: number, itemId: string, items: SaleItem[]): SaleItem[] {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error('Modalidad no encontrada');
    }
    const updated = SaleCalculator.calculateLine(product, variant, quantity);
    return items.map((item) => (item.id === itemId ? { ...updated, id: itemId } : item));
  }

  removeLine(itemId: string, items: SaleItem[]): SaleItem[] {
    return items.filter((item) => item.id !== itemId);
  }

  totals(items: SaleItem[], exchangeRate: number): CalculateSaleResult {
    const totalUsd = SaleCalculator.calculateTotalUsd(items);
    const totalBs = SaleCalculator.calculateTotalBs(totalUsd, exchangeRate);
    return { items, totalUsd, totalBs };
  }
}
