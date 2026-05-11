import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(page = 1, limit = 50, userId?: string) {
    const where = userId ? { userId } : {};
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          resource: true,
          resourceId: true,
          ip: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data: logs, total, page, limit };
  }
}
