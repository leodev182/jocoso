import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { PaymentDomainService } from '../../../domain/payments/services/payment.domain.service';
import { PaymentEventLog } from '../../../domain/payments/entities/payment-event-log.entity';
import { PaymentStatus } from '../../../domain/payments/entities/payment.entity';

@Injectable()
export class SettlePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    private readonly paymentDomain: PaymentDomainService,
  ) {}

  // Triggered when MercadoPago releases funds to the seller account.
  // Idempotent: if already SETTLED, FSM throws and the caller catches it as 200 OK.
  async execute(paymentId: string, triggeredBy = 'system'): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    this.paymentDomain.assertApproved(payment);
    const prevStatus = payment.getStatus();
    payment.settle();

    const log = PaymentEventLog.create(paymentId, prevStatus, PaymentStatus.SETTLED, triggeredBy);
    await this.paymentRepo.update(payment, log);
  }
}
