import { Module } from '@nestjs/common';
import { ProductDomainService } from '../../domain/products/services/product.domain.service';
import { PRODUCT_REPOSITORY } from '../../domain/products/repositories/product.repository';
import { PRODUCT_VARIANT_REPOSITORY } from '../../domain/products/repositories/product-variant.repository';
import { PRODUCT_VIEW_REPOSITORY } from '../../domain/products/repositories/product-view.repository';
import { TAG_REPOSITORY } from '../../domain/products/repositories/tag.repository';
import { CreateProductUseCase } from '../../application/products/use-cases/create-product.usecase';
import { CreateVariantUseCase } from '../../application/products/use-cases/create-variant.usecase';
import { GetProductUseCase } from '../../application/products/use-cases/get-product.usecase';
import { TrackProductViewUseCase } from '../../application/products/use-cases/track-product-view.usecase';
import { GetTrendingProductsUseCase } from '../../application/products/use-cases/get-trending-products.usecase';
import { DeleteProductUseCase } from '../../application/products/use-cases/delete-product.usecase';
import { DeleteVariantUseCase } from '../../application/products/use-cases/delete-variant.usecase';
import { UpdateVariantUseCase } from '../../application/products/use-cases/update-variant.usecase';
import { UpdateProductUseCase } from '../../application/products/use-cases/update-product.usecase';
import { CreateTagUseCase } from '../../application/products/use-cases/create-tag.usecase';
import { ListTagsUseCase } from '../../application/products/use-cases/list-tags.usecase';
import { DeleteTagUseCase } from '../../application/products/use-cases/delete-tag.usecase';
import { AddTagToProductUseCase } from '../../application/products/use-cases/add-tag-to-product.usecase';
import { RemoveTagFromProductUseCase } from '../../application/products/use-cases/remove-tag-from-product.usecase';
import { ListStorefrontProductsUseCase } from '../../application/products/use-cases/list-storefront-products.usecase';
import { ProductPrismaRepository } from '../../infrastructure/products/product.prisma-repo';
import { ProductVariantPrismaRepository } from '../../infrastructure/products/product-variant.prisma-repo';
import { ProductViewPrismaRepository } from '../../infrastructure/products/product-view.prisma-repo';
import { TagPrismaRepository } from '../../infrastructure/products/tag.prisma-repo';
import { ProductsController } from '../../interfaces/http/products/products.controller';
import { TagsController } from '../../interfaces/http/tags/tags.controller';

@Module({
  controllers: [ProductsController, TagsController],
  providers: [
    ProductDomainService,
    CreateProductUseCase,
    CreateVariantUseCase,
    GetProductUseCase,
    TrackProductViewUseCase,
    GetTrendingProductsUseCase,
    DeleteProductUseCase,
    DeleteVariantUseCase,
    UpdateVariantUseCase,
    UpdateProductUseCase,
    CreateTagUseCase,
    ListTagsUseCase,
    DeleteTagUseCase,
    AddTagToProductUseCase,
    RemoveTagFromProductUseCase,
    ListStorefrontProductsUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: PRODUCT_VARIANT_REPOSITORY, useClass: ProductVariantPrismaRepository },
    { provide: PRODUCT_VIEW_REPOSITORY, useClass: ProductViewPrismaRepository },
    { provide: TAG_REPOSITORY, useClass: TagPrismaRepository },
  ],
  exports: [PRODUCT_REPOSITORY, PRODUCT_VARIANT_REPOSITORY, TAG_REPOSITORY],
})
export class ProductsModule {}
