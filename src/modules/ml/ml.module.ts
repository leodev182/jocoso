import { Module } from '@nestjs/common';
import { MlAuthService } from '../../integrations/mercadolibre/ml-auth.service';
import { MlClient } from '../../integrations/mercadolibre/ml.client';
import { HandleMlOrderUseCase } from '../../application/ml/use-cases/handle-ml-order.usecase';
import { SyncProductToMlUseCase } from '../../application/ml/use-cases/sync-product-to-ml.usecase';
import { MlController } from '../../interfaces/http/ml/ml.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [ProductsModule, OrdersModule, StockModule],
  controllers: [MlController],
  providers: [
    MlAuthService,
    MlClient,
    HandleMlOrderUseCase,
    SyncProductToMlUseCase,
  ],
  exports: [MlAuthService, MlClient],
})
export class MlModule {}
