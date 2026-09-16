/**
 * Catalogo inicial de Copiado Alfonzo. Estos valores se usan UNICAMENTE
 * la primera vez que la aplicacion se ejecuta, para sembrar el
 * almacenamiento local. A partir de ahi, todo el catalogo se lee y
 * escribe a traves de ProductRepository; ningun componente debe volver
 * a importar estas constantes para mostrar precios.
 */
import type { Product } from '@/domain/entities/Product';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_copias',
    name: 'Copias',
    category: 'copias',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [
      { id: 'var_copias_bn', name: 'Blanco y Negro', unitPriceCents: 15, active: true },
      { id: 'var_copias_color', name: 'A Color', unitPriceCents: 25, active: true },
    ],
    promotion: null,
  },
  {
    id: 'prod_impresiones',
    name: 'Impresiones',
    category: 'impresiones',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [
      { id: 'var_impresiones_bn', name: 'Blanco y Negro', unitPriceCents: 25, active: true },
      { id: 'var_impresiones_color', name: 'A Color', unitPriceCents: 40, active: true },
    ],
    promotion: null,
  },
  {
    id: 'prod_escaneos',
    name: 'Escaneos',
    category: 'escaneos',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [{ id: 'var_escaneos_unico', name: 'Estandar', unitPriceCents: 20, active: true }],
    promotion: null,
  },
  {
    id: 'prod_fotografias',
    name: 'Fotografias',
    category: 'fotografias',
    active: true,
    createdAt: new Date().toISOString(),
    variants: [{ id: 'var_fotografias_unico', name: 'Estandar', unitPriceCents: 0, active: true }],
    promotion: {
      id: 'promo_fotos_9',
      label: '9 fotografias',
      requiredQuantity: 9,
      totalPriceCents: 70,
    },
  },
];
