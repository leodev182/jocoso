import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';

@Injectable()
export class SetUserActiveUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(id: string, isActive: boolean): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (isActive) user.activate();
    else user.deactivate();
    await this.userRepo.update(user);
  }
}
