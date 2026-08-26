import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { IPaymentRepository, PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { PaymentDomainService } from '../../../domain/payments/services/payment.domain.service';
import { PaymentEventLog } from '../../../domain/payments/entities/payment-event-log.entity';
import { PaymentStatus } from '../../../domain/payments/entities/payment.entity';
import { IOrderRepository, ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';
import { DecreaseStockUseCase } from '../../stock/use-cases/decrease-stock.usecase';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';
import { SendOrderConfirmationUseCase } from '../../email/use-cases/send-order-confirmation.usecase';

@Injectable()
export class ApprovePaymentUseCase {
  private readonly logger = new Logger(ApprovePaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: IOrderRepository,
    private readonly paymentDomain: PaymentDomainService,
    private readonly decreaseStock: DecreaseStockUseCase,
    private readonly sendConfirmation: SendOrderConfirmationUseCase,
  ) {}

  async execute(paymentId: string, gatewayId: string, payload?: Record<string, any>): Promise<void> {
    const payment = await this.paymentRepo.findByOrderId(paymentId);
    if (!payment) throw new NotFoundException(`Payment for order ${paymentId} not found`);

    this.paymentDomain.assertPending(payment);
    const prevStatus = payment.getStatus();

    payment.approve(gatewayId);

    const log = PaymentEventLog.create(payment.getId(), prevStatus, PaymentStatus.APPROVED, 'webhook', payload);
    await this.paymentRepo.update(payment, log);

    const order = await this.orderRepo.findById(payment.getOrderId());
    if (!order) return;

    order.confirm();
    await this.orderRepo.update(order);

    for (const item of order.getItems()) {
      await this.decreaseStock.execute({
        variantId: item.variantId,
        quantity: item.quantity,
        source: StockSource.WEB,
        referenceType: ReferenceType.ORDER,
        referenceId: order.getId(),
        externalId: `web-payment-${paymentId}-${item.variantId}`,
      });
    }

    // Fire-and-forget — email failure never blocks payment confirmation
    this.sendConfirmation
      .execute({
        orderId: order.getId(),
        userId: order.getUserId(),
        totalAmount: order.getTotalAmount(),
        items: order.getItems(),
        createdAt: order.toPersistence().createdAt,
        paymentOrigin: order.getOrigin() as any,
      })
      .catch((err) => this.logger.error(`Order confirmation email failed for ${order.getId()}: ${err?.message}`));
  }
}
