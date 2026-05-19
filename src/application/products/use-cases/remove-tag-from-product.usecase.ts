import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { ITagRepository, TAG_REPOSITORY } from '../../../domain/products/repositories/tag.repository';

@Injectable()
export class RemoveTagFromProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: ITagRepository,
  ) {}

  async execute(productId: string, tagId: string): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    await this.tagRepo.removeFromProduct(productId, tagId);
  }
}
