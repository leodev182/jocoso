import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { User } from '../../../domain/auth/entities/user.entity';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { ITokenService, TOKEN_SERVICE } from '../ports/token.service';
import { BcryptService } from '../../../infrastructure/security/bcrypt.service';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly tokenRepo: IRefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly bcrypt: BcryptService,
  ) {}

  async execute(email: string, password: string) {
    const exists = await this.userRepo.findByEmail(email.toLowerCase());
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await this.bcrypt.hash(password);
    const user = User.create(email, passwordHash);
    await this.userRepo.save(user);

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
