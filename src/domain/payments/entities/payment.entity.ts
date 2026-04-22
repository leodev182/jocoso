import * as crypto from 'crypto';

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  SETTLED = 'SETTLED',
}

// Valid state transitions — explicit finite state machine
const TRANSITIONS: Partial<Record<PaymentStatus, PaymentStatus[]>> = {
  [PaymentStatus.PENDING]: [PaymentStatus.APPROVED, PaymentStatus.REJECTED, PaymentStatus.CANCELLED],
  [PaymentStatus.APPROVED]: [PaymentStatus.SETTLED],
};

export interface PaymentProps {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  gatewayId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private constructor(
    private readonly id: string,
    private readonly orderId: string,
    private readonly amount: number,
    private status: PaymentStatus,
    private gatewayId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(orderId: string, amount: number): Payment {
    const now = new Date();
    return new Payment(crypto.randomUUID(), orderId, amount, PaymentStatus.PENDING, null, now, now);
  }

  static reconstitute(props: PaymentProps): Payment {
    return new Payment(props.id, props.orderId, props.amount, props.status, props.gatewayId, props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getOrderId(): string { return this.orderId; }
  getAmount(): number { return this.amount; }
  getStatus(): PaymentStatus { return this.status; }
  getGatewayId(): string | null { return this.gatewayId; }

  approve(gatewayId: string): void {
    this.transition(PaymentStatus.APPROVED);
    this.gatewayId = gatewayId;
  }

  reject(): void { this.transition(PaymentStatus.REJECTED); }
  cancel(): void { this.transition(PaymentStatus.CANCELLED); }
  settle(): void { this.transition(PaymentStatus.SETTLED); }

  private transition(next: PaymentStatus): void {
    const allowed = TRANSITIONS[this.status] ?? [];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid payment transition: ${this.status} → ${next}`);
    }
    this.status = next;
    this.touch();
  }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): PaymentProps {
    return { id: this.id, orderId: this.orderId, amount: this.amount, status: this.status, gatewayId: this.gatewayId, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
