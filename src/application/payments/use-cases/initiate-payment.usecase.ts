import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus } from '../../../domain/payments/entities/payment.entity';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { PaymentEventLog } from '../../../domain/payments/entities/payment-event-log.entity';
import { MpClient } from '../../../integrations/mercadopago/mp.client';

export interface InitiatePaymentResult {
  paymentId: string;
  checkoutUrl: string;
}

@Injectable()
export class InitiatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    private readonly mpClient: MpClient,
    private readonly config: ConfigService,
  ) {}

  async execute(orderId: string): Promise<InitiatePaymentResult> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const existing = await this.paymentRepo.findByOrderId(orderId);
    if (existing) throw new ConflictException(`Payment already exists for order ${orderId}`);

    const payment = Payment.create(orderId, order.getTotalAmount());
    await this.paymentRepo.save(payment);

    const webhookUrl = this.config.getOrThrow('MP_WEBHOOK_URL');
    const isProd = this.config.get('NODE_ENV') === 'production';

    const preference = await this.mpClient.createPreference({
      external_reference: orderId,
      notification_url: webhookUrl,
      items: order.getItems().map((item) => ({
        id: item.variantId,
        title: `Producto ${item.variantId}`,
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: 'CLP',
      })),
      back_urls: {
        success: `${this.config.get('FRONTEND_URL', 'http://localhost:3001')}/checkout/success`,
        failure: `${this.config.get('FRONTEND_URL', 'http://localhost:3001')}/checkout/failure`,
        pending: `${this.config.get('FRONTEND_URL', 'http://localhost:3001')}/checkout/pending`,
      },
    });

    const log = PaymentEventLog.create(
      payment.getId(), PaymentStatus.PENDING, PaymentStatus.PENDING,
      'system', { mpPreferenceId: preference.id },
    );
    await this.paymentRepo.update(payment, log);

    const checkoutUrl = isProd ? preference.init_point : preference.sandbox_init_point;
    return { paymentId: payment.getId(), checkoutUrl };
  }
}
