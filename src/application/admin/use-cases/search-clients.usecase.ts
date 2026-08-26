import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';

@Injectable()
export class SearchClientsUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async execute(query: string) {
    const users = await this.userRepo.searchByEmailOrName(query.trim(), 10);
    return users.map((u) => ({
      id: u.getId(),
      email: u.getEmail(),
      name: u.getName(),
      phone: u.getPhone(),
    }));
  }
}
