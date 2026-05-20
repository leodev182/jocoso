import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const d = user.toPersistence();
    return {
      id: d.id,
      email: d.email,
      name: d.name,
      phone: d.phone,
      role: d.role,
      twoFactorEnabled: d.twoFactorEnabled,
      isActive: d.isActive,
    };
  }
}
