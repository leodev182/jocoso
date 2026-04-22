import { Payment } from '../entities/payment.entity';
import { PaymentEventLog } from '../entities/payment-event-log.entity';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  save(payment: Payment): Promise<void>;
  update(payment: Payment, eventLog: PaymentEventLog): Promise<void>;
}

export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');
