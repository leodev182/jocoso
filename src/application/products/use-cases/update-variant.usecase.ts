import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { VariantAttribute } from '../../../domain/products/entities/product-variant.entity';
import { IProductVariantRepository, PRODUCT_VARIANT_REPOSITORY } from '../../../domain/products/repositories/product-variant.repository';

export interface UpdateVariantCommand {
  variantId: string;
  price?: number;
  attributes?: VariantAttribute[];
}

@Injectable()
export class UpdateVariantUseCase {
  constructor(@Inject(PRODUCT_VARIANT_REPOSITORY) private readonly repo: IProductVariantRepository) {}

  async execute(cmd: UpdateVariantCommand): Promise<void> {
    const variant = await this.repo.findById(cmd.variantId);
    if (!variant) throw new NotFoundException(`Variant ${cmd.variantId} not found`);

    if (cmd.price !== undefined) variant.updatePrice(cmd.price);
    if (cmd.attributes !== undefined) variant.setAttributes(cmd.attributes);

    await this.repo.update(variant);
  }
}
