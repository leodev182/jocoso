import { Injectable, Inject } from '@nestjs/common';
import { IProductViewRepository, PRODUCT_VIEW_REPOSITORY } from '../../../domain/products/repositories/product-view.repository';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

@Injectable()
export class GetTrendingProductsUseCase {
  constructor(
    @Inject(PRODUCT_VIEW_REPOSITORY) private readonly viewRepo: IProductViewRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async execute(period: string = '7d', limit: number = 10) {
    const days = PERIOD_DAYS[period] ?? 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const topIds = await this.viewRepo.topProductIds(since, limit);

    const products = await Promise.all(
      topIds.map(async ({ productId, views }) => {
        const product = await this.productRepo.findById(productId);
        if (!product) return null;
        return { ...product.toPersistence(), views };
      }),
    );

    return products.filter(Boolean);
  }
}
