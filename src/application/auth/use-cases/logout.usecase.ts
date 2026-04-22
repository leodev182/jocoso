import { Injectable, Inject } from '@nestjs/common';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { ITokenService, TOKEN_SERVICE } from '../ports/token.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly tokenRepo: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const stored = await this.tokenRepo.findByTokenHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await this.tokenRepo.revoke(stored.id);
    }
  }
}
