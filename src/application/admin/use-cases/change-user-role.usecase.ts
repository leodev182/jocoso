import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { Role } from '../../../domain/auth/entities/user.entity';

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(targetId: string, role: Role): Promise<void> {
    const user = await this.userRepo.findById(targetId);
    if (!user) throw new NotFoundException(`User ${targetId} not found`);
    await this.userRepo.updateRole(targetId, role);
  }
}
