import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductVariant, VariantAttribute } from '../../../domain/products/entities/product-variant.entity';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';

export interface CreateVariantCommand {
  productId: string;
  sku: string;
  price: number;
  attributes?: VariantAttribute[];
}

@Injectable()
export class CreateVariantUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variantRepo: IProductVariantRepository,
  ) {}

  async execute(cmd: CreateVariantCommand): Promise<ProductVariant> {
    const product = await this.productRepo.findById(cmd.productId);
    if (!product) throw new NotFoundException(`Product ${cmd.productId} not found`);

    const existing = await this.variantRepo.findBySku(cmd.sku);
    if (existing) throw new ConflictException(`SKU ${cmd.sku} already exists`);

    const variant = ProductVariant.create(cmd.productId, cmd.sku, cmd.price, cmd.attributes);
    await this.variantRepo.save(variant);
    return variant;
  }
}
