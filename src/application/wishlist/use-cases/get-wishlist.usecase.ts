import { Injectable, Inject } from '@nestjs/common';
import { IWishlistRepository, WISHLIST_REPOSITORY, WishlistItemWithProduct } from '../../../domain/wishlist/repositories/wishlist.repository';

@Injectable()
export class GetWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlistRepo: IWishlistRepository,
  ) {}

  async execute(userId: string): Promise<WishlistItemWithProduct[]> {
    return this.wishlistRepo.findByUserId(userId);
  }
}
