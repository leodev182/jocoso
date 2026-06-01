import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { IGoogleVerifier, GoogleProfile } from '../../../application/auth/ports/google-verifier';

@Injectable()
export class GoogleVerifierService implements IGoogleVerifier {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(config: ConfigService) {
    this.clientId = config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Token de Google sin datos suficientes');
    }
    if (payload.email_verified === false) {
      throw new UnauthorizedException('El email de Google no está verificado');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
    };
  }
}
