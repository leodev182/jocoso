import { Injectable } from '@nestjs/common';
import { ApprovePaymentUseCase } from './approve-payment.usecase';
import { RejectPaymentUseCase } from './reject-payment.usecase';

export interface WebhookPayload {
  paymentId: string;
  gatewayId: string;
  status: 'approved' | 'rejected';
  raw: Record<string, any>;
}

@Injectable()
export class HandleWebhookUseCase {
  constructor(
    private readonly approve: ApprovePaymentUseCase,
    private readonly reject: RejectPaymentUseCase,
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    if (payload.status === 'approved') {
      await this.approve.execute(payload.paymentId, payload.gatewayId, payload.raw);
    } else {
      await this.reject.execute(payload.paymentId, payload.raw);
    }
  }
}
