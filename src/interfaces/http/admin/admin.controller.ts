import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, ValidationPipe,
} from '@nestjs/common';
import { getEntries } from '../../../infrastructure/logging/log-store';
import { JwtAuthGuard } from '../../../infrastructure/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../../infrastructure/security/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../../../infrastructure/audit/audit.decorator';
import { Role } from '../../../domain/auth/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ListUsersUseCase } from '../../../application/admin/use-cases/list-users.usecase';
import { ChangeUserRoleUseCase } from '../../../application/admin/use-cases/change-user-role.usecase';
import { SetUserActiveUseCase } from '../../../application/admin/use-cases/set-user-active.usecase';
import { ListAuditLogsUseCase } from '../../../application/admin/use-cases/list-audit-logs.usecase';
import { GetAdminStatsUseCase } from '../../../application/admin/use-cases/get-admin-stats.usecase';
import { SearchClientsUseCase } from '../../../application/admin/use-cases/search-clients.usecase';
import { CreateManualClientUseCase } from '../../../application/admin/use-cases/create-manual-client.usecase';
import { CreateManualOrderUseCase } from '../../../application/admin/use-cases/create-manual-order.usecase';
import { ChangeRoleDto } from './dto/change-role.dto';
import { SetUserActiveDto } from './dto/set-user-active.dto';
import { CreateManualClientDto } from './dto/create-manual-client.dto';
import { CreateManualOrderDto } from './dto/create-manual-order.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly changeRole: ChangeUserRoleUseCase,
    private readonly setUserActive: SetUserActiveUseCase,
    private readonly listAuditLogs: ListAuditLogsUseCase,
    private readonly getStats: GetAdminStatsUseCase,
    private readonly searchClients: SearchClientsUseCase,
    private readonly createManualClient: CreateManualClientUseCase,
    private readonly createManualOrder: CreateManualOrderUseCase,
  ) {}

  @Get('stats')
  getAdminStats() {
    return this.getStats.execute();
  }

  @Get('users')
  getUsers(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) pagination?: PaginationDto,
  ) {
    return this.listUsers.execute(pagination?.page, pagination?.limit);
  }

  @Patch('users/:id/role')
  @Audit({ action: 'USER_ROLE_CHANGE', resource: 'admin' })
  @HttpCode(HttpStatus.NO_CONTENT)
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.changeRole.execute(id, dto.role);
  }

  // Banear / reactivar usuario (soft delete: isActive)
  @Patch('users/:id/status')
  @Audit({ action: 'USER_STATUS_CHANGE', resource: 'admin' })
  @HttpCode(HttpStatus.NO_CONTENT)
  setUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserActiveDto,
  ) {
    return this.setUserActive.execute(id, dto.isActive);
  }

  @Get('logs')
  getLogs(
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const minLevel = level ? parseInt(level, 10) : undefined;
    const take = limit ? parseInt(limit, 10) : 200;
    return { data: getEntries(minLevel, search, take) };
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query('userId') userId?: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) pagination?: PaginationDto,
  ) {
    return this.listAuditLogs.execute(pagination?.page, pagination?.limit, userId);
  }

  @Get('clients/search')
  searchClientsByQuery(@Query('q') q: string) {
    return this.searchClients.execute(q ?? '');
  }

  @Post('clients')
  @Audit({ action: 'MANUAL_CLIENT_CREATE', resource: 'admin' })
  createClient(@Body(new ValidationPipe({ whitelist: true })) dto: CreateManualClientDto) {
    return this.createManualClient.execute(dto);
  }

  @Post('orders/manual')
  @Audit({ action: 'MANUAL_ORDER_CREATE', resource: 'admin' })
  createOrder(@Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateManualOrderDto) {
    return this.createManualOrder.execute(dto);
  }
}
