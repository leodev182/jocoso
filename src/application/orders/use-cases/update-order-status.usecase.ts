import { Injectable, Inject, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { OrderStatus } from '../../../domain/orders/entities/order.entity';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository) {}

  async execute(id: string, status: OrderStatus) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    switch (status) {
      case OrderStatus.CONFIRMED:  order.confirm(); break;
      case OrderStatus.PROCESSING: order.process(); break;
      case OrderStatus.SHIPPED:    order.ship(); break;
      case OrderStatus.COMPLETED:  order.complete(); break;
      case OrderStatus.CANCELLED:  order.cancel(); break;
      default:
        throw new UnprocessableEntityException(`No se puede cambiar al estado ${status}`);
    }

    await this.orderRepo.update(order);
    return order.toPersistence();
  }
}
