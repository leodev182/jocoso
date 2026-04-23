import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { StockModule } from './modules/stock/stock.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MlModule } from './modules/ml/ml.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    PrismaModule,
    AuthModule,
    StockModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    MlModule,
  ],
})
export class AppModule {}
