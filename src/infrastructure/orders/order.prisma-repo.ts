import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IOrderRepository } from '../../domain/orders/repositories/order.repository';
import { Order, OrderStatus, OrderProps } from '../../domain/orders/entities/order.entity';

@Injectable()
export class OrderPrismaRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? this.toEntity(row) : null;
  }

  async findByUserId(userId: string, page = 1, limit = 20): Promise<{ orders: Order[]; total: number }> {
    const where = { userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where }),
    ]);
    return { orders: rows.map((r) => this.toEntity(r)), total };
  }

  async findAll(status?: string, page = 1, limit = 20): Promise<{ orders: Order[]; total: number }> {
    const where = status ? { status: status as any } : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where }),
    ]);
    return { orders: rows.map((r) => this.toEntity(r)), total };
  }

  async save(order: Order): Promise<void> {
    const d = order.toPersistence();
    await this.prisma.order.create({
      data: {
        id: d.id, userId: d.userId, status: d.status as any,
        totalAmount: d.totalAmount,
        items: { create: d.items.map((i) => ({ id: i.id, variantId: i.variantId, quantity: i.quantity, price: i.price })) },
      },
    });
  }

  async update(order: Order): Promise<void> {
    const d = order.toPersistence();
    await this.prisma.order.update({ where: { id: d.id }, data: { status: d.status as any } });
  }

  private toEntity(row: any): Order {
    return Order.reconstitute({
      id: row.id, userId: row.userId, status: row.status as OrderStatus,
      totalAmount: Number(row.totalAmount),
      items: row.items.map((i: any) => ({ id: i.id, orderId: i.orderId, variantId: i.variantId, quantity: i.quantity, price: Number(i.price) })),
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as OrderProps);
  }
}
