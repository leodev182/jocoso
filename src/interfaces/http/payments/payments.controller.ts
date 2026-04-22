import { Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { InitiatePaymentUseCase } from '../../../application/payments/use-cases/initiate-payment.usecase';
import { HandleWebhookUseCase } from '../../../application/payments/use-cases/handle-webhook.usecase';
import { CancelPaymentUseCase } from '../../../application/payments/use-cases/cancel-payment.usecase';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WebhookDto } from './dto/webhook.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly initiate: InitiatePaymentUseCase,
    private readonly handleWebhook: HandleWebhookUseCase,
    private readonly cancel: CancelPaymentUseCase,
  ) {}

  @Post('orders/:orderId')
  @UseGuards(JwtAuthGuard)
  initiatePayment(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.initiate.execute(orderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() dto: WebhookDto) {
    return this.handleWebhook.execute({ paymentId: dto.paymentId, gatewayId: dto.gatewayId, status: dto.status, raw: dto as any });
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelPayment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.cancel.execute(id, user.id);
  }
}
