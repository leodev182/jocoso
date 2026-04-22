import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IPaymentRepository } from '../../domain/payments/repositories/payment.repository';
import { Payment, PaymentStatus, PaymentProps } from '../../domain/payments/entities/payment.entity';
import { PaymentEventLog } from '../../domain/payments/entities/payment-event-log.entity';

@Injectable()
export class PaymentPrismaRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { orderId } });
    return row ? this.toEntity(row) : null;
  }

  async save(payment: Payment): Promise<void> {
    const d = payment.toPersistence();
    await this.prisma.payment.create({
      data: { id: d.id, orderId: d.orderId, amount: d.amount, status: d.status as any, gatewayId: d.gatewayId },
    });
  }

  // Always update status + append event log atomically
  async update(payment: Payment, eventLog: PaymentEventLog): Promise<void> {
    const d = payment.toPersistence();
    const log = eventLog.toPersistence();
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: d.id },
        data: { status: d.status as any, gatewayId: d.gatewayId },
      }),
      this.prisma.paymentEventLog.create({
        data: {
          id: log.id, paymentId: log.paymentId,
          fromStatus: log.fromStatus as any, toStatus: log.toStatus as any,
          triggeredBy: log.triggeredBy, payload: log.payload ?? undefined,
        },
      }),
    ]);
  }

  private toEntity(row: any): Payment {
    return Payment.reconstitute({
      id: row.id, orderId: row.orderId, amount: Number(row.amount),
      status: row.status as PaymentStatus, gatewayId: row.gatewayId,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as PaymentProps);
  }
}
