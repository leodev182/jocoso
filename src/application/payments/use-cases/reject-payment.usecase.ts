import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { PaymentDomainService } from '../../../domain/payments/services/payment.domain.service';
import { PaymentEventLog } from '../../../domain/payments/entities/payment-event-log.entity';
import { PaymentStatus } from '../../../domain/payments/entities/payment.entity';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';

@Injectable()
export class RejectPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    private readonly paymentDomain: PaymentDomainService,
  ) {}

  async execute(paymentId: string, payload?: Record<string, any>): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    this.paymentDomain.assertPending(payment);
    const prevStatus = payment.getStatus();

    payment.reject();

    const log = PaymentEventLog.create(paymentId, prevStatus, PaymentStatus.REJECTED, 'webhook', payload);
    await this.paymentRepo.update(payment, log);

    const order = await this.orderRepo.findById(payment.getOrderId());
    if (order) {
      order.cancel();
      await this.orderRepo.update(order);
    }
  }
}
