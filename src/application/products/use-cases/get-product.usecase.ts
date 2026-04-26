import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
  ) {}

  async getById(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    const variants = await this.variantRepo.findByProductId(id);
    return { ...product.toPersistence(), variants: variants.map((v) => v.toPersistence()) };
  }

  async listAll(status?: string, page = 1, limit = 20) {
    const { products, total } = await this.productRepo.findAll(status, page, limit);
    return {
      data: products.map((p) => p.toPersistence()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
