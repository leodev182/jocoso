import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { ITokenService, TOKEN_SERVICE } from '../ports/token.service';
import { User } from '../../../domain/auth/entities/user.entity';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly tokenRepo: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(rawToken: string) {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const stored = await this.tokenRepo.findByTokenHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.tokenRepo.revoke(stored.id);

    const user = await this.userRepo.findById(stored.userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokens(user);
  }

  private async issueTokens(user: User) {
    const accessToken = this.tokenService.generateAccessToken(
      user.getId(), user.getEmail(), user.getRole(),
    );
    const rawRefresh = this.tokenService.generateRefreshToken();
    const newHash = this.tokenService.hashToken(rawRefresh);

    await this.tokenRepo.create(
      user.getId(),
      newHash,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    );

    return { accessToken, refreshToken: rawRefresh };
  }
}
