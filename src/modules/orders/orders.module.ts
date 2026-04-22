import { Module } from '@nestjs/common';
import { OrderDomainService } from '../../domain/orders/services/order.domain.service';
import { ORDER_REPOSITORY } from '../../domain/orders/repositories/order.repository';
import { CreateOrderUseCase } from '../../application/orders/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../application/orders/use-cases/get-order.usecase';
import { OrderPrismaRepository } from '../../infrastructure/orders/order.prisma-repo';
import { OrdersController } from '../../interfaces/http/orders/orders.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [
    OrderDomainService,
    CreateOrderUseCase,
    GetOrderUseCase,
    { provide: ORDER_REPOSITORY, useClass: OrderPrismaRepository },
  ],
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}
