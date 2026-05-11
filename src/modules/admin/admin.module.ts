import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/auth/repositories/user.repository';
import { UserPrismaRepository } from '../../infrastructure/auth/user.prisma-repo';
import { ListUsersUseCase } from '../../application/admin/use-cases/list-users.usecase';
import { ChangeUserRoleUseCase } from '../../application/admin/use-cases/change-user-role.usecase';
import { ListAuditLogsUseCase } from '../../application/admin/use-cases/list-audit-logs.usecase';
import { AdminController } from '../../interfaces/http/admin/admin.controller';

@Module({
  controllers: [AdminController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    ListUsersUseCase,
    ChangeUserRoleUseCase,
    ListAuditLogsUseCase,
  ],
})
export class AdminModule {}
