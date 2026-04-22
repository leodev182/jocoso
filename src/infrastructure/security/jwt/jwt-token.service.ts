import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ITokenService } from '../../../application/auth/ports/token.service';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwt: JwtService) {}

  generateAccessToken(userId: string, email: string, role: string): string {
    return this.jwt.sign({ sub: userId, email, role }, { expiresIn: '15m' });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
