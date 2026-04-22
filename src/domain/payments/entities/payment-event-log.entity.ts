import * as crypto from 'crypto';
import { PaymentStatus } from './payment.entity';

export interface PaymentEventLogProps {
  id: string;
  paymentId: string;
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
  triggeredBy: string;
  payload: Record<string, any> | null;
  createdAt: Date;
}

export class PaymentEventLog {
  private constructor(
    private readonly id: string,
    private readonly paymentId: string,
    private readonly fromStatus: PaymentStatus,
    private readonly toStatus: PaymentStatus,
    private readonly triggeredBy: string,
    private readonly payload: Record<string, any> | null,
    private readonly createdAt: Date,
  ) {}

  static create(paymentId: string, fromStatus: PaymentStatus, toStatus: PaymentStatus, triggeredBy: string, payload?: Record<string, any>): PaymentEventLog {
    return new PaymentEventLog(crypto.randomUUID(), paymentId, fromStatus, toStatus, triggeredBy, payload ?? null, new Date());
  }

  static reconstitute(props: PaymentEventLogProps): PaymentEventLog {
    return new PaymentEventLog(props.id, props.paymentId, props.fromStatus, props.toStatus, props.triggeredBy, props.payload, props.createdAt);
  }

  toPersistence(): PaymentEventLogProps {
    return { id: this.id, paymentId: this.paymentId, fromStatus: this.fromStatus, toStatus: this.toStatus, triggeredBy: this.triggeredBy, payload: this.payload, createdAt: this.createdAt };
  }
}
