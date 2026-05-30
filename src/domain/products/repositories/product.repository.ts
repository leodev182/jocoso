import { Product } from '../entities/product.entity';

export interface StorefrontProductFilters {
  featured?: boolean;
  tagSlug?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(status?: string, page?: number, limit?: number, search?: string): Promise<{ products: Product[]; total: number }>;
  findPublic(filters: StorefrontProductFilters): Promise<{ products: Product[]; total: number }>;
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
