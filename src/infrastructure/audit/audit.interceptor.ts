import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AUDIT_KEY, AuditMeta } from './audit.decorator';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLog: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.id;
    if (!userId) return next.handle();

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    const userAgent = req.headers['user-agent'] as string | undefined;

    return next.handle().pipe(
      tap(async (response) => {
        const resourceId: string | undefined = response?.id ?? response?.orderId;
        await this.auditLog.log({
          userId,
          action: meta.action,
          resource: meta.resource,
          resourceId,
          ip,
          userAgent,
          status: 'success',
        });
      }),
      catchError((err) => {
        this.auditLog
          .log({
            userId,
            action: meta.action,
            resource: meta.resource,
            ip,
            userAgent,
            status: 'error',
            errorMessage: err?.message,
          })
          .catch(() => {});
        return throwError(() => err);
      }),
    );
  }
}
