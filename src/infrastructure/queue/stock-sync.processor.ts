import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncLocalStockToMlUseCase } from '../../application/ml/use-cases/sync-local-stock-to-ml.usecase';
import { Sentry } from '../monitoring/sentry';

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

    try {
      await this.syncLocalStock.execute(variantId);
    } catch (error) {
      Sentry.captureException(error, { extra: { queue: STOCK_SYNC_QUEUE, variantId } });
      throw error;
    }
  }
}
