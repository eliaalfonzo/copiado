/**
 * Promocion simple basada en cantidad requerida a un precio fijo total.
 * Ejemplo: 9 fotografias por $0.70.
 * Abierta a extension (OCP): se pueden agregar nuevos tipos de promocion
 * en el futuro sin romper las promociones existentes, siempre que
 * implementen la misma forma de calculo en SaleCalculator.
 */
export interface Promotion {
  id: string;
  label: string;
  requiredQuantity: number;
  totalPriceCents: number;
}
