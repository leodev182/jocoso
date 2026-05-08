import { Module } from '@nestjs/common';
import { PaymentDomainService } from '../../domain/payments/services/payment.domain.service';
import { PAYMENT_REPOSITORY } from '../../domain/payments/repositories/payment.repository';
import { InitiatePaymentUseCase } from '../../application/payments/use-cases/initiate-payment.usecase';
import { ApprovePaymentUseCase } from '../../application/payments/use-cases/approve-payment.usecase';
import { RejectPaymentUseCase } from '../../application/payments/use-cases/reject-payment.usecase';
import { CancelPaymentUseCase } from '../../application/payments/use-cases/cancel-payment.usecase';
import { HandleWebhookUseCase } from '../../application/payments/use-cases/handle-webhook.usecase';
import { SettlePaymentUseCase } from '../../application/payments/use-cases/settle-payment.usecase';
import { PaymentPrismaRepository } from '../../infrastructure/payments/payment.prisma-repo';
import { MpClient } from '../../integrations/mercadopago/mp.client';
import { MpWebhookValidator } from '../../integrations/mercadopago/mp-webhook.validator';
import { PaymentsController } from '../../interfaces/http/payments/payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [OrdersModule, StockModule],
  controllers: [PaymentsController],
  providers: [
    PaymentDomainService,
    InitiatePaymentUseCase,
    ApprovePaymentUseCase,
    RejectPaymentUseCase,
    CancelPaymentUseCase,
    HandleWebhookUseCase,
    SettlePaymentUseCase,
    MpClient,
    MpWebhookValidator,
    { provide: PAYMENT_REPOSITORY, useClass: PaymentPrismaRepository },
  ],
})
export class PaymentsModule {}
