import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { IProductRepository, PRODUCT_REPOSITORY } from '../../../domain/products/repositories/product.repository';
import { IncreaseStockUseCase } from '../../stock/use-cases/increase-stock.usecase';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface VariantMapping {
  localVariantId: string;
  mlVariationId?: string | null;
}

export interface LinkProductToMlCommand {
  productId: string;
  mlItemId: string;
  variantMappings: VariantMapping[];
}

@Injectable()
export class LinkProductToMlUseCase {
  private readonly logger = new Logger(LinkProductToMlUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    private readonly increaseStock: IncreaseStockUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(cmd: LinkProductToMlCommand): Promise<void> {
    const product = await this.productRepo.findById(cmd.productId);
    if (!product) throw new NotFoundException(`Product ${cmd.productId} not found`);

    const mlItem = await this.mlClient.getItemDetail(cmd.mlItemId);

    product.assignMlItemId(cmd.mlItemId);
    const images = mlItem.pictures?.map(p => p.secure_url).filter(Boolean) ?? [];
    if (images.length) product.setImages(images);
    await this.productRepo.update(product);

    for (const mapping of cmd.variantMappings) {
      await this.prisma.productVariant.update({
        where: { id: mapping.localVariantId },
        data: { mlVariationId: mapping.mlVariationId ?? null },
      });

      const quantity = mapping.mlVariationId
        ? (mlItem.variations?.find(v => String(v.id) === String(mapping.mlVariationId))?.available_quantity ?? 0)
        : (mlItem.available_quantity ?? 0);

      this.logger.log(`Variant ${mapping.localVariantId}: ML quantity=${quantity}`);
      if (quantity > 0) {
        try {
          await this.increaseStock.execute({
            variantId: mapping.localVariantId,
            quantity,
            source: StockSource.ML,
            referenceType: ReferenceType.MANUAL,
            referenceId: cmd.mlItemId,
          });
        } catch (err) {
          this.logger.warn(`Could not pull stock for variant ${mapping.localVariantId}: ${err.message}`);
        }
      }
    }

    this.logger.log(`Product ${cmd.productId} linked to ML item ${cmd.mlItemId}`);
  }
}
