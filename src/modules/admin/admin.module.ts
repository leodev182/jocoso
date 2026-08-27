import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/auth/repositories/user.repository';
import { ORDER_REPOSITORY } from '../../domain/orders/repositories/order.repository';
import { PAYMENT_REPOSITORY } from '../../domain/payments/repositories/payment.repository';
import { UserPrismaRepository } from '../../infrastructure/auth/user.prisma-repo';
import { OrderPrismaRepository } from '../../infrastructure/orders/order.prisma-repo';
import { PaymentPrismaRepository } from '../../infrastructure/payments/payment.prisma-repo';
import { ListUsersUseCase } from '../../application/admin/use-cases/list-users.usecase';
import { ChangeUserRoleUseCase } from '../../application/admin/use-cases/change-user-role.usecase';
import { SetUserActiveUseCase } from '../../application/admin/use-cases/set-user-active.usecase';
import { ListAuditLogsUseCase } from '../../application/admin/use-cases/list-audit-logs.usecase';
import { GetAdminStatsUseCase } from '../../application/admin/use-cases/get-admin-stats.usecase';
import { SearchClientsUseCase } from '../../application/admin/use-cases/search-clients.usecase';
import { CreateManualClientUseCase } from '../../application/admin/use-cases/create-manual-client.usecase';
import { CreateManualOrderUseCase } from '../../application/admin/use-cases/create-manual-order.usecase';
import { SendOrderConfirmationUseCase } from '../../application/email/use-cases/send-order-confirmation.usecase';
import { AdminController } from '../../interfaces/http/admin/admin.controller';
import { StockModule } from '../stock/stock.module';
import { ProductsModule } from '../products/products.module';
import { ConcursosModule } from '../concursos/concursos.module';

@Module({
  imports: [StockModule, ProductsModule, ConcursosModule],
  controllers: [AdminController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: ORDER_REPOSITORY, useClass: OrderPrismaRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PaymentPrismaRepository },
    ListUsersUseCase,
    ChangeUserRoleUseCase,
    SetUserActiveUseCase,
    ListAuditLogsUseCase,
    GetAdminStatsUseCase,
    SearchClientsUseCase,
    CreateManualClientUseCase,
    CreateManualOrderUseCase,
    SendOrderConfirmationUseCase,
  ],
})
export class AdminModule {}
