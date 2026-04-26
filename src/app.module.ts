import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
    // Rate limiting global — protege todos los endpoints por defecto
    // Los webhooks de ML y MP usan @SkipThrottle() para no bloquear a los proveedores
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // ventana de 60 segundos
        limit: 120,    // 120 req/min por IP — tráfico normal de app
      },
      {
        name: 'strict',
        ttl: 60_000,
        limit: 10,     // 10 req/min — para auth (login, register)
      },
    ]),
    LoggerModule,
    PrismaModule,
    AuthModule,
    StockModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    MlModule,
  ],
  providers: [
    // Aplica ThrottlerGuard globalmente a todos los endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
