import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { GetWishlistUseCase } from '../../application/wishlist/use-cases/get-wishlist.usecase';
import { AddToWishlistUseCase } from '../../application/wishlist/use-cases/add-to-wishlist.usecase';
import { RemoveFromWishlistUseCase } from '../../application/wishlist/use-cases/remove-from-wishlist.usecase';
import { WishlistPrismaRepository } from '../../infrastructure/wishlist/wishlist.prisma-repo';
import { WISHLIST_REPOSITORY } from '../../domain/wishlist/repositories/wishlist.repository';
import { WishlistController } from '../../interfaces/http/wishlist/wishlist.controller';

@Module({
  imports: [ProductsModule],
  controllers: [WishlistController],
  providers: [
    GetWishlistUseCase,
    AddToWishlistUseCase,
    RemoveFromWishlistUseCase,
    { provide: WISHLIST_REPOSITORY, useClass: WishlistPrismaRepository },
  ],
})
export class WishlistModule {}
