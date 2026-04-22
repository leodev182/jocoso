import { Injectable, Inject, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { TotpService } from '../../../infrastructure/security/totp.service';

@Injectable()
export class Verify2faUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly totp: TotpService,
  ) {}

  async execute(userId: string, token: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const secret = user.getTwoFactorSecret();
    if (!secret) throw new BadRequestException('2FA not set up');

    if (!this.totp.verify(secret, token)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    user.enableTwoFactor();
    await this.userRepo.update(user);

    return { enabled: true };
  }
}
