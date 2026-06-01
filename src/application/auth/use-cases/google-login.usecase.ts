import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { ITokenService, TOKEN_SERVICE } from '../ports/token.service';
import { IGoogleVerifier, GOOGLE_VERIFIER } from '../ports/google-verifier';
import { AuthDomainService } from '../../../domain/auth/services/auth.domain.service';
import { User } from '../../../domain/auth/entities/user.entity';

const REFRESH_TOKEN_TTL_MS: Record<string, number> = {
  ADMIN:    7 * 24 * 60 * 60 * 1000,
  SUPPORT:  7 * 24 * 60 * 60 * 1000,
  CUSTOMER: 3 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly tokenRepo: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    @Inject(GOOGLE_VERIFIER) private readonly google: IGoogleVerifier,
    private readonly authDomain: AuthDomainService,
  ) {}

  async execute(idToken: string) {
    const profile = await this.google.verify(idToken);

    // 1. Usuario ya vinculado por googleId
    let user = await this.userRepo.findByGoogleId(profile.googleId);

    // 2. Existe por email (cuenta previa) → vincular (email verificado por Google)
    if (!user) {
      const byEmail = await this.userRepo.findByEmail(profile.email.toLowerCase());
      if (byEmail) {
        byEmail.setGoogleId(profile.googleId);
        await this.userRepo.update(byEmail);
        user = byEmail;
      }
    }

    // 3. Usuario nuevo
    if (!user) {
      user = User.createWithGoogle(profile.email, profile.googleId, profile.name);
      await this.userRepo.save(user);
    }

    if (!this.authDomain.canLogin(user)) {
      throw new UnauthorizedException('Account not available');
    }

    const tokens = await this.issueTokens(user);
    return {
      user: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        phone: user.getPhone(),
        role: user.getRole(),
      },
      ...tokens,
    };
  }

  private async issueTokens(user: User) {
    const accessToken = this.tokenService.generateAccessToken(
      user.getId(), user.getEmail(), user.getRole(),
    );
    const rawRefresh = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashToken(rawRefresh);

    const ttl = REFRESH_TOKEN_TTL_MS[user.getRole()] ?? REFRESH_TOKEN_TTL_MS['CUSTOMER'];
    await this.tokenRepo.create(user.getId(), tokenHash, new Date(Date.now() + ttl));

    return { accessToken, refreshToken: rawRefresh };
  }
}
