import { ProductVariant } from '../entities/product-variant.entity';

export interface IProductVariantRepository {
  findById(id: string): Promise<ProductVariant | null>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  save(variant: ProductVariant): Promise<void>;
  update(variant: ProductVariant): Promise<void>;
  delete(id: string): Promise<void>;
}

export const PRODUCT_VARIANT_REPOSITORY = Symbol('IProductVariantRepository');
