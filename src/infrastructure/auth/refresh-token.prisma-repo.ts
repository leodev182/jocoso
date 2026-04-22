import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IRefreshTokenRepository, RefreshTokenRecord } from '../../domain/auth/repositories/refresh-token.repository';

@Injectable()
export class RefreshTokenPrismaRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findByTokenHash(hash: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
