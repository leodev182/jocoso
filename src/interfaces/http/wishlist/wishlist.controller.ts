import { Controller, Get, Post, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GetWishlistUseCase } from '../../../application/wishlist/use-cases/get-wishlist.usecase';
import { AddToWishlistUseCase } from '../../../application/wishlist/use-cases/add-to-wishlist.usecase';
import { RemoveFromWishlistUseCase } from '../../../application/wishlist/use-cases/remove-from-wishlist.usecase';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(
    private readonly getWishlist: GetWishlistUseCase,
    private readonly addToWishlist: AddToWishlistUseCase,
    private readonly removeFromWishlist: RemoveFromWishlistUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.getWishlist.execute(user.id);
  }

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  add(@CurrentUser() user: { id: string }, @Param('productId') productId: string) {
    return this.addToWishlist.execute(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: { id: string }, @Param('productId') productId: string) {
    return this.removeFromWishlist.execute(user.id, productId);
  }
}
