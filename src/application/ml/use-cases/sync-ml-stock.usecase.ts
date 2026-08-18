import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MlClient, MlItemDetail } from '../../../integrations/mercadolibre/ml.client';
import { IncreaseStockUseCase } from '../../stock/use-cases/increase-stock.usecase';
import { DecreaseStockUseCase } from '../../stock/use-cases/decrease-stock.usecase';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';

@Injectable()
export class SyncMlStockUseCase {
  private readonly logger = new Logger(SyncMlStockUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClient,
    private readonly increaseStock: IncreaseStockUseCase,
    private readonly decreaseStock: DecreaseStockUseCase,
  ) {}

  async execute(mlItemId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { mlItemId },
      include: { variants: true },
    });
    if (!product) {
      this.logger.warn(`ML stock: item ${mlItemId} is not linked locally`);
      return;
    }

    const item = await this.mlClient.getItemDetail(mlItemId);
    const targets = this.getTargets(item, product.variants);

    for (const [variantId, target] of targets) {
      const variant = product.variants.find((candidate) => candidate.id === variantId);
      if (!variant) continue;

      const delta = target - variant.stock;
      if (delta > 0) {
        await this.increaseStock.execute({
          variantId,
          quantity: delta,
          source: StockSource.ML,
          referenceType: ReferenceType.MANUAL,
          referenceId: mlItemId,
        });
      } else if (delta < 0) {
        await this.decreaseStock.execute({
          variantId,
          quantity: -delta,
          source: StockSource.ML,
          referenceType: ReferenceType.MANUAL,
          referenceId: mlItemId,
        });
      }

      this.logger.log(`ML stock synced: variant=${variantId} local=${variant.stock} ml=${target}`);
    }
  }

  private getTargets(item: MlItemDetail, variants: { id: string; mlVariationId: string | null }[]) {
    const targets = new Map<string, number>();

    if (item.variations?.length) {
      for (const variation of item.variations) {
        const local = variants.find((variant) => variant.mlVariationId === String(variation.id));
        if (local) targets.set(local.id, Math.max(0, variation.available_quantity));
      }
    } else {
      const local = variants.find((variant) => !variant.mlVariationId);
      if (local) targets.set(local.id, Math.max(0, item.available_quantity));
    }

    return targets;
  }
}
