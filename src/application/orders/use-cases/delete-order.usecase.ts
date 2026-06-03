import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';

@Injectable()
export class DeleteOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository) {}

  async execute(id: string): Promise<void> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    await this.orderRepo.delete(id);
  }
}
