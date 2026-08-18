import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class UnlinkProductFromMlUseCase {
  private readonly logger = new Logger(UnlinkProductFromMlUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(productId: string): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    product.assignMlItemId('');
    // assignMlItemId con string vacío no sirve — usamos Prisma directo
    await this.prisma.product.update({
      where: { id: productId },
      data: { mlItemId: null },
    });

    await this.prisma.productVariant.updateMany({
      where: { productId },
      data: { mlVariationId: null },
    });
    await this.prisma.mlListing.deleteMany({ where: { productId } });

    this.logger.log(`Product ${productId} unlinked from ML`);
  }
}
