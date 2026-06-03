import { Module } from '@nestjs/common';
import { OrderDomainService } from '../../domain/orders/services/order.domain.service';
import { ORDER_REPOSITORY } from '../../domain/orders/repositories/order.repository';
import { ADDRESS_REPOSITORY } from '../../domain/auth/repositories/address.repository';
import { USER_REPOSITORY } from '../../domain/auth/repositories/user.repository';
import { CreateOrderUseCase } from '../../application/orders/use-cases/create-order.usecase';
import { GetOrderUseCase } from '../../application/orders/use-cases/get-order.usecase';
import { UpdateOrderStatusUseCase } from '../../application/orders/use-cases/update-order-status.usecase';
import { DeleteOrderUseCase } from '../../application/orders/use-cases/delete-order.usecase';
import { GenerateShippingLabelUseCase } from '../../application/orders/use-cases/generate-shipping-label.usecase';
import { ZplLabelService } from '../../application/orders/services/zpl-label.service';
import { OrderPrismaRepository } from '../../infrastructure/orders/order.prisma-repo';
import { AddressPrismaRepository } from '../../infrastructure/auth/address.prisma-repo';
import { UserPrismaRepository } from '../../infrastructure/auth/user.prisma-repo';
import { OrdersController } from '../../interfaces/http/orders/orders.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [
    OrderDomainService,
    CreateOrderUseCase,
    GetOrderUseCase,
    UpdateOrderStatusUseCase,
    DeleteOrderUseCase,
    GenerateShippingLabelUseCase,
    ZplLabelService,
    { provide: ORDER_REPOSITORY, useClass: OrderPrismaRepository },
    { provide: ADDRESS_REPOSITORY, useClass: AddressPrismaRepository },
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
  ],
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}
