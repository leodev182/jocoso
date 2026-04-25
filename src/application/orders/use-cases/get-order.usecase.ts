import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';

@Injectable()
export class GetOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository) {}

  async getById(id: string, requestingUserId: string, role: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (order.getUserId() !== requestingUserId && role !== 'ADMIN' && role !== 'SUPPORT') {
      throw new ForbiddenException();
    }
    return order.toPersistence();
  }

  async getByUser(userId: string) {
    const orders = await this.orderRepo.findByUserId(userId);
    return orders.map((o) => o.toPersistence());
  }

  async listAll(status?: string) {
    const orders = await this.orderRepo.findAll(status);
    return orders.map((o) => o.toPersistence());
  }
}
