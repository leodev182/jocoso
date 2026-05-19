import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { ITagRepository, TAG_REPOSITORY } from '../../../domain/products/repositories/tag.repository';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: ITagRepository,
  ) {}

  async getById(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    const [variants, tags] = await Promise.all([
      this.variantRepo.findByProductId(id),
      this.tagRepo.findByProductId(id),
    ]);
    return {
      ...product.toPersistence(),
      variants: variants.map((v) => v.toPersistence()),
      tags: tags.map((t) => t.toPersistence()),
    };
  }

  async listAll(status?: string, page = 1, limit = 20, search?: string) {
    const { products, total } = await this.productRepo.findAll(status, page, limit, search);
    const [allVariants, allTags] = await Promise.all([
      Promise.all(products.map((p) => this.variantRepo.findByProductId(p.getId()))),
      Promise.all(products.map((p) => this.tagRepo.findByProductId(p.getId()))),
    ]);
    return {
      data: products.map((p, i) => ({
        ...p.toPersistence(),
        variants: allVariants[i].map((v) => v.toPersistence()),
        tags: allTags[i].map((t) => t.toPersistence()),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
