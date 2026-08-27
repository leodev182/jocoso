import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncLocalStockToMlUseCase } from '../../application/ml/use-cases/sync-local-stock-to-ml.usecase';
import { Sentry } from '../monitoring/sentry';

export const ML_STOCK_SYNC_QUEUE = 'ml-stock-sync';

export interface MlStockSyncJob {
  mlItemId: string;
}

@Processor(ML_STOCK_SYNC_QUEUE)
export class MlStockSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MlStockSyncProcessor.name);

  constructor(private readonly syncLocalStock: SyncLocalStockToMlUseCase) {
    super();
  }

  async process(job: Job<MlStockSyncJob>): Promise<void> {
    this.logger.log(`Processing ML stock notification: ${job.data.mlItemId}`);
    try {
      await this.syncLocalStock.executeListing(job.data.mlItemId);
    } catch (error) {
      Sentry.captureException(error, { extra: { queue: ML_STOCK_SYNC_QUEUE, mlItemId: job.data.mlItemId } });
      throw error;
    }
  }
}
