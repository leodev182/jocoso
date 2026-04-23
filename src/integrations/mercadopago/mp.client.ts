import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MpPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MpPreferenceRequest {
  items: MpPreferenceItem[];
  external_reference: string;   // our internal orderId
  notification_url: string;
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
}

export interface MpPreference {
  id: string;
  init_point: string;           // checkout URL (production)
  sandbox_init_point: string;   // checkout URL (sandbox)
}

export interface MpPayment {
  id: number;
  status: 'approved' | 'rejected' | 'pending' | 'in_process' | 'cancelled' | 'refunded';
  external_reference: string;   // our orderId
  transaction_amount: number;
  currency_id: string;
}

@Injectable()
export class MpClient {
  private readonly logger = new Logger(MpClient.name);
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private readonly config: ConfigService) {}

  async createPreference(data: MpPreferenceRequest): Promise<MpPreference> {
    return this.request<MpPreference>('POST', '/checkout/preferences', data);
  }

  async getPayment(mpPaymentId: string): Promise<MpPayment> {
    return this.request<MpPayment>('GET', `/v1/payments/${mpPaymentId}`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = this.config.getOrThrow('MP_ACCESS_TOKEN');

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`MP API ${method} ${path} → ${res.status}: ${err}`);
      throw new Error(`MercadoPago API error ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}
