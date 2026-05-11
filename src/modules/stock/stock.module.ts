import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StockDomainService } from '../../domain/stock/services/stock.domain.service';
import { STOCK_REPOSITORY } from '../../domain/stock/repositories/stock.repository';
import { STOCK_MOVEMENT_REPOSITORY } from '../../domain/stock/repositories/stock-movement.repository';
import { DecreaseStockUseCase } from '../../application/stock/use-cases/decrease-stock.usecase';
import { IncreaseStockUseCase } from '../../application/stock/use-cases/increase-stock.usecase';
import { GetStockUseCase } from '../../application/stock/use-cases/get-stock.usecase';
import { StockPrismaRepository } from '../../infrastructure/stock/stock.prisma-repo';
import { StockMovementPrismaRepository } from '../../infrastructure/stock/stock-movement.prisma-repo';
import { StockController } from '../../interfaces/http/stock/stock.controller';
import { STOCK_SYNC_QUEUE } from '../../infrastructure/queue/stock-sync.processor';

@Module({
  imports: [BullModule.registerQueue({ name: STOCK_SYNC_QUEUE })],
  controllers: [StockController],
  providers: [
    StockDomainService,
    DecreaseStockUseCase,
    IncreaseStockUseCase,
    GetStockUseCase,
    { provide: STOCK_REPOSITORY, useClass: StockPrismaRepository },
    { provide: STOCK_MOVEMENT_REPOSITORY, useClass: StockMovementPrismaRepository },
  ],
  exports: [DecreaseStockUseCase, IncreaseStockUseCase],
})
export class StockModule {}
