import { Injectable, Logger } from '@nestjs/common';
import { MlAuthService } from './ml-auth.service';

export interface MlItem {
  id?: string;
  title: string;
  category_id: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  buying_mode: string;
  condition: string;
  listing_type_id: string;
  variations?: MlVariation[];
  attributes?: MlAttribute[];
}

export interface MlVariation {
  id?: number;
  price: number;
  available_quantity: number;
  attribute_combinations: MlAttribute[];
}

export interface MlAttribute {
  id: string;
  value_name: string;
}

@Injectable()
export class MlClient {
  private readonly logger = new Logger(MlClient.name);
  private readonly baseUrl = 'https://api.mercadolibre.com';

  constructor(private readonly auth: MlAuthService) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async getUserInfo(): Promise<{ id: number; nickname: string; email: string }> {
    return this.get('/users/me');
  }

  async createItem(item: MlItem): Promise<{ id: string; permalink: string }> {
    return this.post('/items', item);
  }

  async updateItemStock(mlItemId: string, mlVariationId: string | null, quantity: number): Promise<void> {
    if (mlVariationId) {
      await this.put(`/items/${mlItemId}/variations/${mlVariationId}`, { available_quantity: quantity });
    } else {
      await this.put(`/items/${mlItemId}`, { available_quantity: quantity });
    }
  }

  async getOrder(mlOrderId: string): Promise<any> {
    return this.get(`/orders/${mlOrderId}`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const sellerId = await this.auth.getStoredSellerId();
    if (!sellerId) throw new Error('ML not connected — authorize first via /api/v1/ml/oauth/authorize');

    const token = await this.auth.getValidToken(sellerId);

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
      this.logger.error(`ML API ${method} ${path} → ${res.status}: ${err}`);
      throw new Error(`ML API error ${res.status}: ${err}`);
    }

    return res.json() as Promise<T>;
  }
}
