import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';

export interface UpdateProfileCommand {
  userId: string;
  name?: string;
  phone?: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(cmd: UpdateProfileCommand): Promise<void> {
    const user = await this.repo.findById(cmd.userId);
    if (!user) throw new NotFoundException('User not found');

    user.updateProfile(
      cmd.name !== undefined ? cmd.name : user.getName(),
      cmd.phone !== undefined ? cmd.phone : user.getPhone(),
    );

    await this.repo.update(user);
  }
}
