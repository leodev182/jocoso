export interface IProductViewRepository {
  record(productId: string, userId?: string): Promise<void>;
  countSince(productId: string, since: Date): Promise<number>;
  topProductIds(since: Date, limit: number): Promise<Array<{ productId: string; views: number }>>;
}

export const PRODUCT_VIEW_REPOSITORY = Symbol('IProductViewRepository');
