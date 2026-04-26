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

  async getByUser(userId: string, page = 1, limit = 20) {
    const { orders, total } = await this.orderRepo.findByUserId(userId, page, limit);
    return { data: orders.map((o) => o.toPersistence()), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listAll(status?: string, page = 1, limit = 20) {
    const { orders, total } = await this.orderRepo.findAll(status, page, limit);
    return { data: orders.map((o) => o.toPersistence()), total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
