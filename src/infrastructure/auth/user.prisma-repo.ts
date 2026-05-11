import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IUserRepository } from '../../domain/auth/repositories/user.repository';
import { User, Role, UserProps } from '../../domain/auth/entities/user.entity';
import { Role as PrismaRole } from '../../../generated/prisma/client';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async save(user: User): Promise<void> {
    const data = user.toPersistence();
    await this.prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        role: this.toPrismaRole(data.role),
        twoFactorSecret: data.twoFactorSecret,
        twoFactorEnabled: data.twoFactorEnabled,
      },
    });
  }

  async findAll(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);
    return { users: rows.map((r) => this.toEntity(r)), total };
  }

  async update(user: User): Promise<void> {
    const data = user.toPersistence();
    await this.prisma.user.update({
      where: { id: data.id },
      data: {
        twoFactorSecret: data.twoFactorSecret,
        twoFactorEnabled: data.twoFactorEnabled,
      },
    });
  }

  async updateRole(id: string, role: Role): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { role: this.toPrismaRole(role) },
    });
  }

  private toEntity(row: any): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as Role,
      twoFactorSecret: row.twoFactorSecret,
      twoFactorEnabled: row.twoFactorEnabled,
      createdAt: row.createdAt,
    } as UserProps);
  }

  private toPrismaRole(role: Role): PrismaRole {
    return role as unknown as PrismaRole;
  }
}
