import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';

@Injectable()
export class TotpService {
  generateSecret(email: string): { secret: string; otpauthUrl: string } {
    const generated = speakeasy.generateSecret({
      name: `Jocoso (${email})`,
      issuer: 'Jocoso',
    });
    return { secret: generated.base32, otpauthUrl: generated.otpauth_url! };
  }

  verify(secret: string, token: string): boolean {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  }
}
