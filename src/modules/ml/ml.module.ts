import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MlAuthService } from '../../integrations/mercadolibre/ml-auth.service';
import { MlClient } from '../../integrations/mercadolibre/ml.client';
import { HandleMlOrderUseCase } from '../../application/ml/use-cases/handle-ml-order.usecase';
import { SyncProductToMlUseCase } from '../../application/ml/use-cases/sync-product-to-ml.usecase';
import { PullMlImagesUseCase } from '../../application/ml/use-cases/pull-ml-images.usecase';
import { LinkProductToMlUseCase } from '../../application/ml/use-cases/link-product-to-ml.usecase';
import { UnlinkProductFromMlUseCase } from '../../application/ml/use-cases/unlink-product-from-ml.usecase';
import { LinkVariantToMlUseCase } from '../../application/ml/use-cases/link-variant-to-ml.usecase';
import { ReconcileMlOrdersUseCase } from '../../application/ml/use-cases/reconcile-ml-orders.usecase';
import { MlController } from '../../interfaces/http/ml/ml.controller';
import { StockSyncProcessor, STOCK_SYNC_QUEUE } from '../../infrastructure/queue/stock-sync.processor';
import { MlOrderProcessor, ML_ORDER_QUEUE } from '../../infrastructure/queue/ml-order.processor';
import { MlReconcileScheduler } from '../../infrastructure/queue/ml-reconcile.scheduler';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    ProductsModule,
    OrdersModule,
    StockModule,
    BullModule.registerQueue({ name: STOCK_SYNC_QUEUE }),
    BullModule.registerQueue({ name: ML_ORDER_QUEUE }),
  ],
  controllers: [MlController],
  providers: [
    MlAuthService,
    MlClient,
    HandleMlOrderUseCase,
    SyncProductToMlUseCase,
    PullMlImagesUseCase,
    LinkProductToMlUseCase,
    UnlinkProductFromMlUseCase,
    LinkVariantToMlUseCase,
    ReconcileMlOrdersUseCase,
    MlReconcileScheduler,
    StockSyncProcessor,
    MlOrderProcessor,
  ],
  exports: [MlAuthService, MlClient],
})
export class MlModule {}
