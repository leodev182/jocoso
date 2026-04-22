import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { TotpService } from '../../../infrastructure/security/totp.service';

@Injectable()
export class Setup2faUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly totp: TotpService,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { secret, otpauthUrl } = this.totp.generateSecret(user.getEmail());
    user.setTwoFactorSecret(secret);
    await this.userRepo.update(user);

    return { secret, otpauthUrl };
  }
}
