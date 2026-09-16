import type { ProductRepository } from '@/domain/ports/ProductRepository';
import { INITIAL_PRODUCTS } from '@/shared/constants/catalog';

/**
 * Restablece el catalogo de productos a los valores por defecto de
 * Copiado Alfonzo (Copias, Impresiones, Escaneos, Fotografias con su
 * promocion). Reemplaza COMPLETAMENTE el catalogo actual: cualquier
 * producto agregado manualmente, duplicado por error, o precio
 * modificado se pierde. Es una accion deliberada del trabajador
 * (siempre confirmada en la UI antes de ejecutarse), pensada para
 * corregir catalogos con errores sin depender de eliminar productos
 * uno por uno.
 *
 * IMPORTANTE: esto NO afecta ventas ya registradas, porque cada
 * SaleItem guarda su propio snapshot de nombre/precio/modalidad,
 * independiente del catalogo vigente.
 */
export class ResetProductsToDefaults {
    constructor(private readonly productRepository: ProductRepository) { }

    async execute(): Promise<void> {
        const freshDefaults = INITIAL_PRODUCTS.map((product) => ({
            ...product,
            variants: product.variants.map((variant) => ({ ...variant })),
            promotion: product.promotion ? { ...product.promotion } : null,
            createdAt: new Date().toISOString(),
        }));

        await this.productRepository.replaceAll(freshDefaults);
    }
}