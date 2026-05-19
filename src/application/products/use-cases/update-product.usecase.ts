import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '../../../domain/products/entities/product.entity';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';

export interface UpdateProductCommand {
  id: string;
  title?: string;
  slug?: string;
  description?: string;
  brand?: string;
  status?: ProductStatus;
  featured?: boolean;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repo: IProductRepository) {}

  async execute(cmd: UpdateProductCommand): Promise<void> {
    const product = await this.repo.findById(cmd.id);
    if (!product) throw new NotFoundException(`Product ${cmd.id} not found`);

    if (cmd.title !== undefined) product.updateTitle(cmd.title);
    if (cmd.slug !== undefined) product.updateSlug(cmd.slug || null);
    if (cmd.description !== undefined) product.updateDescription(cmd.description || null);
    if (cmd.brand !== undefined) product.updateBrand(cmd.brand || null);
    if (cmd.status !== undefined) product.updateStatus(cmd.status);
    if (cmd.featured !== undefined) product.setFeatured(cmd.featured);

    await this.repo.update(product);
  }
}
