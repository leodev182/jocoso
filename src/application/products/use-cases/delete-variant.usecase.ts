import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';

@Injectable()
export class DeleteVariantUseCase {
  constructor(@Inject(PRODUCT_VARIANT_REPOSITORY) private readonly repo: IProductVariantRepository) {}

  async execute(variantId: string): Promise<void> {
    const variant = await this.repo.findById(variantId);
    if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);
    await this.repo.delete(variantId);
  }
}
