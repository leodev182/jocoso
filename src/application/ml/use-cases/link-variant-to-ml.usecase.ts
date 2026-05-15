import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { IncreaseStockUseCase } from '../../stock/use-cases/increase-stock.usecase';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class LinkVariantToMlUseCase {
  private readonly logger = new Logger(LinkVariantToMlUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    private readonly increaseStock: IncreaseStockUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(productId: string, variantId: string, mlVariationId: string): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (!product.getMlItemId()) throw new BadRequestException('El producto no está vinculado a MercadoLibre');

    const mlItem = await this.mlClient.getItemDetail(product.getMlItemId()!);
    const variation = mlItem.variations?.find(v => String(v.id) === mlVariationId);
    if (!variation) throw new NotFoundException(`ML variation ${mlVariationId} not found in item ${product.getMlItemId()}`);

    const pictureMap = new Map<string, string>(
      (mlItem.pictures ?? []).filter(p => p.id && p.secure_url).map(p => [p.id, p.secure_url]),
    );
    const variantImages = variation.picture_ids?.map(id => pictureMap.get(id)).filter(Boolean) as string[] ?? [];

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { mlVariationId, images: variantImages },
    });

    const quantity = variation.available_quantity ?? 0;
    this.logger.log(`Variant ${variantId}: ML variation ${mlVariationId}, quantity=${quantity}`);

    if (quantity > 0) {
      try {
        await this.increaseStock.execute({
          variantId,
          quantity,
          source: StockSource.ML,
          referenceType: ReferenceType.MANUAL,
          referenceId: product.getMlItemId()!,
        });
      } catch (err) {
        this.logger.warn(`Could not pull stock for variant ${variantId}: ${err.message}`);
      }
    }

    this.logger.log(`Variant ${variantId} linked to ML variation ${mlVariationId}`);
  }
}
