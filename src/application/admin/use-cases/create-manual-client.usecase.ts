import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { User } from '../../../domain/auth/entities/user.entity';

export interface CreateManualClientCommand {
  email: string;
  name: string;
  phone?: string;
}

@Injectable()
export class CreateManualClientUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(cmd: CreateManualClientCommand): Promise<{ id: string; email: string; name: string | null; phone: string | null }> {
    const existing = await this.userRepo.findByEmail(cmd.email.toLowerCase());
    if (existing) throw new ConflictException(`Ya existe un cliente con el email ${cmd.email}`);

    const user = User.createManual(cmd.email, cmd.name, cmd.phone ?? null);
    await this.userRepo.save(user);

    return { id: user.getId(), email: user.getEmail(), name: user.getName(), phone: user.getPhone() };
  }
}
