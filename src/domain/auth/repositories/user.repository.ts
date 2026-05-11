import { User, Role } from '../entities/user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(page: number, limit: number): Promise<{ users: User[]; total: number }>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  updateRole(id: string, role: Role): Promise<void>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
