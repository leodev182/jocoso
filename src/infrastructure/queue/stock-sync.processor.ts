import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncLocalStockToMlUseCase } from '../../application/ml/use-cases/sync-local-stock-to-ml.usecase';

export const STOCK_SYNC_QUEUE = 'stock-sync';

export interface StockSyncJob {
  variantId: string;
}

@Processor(STOCK_SYNC_QUEUE)
export class StockSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StockSyncProcessor.name);

  constructor(
    private readonly syncLocalStock: SyncLocalStockToMlUseCase,
  ) {
    super();
  }

  async process(job: Job<StockSyncJob>): Promise<void> {
    const { variantId } = job.data;

    await this.syncLocalStock.execute(variantId);
  }
}
