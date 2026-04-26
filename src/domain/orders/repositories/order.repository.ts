import { Order } from '../entities/order.entity';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string, page?: number, limit?: number): Promise<{ orders: Order[]; total: number }>;
  findAll(status?: string, page?: number, limit?: number): Promise<{ orders: Order[]; total: number }>;
  save(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol('IOrderRepository');
