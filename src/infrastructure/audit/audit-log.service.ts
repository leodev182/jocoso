import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  status?: 'success' | 'error';
  errorMessage?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        changes: entry.changes as any,
        ip: entry.ip,
        userAgent: entry.userAgent,
        status: entry.status ?? 'success',
        errorMessage: entry.errorMessage,
      },
    });
  }
}
