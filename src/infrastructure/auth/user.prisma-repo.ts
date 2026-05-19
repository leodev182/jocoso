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

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { googleId } });
    return row ? this.toEntity(row) : null;
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

  async save(user: User): Promise<void> {
    const d = user.toPersistence();
    await this.prisma.user.create({
      data: {
        id: d.id, email: d.email, passwordHash: d.passwordHash,
        googleId: d.googleId, name: d.name, phone: d.phone,
        role: this.toPrismaRole(d.role),
        twoFactorSecret: d.twoFactorSecret,
        twoFactorEnabled: d.twoFactorEnabled,
        isActive: d.isActive,
      },
    });
  }

  async update(user: User): Promise<void> {
    const d = user.toPersistence();
    await this.prisma.user.update({
      where: { id: d.id },
      data: {
        name: d.name, phone: d.phone, googleId: d.googleId,
        twoFactorSecret: d.twoFactorSecret,
        twoFactorEnabled: d.twoFactorEnabled,
        isActive: d.isActive,
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
      id: row.id, email: row.email,
      passwordHash: row.passwordHash ?? null,
      googleId: row.googleId ?? null,
      name: row.name ?? null, phone: row.phone ?? null,
      role: row.role as Role,
      twoFactorSecret: row.twoFactorSecret,
      twoFactorEnabled: row.twoFactorEnabled,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    } as UserProps);
  }

  private toPrismaRole(role: Role): PrismaRole {
    return role as unknown as PrismaRole;
  }
}
