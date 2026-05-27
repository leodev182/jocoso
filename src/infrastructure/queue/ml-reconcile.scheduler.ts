import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconcileMlOrdersUseCase } from '../../application/ml/use-cases/reconcile-ml-orders.usecase';

@Injectable()
export class MlReconcileScheduler {
  private readonly logger = new Logger(MlReconcileScheduler.name);

  constructor(private readonly reconcile: ReconcileMlOrdersUseCase) {}

  // Corre cada 6 horas — cubre webhooks perdidos con ventana de 25h para solapar ejecuciones
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCron(): Promise<void> {
    const since = new Date(Date.now() - 25 * 60 * 60 * 1000);
    this.logger.log(`Reconcile automático iniciado (desde ${since.toISOString()})`);

    try {
      const result = await this.reconcile.execute(since);
      this.logger.log(`Reconcile automático finalizado: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error(`Reconcile automático falló: ${err.message}`);
    }
  }
}
