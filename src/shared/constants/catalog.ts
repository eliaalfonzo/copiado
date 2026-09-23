/**
 * Catalogo inicial de Copiado Alfonzo. Estos valores se usan la
 * primera vez que la aplicacion se ejecuta (o cuando el trabajador usa
 * "Restablecer productos por defecto" en la seccion Productos), para
 * sembrar el almacenamiento local. A partir de ahi, todo el catalogo
 * se lee y escribe a traves de ProductRepository; ningun componente
 * debe volver a importar estas constantes para mostrar precios.
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
    // Fotografia individual (fuera de la promocion): $0.90 cada una.
    variants: [{ id: 'var_fotografias_individual', name: 'Fotografia individual', unitPriceCents: 90, active: true }],
    // La promocion es un PAQUETE fijo (tipo "foto escolar": 8 fotos en
    // una misma hoja), NO una tarifa por volumen de fotos individuales.
    // Por eso su precio no se deriva del precio unitario de arriba: al
    // seleccionar la promocion, la cantidad que se captura representa
    // cuantos PAQUETES se estan vendiendo (normalmente 1), cada uno a
    // este precio fijo, sin importar el precio de la fotografia suelta.
    promotion: {
      id: 'promo_fotos_8',
      label: '8 fotografias',
      requiredQuantity: 8,
      totalPriceCents: 70,
    },
  },
];