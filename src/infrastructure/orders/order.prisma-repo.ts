import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IOrderRepository } from '../../domain/orders/repositories/order.repository';
import { Order, OrderStatus, OrderOrigin, OrderProps } from '../../domain/orders/entities/order.entity';

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
        id: d.id, userId: d.userId, addressId: d.addressId,
        status: d.status as any, origin: d.origin as any,
        totalAmount: d.totalAmount,
        items: { create: d.items.map((i) => ({ id: i.id, variantId: i.variantId, quantity: i.quantity, price: i.price })) },
      },
    });
  }

  async update(order: Order): Promise<void> {
    const d = order.toPersistence();
    await this.prisma.order.update({
      where: { id: d.id },
      data: {
        status: d.status as any,
        trackingCode: d.trackingCode,
        shippingLabel: d.shippingLabel,
      },
    });
  }

  async delete(id: string): Promise<void> {
    // Payment no tiene cascade hacia Order, así que limpiamos pago + sus logs antes.
    // OrderItem sí cascadea al borrar la orden.
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentEventLog.deleteMany({ where: { payment: { orderId: id } } });
      await tx.payment.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
  }

  private toEntity(row: any): Order {
    return Order.reconstitute({
      id: row.id, userId: row.userId, addressId: row.addressId ?? null,
      status: row.status as OrderStatus,
      origin: (row.origin ?? 'WEB') as OrderOrigin,
      totalAmount: Number(row.totalAmount),
      trackingCode: row.trackingCode ?? null, shippingLabel: row.shippingLabel ?? null,
      customerNotes: row.customerNotes ?? null, adminNotes: row.adminNotes ?? null,
      items: row.items.map((i: any) => ({ id: i.id, orderId: i.orderId, variantId: i.variantId, quantity: i.quantity, price: Number(i.price) })),
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as OrderProps);
  }
}
