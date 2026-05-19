import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '../../../domain/products/entities/product.entity';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';

export interface UpdateProductCommand {
  id: string;
  title?: string;
  description?: string;
  status?: ProductStatus;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repo: IProductRepository) {}

  async execute(cmd: UpdateProductCommand): Promise<void> {
    const product = await this.repo.findById(cmd.id);
    if (!product) throw new NotFoundException(`Product ${cmd.id} not found`);

    if (cmd.title !== undefined) product.updateTitle(cmd.title);
    if (cmd.description !== undefined) product.updateDescription(cmd.description || null);
    if (cmd.status !== undefined) product.updateStatus(cmd.status);

    await this.repo.update(product);
  }
}
