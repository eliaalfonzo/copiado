import { useCallback, useEffect, useState } from 'react';
import { container } from '@/infrastructure/container';
import type { Product } from '@/domain/entities/Product';
import type { CreateProductInput } from '@/application/use-cases/products/CreateProduct';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await container.listProducts.executeAll();
    setProducts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createProduct = useCallback(
    async (input: CreateProductInput) => {
      const product = await container.createProduct.execute(input);
      await reload();
      return product;
    },
    [reload]
  );

  const updateProduct = useCallback(
    async (product: Product) => {
      await container.updateProduct.execute(product);
      await reload();
    },
    [reload]
  );

  const updatePrice = useCallback(
    async (productId: string, variantId: string, newPriceCents: number) => {
      await container.updateProductPrice.execute(productId, variantId, newPriceCents);
      await reload();
    },
    [reload]
  );

  const toggleActive = useCallback(
    async (productId: string) => {
      await container.toggleProductActive.execute(productId);
      await reload();
    },
    [reload]
  );

  const resetToDefaults = useCallback(async () => {
    await container.resetProductsToDefaults.execute();
    await reload();
  }, [reload]);

  const activeProducts = products.filter((p) => p.active);

  return {
    products,
    activeProducts,
    loading,
    reload,
    createProduct,
    updateProduct,
    updatePrice,
    toggleActive,
    resetToDefaults,
  };
}