import { Module } from '@nestjs/common';
import { ProductDomainService } from '../../domain/products/services/product.domain.service';
import { PRODUCT_REPOSITORY } from '../../domain/products/repositories/product.repository';
import { PRODUCT_VARIANT_REPOSITORY } from '../../domain/products/repositories/product-variant.repository';
import { PRODUCT_VIEW_REPOSITORY } from '../../domain/products/repositories/product-view.repository';
import { CreateProductUseCase } from '../../application/products/use-cases/create-product.usecase';
import { CreateVariantUseCase } from '../../application/products/use-cases/create-variant.usecase';
import { GetProductUseCase } from '../../application/products/use-cases/get-product.usecase';
import { TrackProductViewUseCase } from '../../application/products/use-cases/track-product-view.usecase';
import { GetTrendingProductsUseCase } from '../../application/products/use-cases/get-trending-products.usecase';
import { ProductPrismaRepository } from '../../infrastructure/products/product.prisma-repo';
import { ProductVariantPrismaRepository } from '../../infrastructure/products/product-variant.prisma-repo';
import { ProductViewPrismaRepository } from '../../infrastructure/products/product-view.prisma-repo';
import { ProductsController } from '../../interfaces/http/products/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductDomainService,
    CreateProductUseCase,
    CreateVariantUseCase,
    GetProductUseCase,
    TrackProductViewUseCase,
    GetTrendingProductsUseCase,
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: PRODUCT_VARIANT_REPOSITORY, useClass: ProductVariantPrismaRepository },
    { provide: PRODUCT_VIEW_REPOSITORY, useClass: ProductViewPrismaRepository },
  ],
  exports: [PRODUCT_VARIANT_REPOSITORY],
})
export class ProductsModule {}
