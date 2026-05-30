import { WishlistItem } from '../entities/wishlist-item.entity';

export interface WishlistProductSnapshot {
  id: string;
  title: string;
  slug: string | null;
  brand: string | null;
  images: string[];
  minPrice: number | null;
}

export interface WishlistItemWithProduct {
  item: WishlistItem;
  product: WishlistProductSnapshot;
}

export interface IWishlistRepository {
  findByUserId(userId: string): Promise<WishlistItemWithProduct[]>;
  findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | null>;
  save(item: WishlistItem): Promise<void>;
  delete(userId: string, productId: string): Promise<void>;
}

export const WISHLIST_REPOSITORY = 'WISHLIST_REPOSITORY';
