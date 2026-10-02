import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  IEmailService,
  OrderConfirmationEmailData,
  ConcursoGanadorEmailData,
  OwnerOrderNotificationData,
  OwnerConcursoNotificationData,
} from '../../application/email/ports/email.port';
import {
  buildOrderConfirmationHtml,
  buildOrderConfirmationSubject,
  buildConcursoGanadorHtml,
  buildConcursoGanadorSubject,
  buildOwnerOrderNotificationHtml,
  buildOwnerOrderNotificationSubject,
  buildOwnerConcursoNotificationHtml,
  buildOwnerConcursoNotificationSubject,
} from './email.template';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly ownerEmail: string;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get<string>('RESEND_FROM', 'Jocoso <hola@jocoso.cl>');
    this.ownerEmail = config.getOrThrow<string>('OWNER_EMAIL');
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

  async sendConcursoGanador(data: ConcursoGanadorEmailData): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: data.customerEmail,
      subject: buildConcursoGanadorSubject(data.concursoTitulo),
      html: buildConcursoGanadorHtml(data),
    });
    if (error) {
      this.logger.error(`Failed to send ganador email to ${data.customerEmail}: ${JSON.stringify(error)}`);
      throw new Error(`Resend error: ${error.message}`);
    }
    this.logger.log(`Ganador email sent to ${data.customerEmail} for concurso ${data.concursoTitulo}`);
  }

  async sendOwnerOrderNotification(data: OwnerOrderNotificationData): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: this.ownerEmail,
      subject: buildOwnerOrderNotificationSubject(data.orderId, data.totalAmount),
      html: buildOwnerOrderNotificationHtml(data),
    });
    if (error) {
      this.logger.error(`Failed to send owner order notification: ${JSON.stringify(error)}`);
    } else {
      this.logger.log(`Owner order notification sent for order ${data.orderId}`);
    }
  }

  async sendOwnerConcursoNotification(data: OwnerConcursoNotificationData): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: this.ownerEmail,
      subject: buildOwnerConcursoNotificationSubject(data),
      html: buildOwnerConcursoNotificationHtml(data),
    });
    if (error) {
      this.logger.error(`Failed to send owner concurso notification: ${JSON.stringify(error)}`);
    } else {
      this.logger.log(`Owner concurso notification sent: ${data.event} - ${data.concursoTitulo}`);
    }
  }
}
