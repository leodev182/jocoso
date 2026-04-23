import {
  Controller, Post, Body, Param, Headers, UseGuards,
  HttpCode, HttpStatus, ParseUUIDPipe, UnauthorizedException, Logger,
} from '@nestjs/common';
import { InitiatePaymentUseCase } from '../../../application/payments/use-cases/initiate-payment.usecase';
import { HandleWebhookUseCase } from '../../../application/payments/use-cases/handle-webhook.usecase';
import { CancelPaymentUseCase } from '../../../application/payments/use-cases/cancel-payment.usecase';
import { MpClient } from '../../../integrations/mercadopago/mp.client';
import { MpWebhookValidator } from '../../../integrations/mercadopago/mp-webhook.validator';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly initiate: InitiatePaymentUseCase,
    private readonly handleWebhook: HandleWebhookUseCase,
    private readonly cancel: CancelPaymentUseCase,
    private readonly mpClient: MpClient,
    private readonly mpValidator: MpWebhookValidator,
  ) {}

  @Post('orders/:orderId')
  @UseGuards(JwtAuthGuard)
  initiatePayment(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.initiate.execute(orderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() body: { type: string; data: { id: string } },
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    // Validate HMAC signature from MercadoPago
    if (xSignature) {
      const valid = this.mpValidator.validate(xSignature, xRequestId ?? '', body?.data?.id ?? '');
      if (!valid) {
        this.logger.warn('Invalid MP webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    // Only process payment notifications
    if (body.type !== 'payment' || !body.data?.id) {
      return { received: true };
    }

    const mpPaymentId = body.data.id;
    this.logger.log(`MP webhook: payment ${mpPaymentId}`);

    // Fetch real payment status from MP
    const mpPayment = await this.mpClient.getPayment(mpPaymentId);
    const orderId = mpPayment.external_reference;

    if (!orderId) {
      this.logger.warn(`MP payment ${mpPaymentId} has no external_reference`);
      return { received: true };
    }

    const status = mpPayment.status === 'approved' ? 'approved'
      : mpPayment.status === 'rejected' ? 'rejected'
      : null;

    if (!status) {
      this.logger.log(`MP payment ${mpPaymentId} status=${mpPayment.status} — no action`);
      return { received: true };
    }

    await this.handleWebhook.execute({
      paymentId: orderId,         // we use orderId to find our payment
      gatewayId: String(mpPaymentId),
      status,
      raw: mpPayment as any,
    });

    return { received: true };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.cancel.execute(id, user.id);
  }
}
