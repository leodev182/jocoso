import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  IWishlistRepository,
  WishlistItemWithProduct,
} from '../../domain/wishlist/repositories/wishlist.repository';
import { WishlistItem } from '../../domain/wishlist/entities/wishlist-item.entity';

@Injectable()
export class WishlistPrismaRepository implements IWishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<WishlistItemWithProduct[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { variants: { select: { price: true }, orderBy: { price: 'asc' }, take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      item: WishlistItem.reconstitute(row),
      product: {
        id: row.product.id,
        title: row.product.title,
        slug: row.product.slug,
        brand: row.product.brand,
        images: row.product.images,
        minPrice: row.product.variants[0] ? Number(row.product.variants[0].price) : null,
      },
    }));
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | null> {
    const row = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return row ? WishlistItem.reconstitute(row) : null;
  }

  async save(item: WishlistItem): Promise<void> {
    const data = item.toObject();
    await this.prisma.wishlistItem.create({ data });
  }

  async delete(userId: string, productId: string): Promise<void> {
    await this.prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }
}
