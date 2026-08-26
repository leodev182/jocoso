import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailService, OrderConfirmationEmailData } from '../../application/email/ports/email.port';
import { buildOrderConfirmationHtml, buildOrderConfirmationSubject } from './email.template';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get<string>('RESEND_FROM', 'Jocoso <hola@jocoso.cl>');
  }

  async sendOrderConfirmation(data: OrderConfirmationEmailData): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: data.customerEmail,
      subject: buildOrderConfirmationSubject(data.orderId),
      html: buildOrderConfirmationHtml(data),
    });

    if (error) {
      this.logger.error(`Failed to send order confirmation to ${data.customerEmail}: ${JSON.stringify(error)}`);
      throw new Error(`Resend error: ${error.message}`);
    }

    this.logger.log(`Order confirmation sent to ${data.customerEmail} for order ${data.orderId}`);
  }
}
