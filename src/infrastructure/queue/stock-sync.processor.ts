import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { MlClient } from '../../integrations/mercadolibre/ml.client';

export const STOCK_SYNC_QUEUE = 'stock-sync';

export interface StockSyncJob {
  variantId: string;
}

@Processor(STOCK_SYNC_QUEUE)
export class StockSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StockSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlClient: MlClient,
  ) {
    super();
  }

  async process(job: Job<StockSyncJob>): Promise<void> {
    const { variantId } = job.data;

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      this.logger.warn(`StockSync: variant ${variantId} not found — skipping`);
      return;
    }

    if (!variant.mlVariationId || !variant.product.mlItemId) {
      this.logger.debug(`StockSync: variant ${variantId} not linked to ML — skipping`);
      return;
    }

    await this.mlClient.updateItemStock(
      variant.product.mlItemId,
      variant.mlVariationId,
      variant.stock,
    );

    this.logger.log(
      `StockSync: variant ${variantId} synced to ML (qty=${variant.stock})`,
    );
  }
}
