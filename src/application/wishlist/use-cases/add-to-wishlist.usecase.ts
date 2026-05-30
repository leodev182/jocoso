import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IWishlistRepository, WISHLIST_REPOSITORY } from '../../../domain/wishlist/repositories/wishlist.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { WishlistItem } from '../../../domain/wishlist/entities/wishlist-item.entity';

@Injectable()
export class AddToWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlistRepo: IWishlistRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const existing = await this.wishlistRepo.findByUserAndProduct(userId, productId);
    if (existing) throw new ConflictException('Product already in wishlist');

    await this.wishlistRepo.save(WishlistItem.create(userId, productId));
  }
}
