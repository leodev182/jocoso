import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IWishlistRepository, WISHLIST_REPOSITORY } from '../../../domain/wishlist/repositories/wishlist.repository';

@Injectable()
export class RemoveFromWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlistRepo: IWishlistRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    const existing = await this.wishlistRepo.findByUserAndProduct(userId, productId);
    if (!existing) throw new NotFoundException('Product not in wishlist');

    await this.wishlistRepo.delete(userId, productId);
  }
}
