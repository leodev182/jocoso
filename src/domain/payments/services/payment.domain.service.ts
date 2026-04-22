import { UnprocessableEntityException } from '@nestjs/common';
import { Payment, PaymentStatus } from '../entities/payment.entity';

export class PaymentDomainService {
  assertPending(payment: Payment): void {
    if (payment.getStatus() !== PaymentStatus.PENDING) {
      throw new UnprocessableEntityException(
        `Payment ${payment.getId()} is not in PENDING status`,
      );
    }
  }

  assertApproved(payment: Payment): void {
    if (payment.getStatus() !== PaymentStatus.APPROVED) {
      throw new UnprocessableEntityException(
        `Payment ${payment.getId()} is not in APPROVED status`,
      );
    }
  }
}
