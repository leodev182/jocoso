import { Injectable, Logger } from '@nestjs/common';
import { MlClient } from '../../../integrations/mercadolibre/ml.client';
import { MlAuthService } from '../../../integrations/mercadolibre/ml-auth.service';
import { HandleMlOrderUseCase } from './handle-ml-order.usecase';

export interface ReconcileResult {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
}

@Injectable()
export class ReconcileMlOrdersUseCase {
  private readonly logger = new Logger(ReconcileMlOrdersUseCase.name);

  constructor(
    private readonly mlClient: MlClient,
    private readonly mlAuth: MlAuthService,
    private readonly handleMlOrder: HandleMlOrderUseCase,
  ) {}

  async execute(since: Date): Promise<ReconcileResult> {
    const sellerId = await this.mlAuth.getStoredSellerId();
    if (!sellerId) throw new Error('ML no conectado');

    const orders = await this.mlClient.searchPaidOrders(sellerId, since);
    this.logger.log(`Reconcile: encontradas ${orders.length} órdenes pagadas desde ${since.toISOString()}`);

    const result: ReconcileResult = { total: orders.length, processed: 0, skipped: 0, errors: 0 };

    for (const order of orders) {
      try {
        const status = await this.handleMlOrder.execute(String(order.id));
        result[status]++;
      } catch (err) {
        this.logger.error(`Reconcile: error en orden ${order.id}: ${err.message}`);
        result.errors++;
      }
    }

    this.logger.log(`Reconcile finalizado: ${JSON.stringify(result)}`);
    return result;
  }
}
