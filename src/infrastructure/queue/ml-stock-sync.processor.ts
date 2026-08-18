import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SyncMlStockUseCase } from '../../application/ml/use-cases/sync-ml-stock.usecase';

export const ML_STOCK_SYNC_QUEUE = 'ml-stock-sync';

export interface MlStockSyncJob {
  mlItemId: string;
}

@Processor(ML_STOCK_SYNC_QUEUE)
export class MlStockSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MlStockSyncProcessor.name);

  constructor(private readonly syncMlStock: SyncMlStockUseCase) {
    super();
  }

  async process(job: Job<MlStockSyncJob>): Promise<void> {
    this.logger.log(`Processing ML stock notification: ${job.data.mlItemId}`);
    await this.syncMlStock.execute(job.data.mlItemId);
  }
}
