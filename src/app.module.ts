import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { AuditModule } from './infrastructure/audit/audit.module';
import { AuditInterceptor } from './infrastructure/audit/audit.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { StockModule } from './modules/stock/stock.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MlModule } from './modules/ml/ml.module';
import { AdminModule } from './modules/admin/admin.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { HealthController } from './interfaces/http/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
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
    AuditModule,
    AuthModule,
    StockModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    MlModule,
    AdminModule,
    AddressesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
