import { Injectable, Inject } from '@nestjs/common';
import { IProductRepository, PRODUCT_REPOSITORY, StorefrontProductFilters } from '../../../domain/products/repositories/product.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';
import { ITagRepository, TAG_REPOSITORY } from '../../../domain/products/repositories/tag.repository';
import { paginate } from '../../../interfaces/http/common/dto/pagination.dto';

@Injectable()
export class ListStorefrontProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
    @Inject(TAG_REPOSITORY) private readonly tagRepo: ITagRepository,
  ) {}

  async execute(filters: StorefrontProductFilters) {
    const { page = 1, limit = 12 } = filters;
    const { products, total } = await this.productRepo.findPublic(filters);

    const [allVariants, allTags] = await Promise.all([
      Promise.all(products.map((p) => this.variantRepo.findByProductId(p.getId()))),
      Promise.all(products.map((p) => this.tagRepo.findByProductId(p.getId()))),
    ]);

    const data = products.map((p, i) => ({
      ...p.toPersistence(),
      variants: allVariants[i].map((v) => v.toPersistence()),
      tags: allTags[i].map((t) => t.toPersistence()),
    }));

    return paginate(data, total, page, limit);
  }
}
