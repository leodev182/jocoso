import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HandleMlOrderUseCase } from '../../application/ml/use-cases/handle-ml-order.usecase';
import { Sentry } from '../monitoring/sentry';

export const ML_ORDER_QUEUE = 'ml-order';

export interface MlOrderJob {
  mlOrderId: string;
}

@Processor(ML_ORDER_QUEUE)
export class MlOrderProcessor extends WorkerHost {
  private readonly logger = new Logger(MlOrderProcessor.name);

  constructor(private readonly handleMlOrder: HandleMlOrderUseCase) {
    super();
  }

  async process(job: Job<MlOrderJob>): Promise<void> {
    const { mlOrderId } = job.data;
    this.logger.log(`Processing ML order job: ${mlOrderId} (attempt ${job.attemptsMade + 1})`);
    try {
      await this.handleMlOrder.execute(mlOrderId);
    } catch (error) {
      Sentry.captureException(error, { extra: { queue: ML_ORDER_QUEUE, mlOrderId } });
      throw error;
    }
  }
}
