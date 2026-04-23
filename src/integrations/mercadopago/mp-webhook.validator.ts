import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MpWebhookValidator {
  private readonly logger = new Logger(MpWebhookValidator.name);

  constructor(private readonly config: ConfigService) {}

  // MP signature format: x-signature: ts=<ts>,v1=<hmac>
  // Signed message: "id:<dataId>;request-id:<xRequestId>;ts:<ts>;"
  validate(xSignature: string, xRequestId: string, dataId: string): boolean {
    const secret = this.config.get<string>('MP_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('MP_WEBHOOK_SECRET not set — skipping signature validation');
      return true;
    }

    try {
      const parts = Object.fromEntries(
        xSignature.split(',').map((p) => p.split('=') as [string, string]),
      );
      const ts = parts['ts'];
      const v1 = parts['v1'];

      if (!ts || !v1) return false;

      const message = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const expected = crypto.createHmac('sha256', secret).update(message).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
    } catch (err) {
      this.logger.error(`Webhook signature validation failed: ${err}`);
      return false;
    }
  }
}
