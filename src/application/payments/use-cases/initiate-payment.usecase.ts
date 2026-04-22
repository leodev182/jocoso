import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Payment } from '../../../domain/payments/entities/payment.entity';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { PaymentEventLog } from '../../../domain/payments/entities/payment-event-log.entity';
import { PaymentStatus } from '../../../domain/payments/entities/payment.entity';

@Injectable()
export class InitiatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(orderId: string): Promise<Payment> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const existing = await this.paymentRepo.findByOrderId(orderId);
    if (existing) throw new ConflictException(`Payment already exists for order ${orderId}`);

    const payment = Payment.create(orderId, order.getTotalAmount());
    await this.paymentRepo.save(payment);

    const log = PaymentEventLog.create(payment.getId(), PaymentStatus.PENDING, PaymentStatus.PENDING, 'system');
    await this.paymentRepo.update(payment, log);

    return payment;
  }
}
