import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IProductViewRepository } from '../../domain/products/repositories/product-view.repository';

@Injectable()
export class ProductViewPrismaRepository implements IProductViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(productId: string, userId?: string): Promise<void> {
    await this.prisma.productView.create({
      data: { productId, userId: userId ?? null },
    });
  }

  async countSince(productId: string, since: Date): Promise<number> {
    return this.prisma.productView.count({
      where: { productId, viewedAt: { gte: since } },
    });
  }

  async topProductIds(since: Date, limit: number): Promise<Array<{ productId: string; views: number }>> {
    const rows = await this.prisma.productView.groupBy({
      by: ['productId'],
      where: { viewedAt: { gte: since } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    return rows.map((r) => ({ productId: r.productId, views: r._count.productId }));
  }
}
