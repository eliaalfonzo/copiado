/**
 * Linea de una venta. Guarda "snapshots" (copias congeladas) del nombre
 * del producto y de la variante/modalidad en el momento de la venta, asi
 * como el precio unitario utilizado. De esta forma, si el catalogo
 * cambia en el futuro, las ventas historicas no se ven afectadas.
 */
export interface SaleItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  variantId: string;
  variantNameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  appliedPromotionLabel?: string;
}
