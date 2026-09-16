import type { ProductVariant } from './ProductVariant';
import type { Promotion } from './Promotion';

export interface Product {
  id: string;
  name: string;
  category: string;
  variants: ProductVariant[];
  promotion: Promotion | null;
  active: boolean;
  createdAt: string;
}
