import { Injectable, Inject } from '@nestjs/common';
import { Product } from '../../../domain/products/entities/product.entity';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';

export interface CreateProductCommand { title: string; description?: string; }

@Injectable()
export class CreateProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repo: IProductRepository) {}

  async execute(cmd: CreateProductCommand): Promise<Product> {
    const product = Product.create(cmd.title, cmd.description);
    await this.repo.save(product);
    return product;
  }
}
