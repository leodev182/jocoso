import { Injectable, Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface MlTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  sellerId: string;
}

@Injectable()
export class MlAuthService {
  private readonly logger = new Logger(MlAuthService.name);
  private readonly baseUrl = 'https://api.mercadolibre.com';
  private readonly authUrl = 'https://auth.mercadolibre.cl';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getAuthorizeUrl(): string {
    const appId     = this.config.getOrThrow('ML_APP_ID');
    const redirect  = this.config.getOrThrow('ML_REDIRECT_URI');
    return `${this.authUrl}/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirect)}`;
  }

  async exchangeCode(code: string): Promise<MlTokenSet> {
    const tokens = await this.fetchTokens({ grant_type: 'authorization_code', code });
    await this.persist(tokens);
    return tokens;
  }

  async refreshTokens(sellerId: string): Promise<MlTokenSet> {
    const stored = await this.prisma.mlToken.findUnique({ where: { sellerId } });
    if (!stored) throw new UnauthorizedException('No ML token found for seller');

    const tokens = await this.fetchTokens({
      grant_type: 'refresh_token',
      refresh_token: stored.refreshToken,
    });
    await this.persist(tokens);
    return tokens;
  }

  async getValidToken(sellerId: string): Promise<string> {
    const stored = await this.prisma.mlToken.findUnique({ where: { sellerId } });
    if (!stored) throw new UnauthorizedException('ML not connected. Authorize first.');

    // Refresh if expires in less than 5 minutes
    const expiresInMs = stored.expiresAt.getTime() - Date.now();
    if (expiresInMs < 5 * 60 * 1000) {
      this.logger.log(`Refreshing ML token for seller ${sellerId}`);
      const refreshed = await this.refreshTokens(sellerId);
      return refreshed.accessToken;
    }

    return stored.accessToken;
  }

  async getStoredSellerId(): Promise<string | null> {
    const token = await this.prisma.mlToken.findFirst();
    return token?.sellerId ?? null;
  }

  private async fetchTokens(body: Record<string, string>): Promise<MlTokenSet> {
    const appId    = this.config.getOrThrow('ML_APP_ID');
    const secret   = this.config.getOrThrow('ML_CLIENT_SECRET');
    const redirect = this.config.getOrThrow('ML_REDIRECT_URI');

    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        ...body,
        client_id: appId,
        client_secret: secret,
        redirect_uri: redirect,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`ML token error: ${err}`);
      throw new UnauthorizedException(`ML OAuth error: ${res.status}`);
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: number;
    };

    return {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      expiresAt:    new Date(Date.now() + data.expires_in * 1000),
      sellerId:     String(data.user_id),
    };
  }

  private async persist(tokens: MlTokenSet): Promise<void> {
    await this.prisma.mlToken.upsert({
      where:  { sellerId: tokens.sellerId },
      create: {
        sellerId:     tokens.sellerId,
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
      },
      update: {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
      },
    });
  }
}
