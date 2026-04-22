import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { ITokenService, TOKEN_SERVICE } from '../ports/token.service';
import { BcryptService } from '../../../infrastructure/security/bcrypt.service';
import { AuthDomainService } from '../../../domain/auth/services/auth.domain.service';
import { User } from '../../../domain/auth/entities/user.entity';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly tokenRepo: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly bcrypt: BcryptService,
    private readonly authDomain: AuthDomainService,
  ) {}

  async execute(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email.toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!this.authDomain.canLogin(user)) {
      throw new UnauthorizedException('Account not available');
    }

    const valid = await this.bcrypt.compare(password, user.getPasswordHash());
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  private async issueTokens(user: User) {
    const accessToken = this.tokenService.generateAccessToken(
      user.getId(), user.getEmail(), user.getRole(),
    );
    const rawRefresh = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashToken(rawRefresh);

    await this.tokenRepo.create(
      user.getId(),
      tokenHash,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    );

    return { accessToken, refreshToken: rawRefresh };
  }
}
