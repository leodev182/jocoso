import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(page = 1, limit = 20) {
    const { users, total } = await this.userRepo.findAll(page, limit);
    return {
      data: users.map((u) => ({
        id: u.getId(),
        name: u.getName(),
        email: u.getEmail(),
        phone: u.getPhone(),
        role: u.getRole(),
        isActive: u.getIsActive(),
      })),
      total,
      page,
      limit,
    };
  }
}
