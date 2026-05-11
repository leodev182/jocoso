import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IStockRepository, STOCK_REPOSITORY } from '../../../domain/stock/repositories/stock.repository';
import { IStockMovementRepository, STOCK_MOVEMENT_REPOSITORY } from '../../../domain/stock/repositories/stock-movement.repository';
import { StockDomainService } from '../../../domain/stock/services/stock.domain.service';
import { StockMovement, StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';
import { STOCK_SYNC_QUEUE } from '../../../infrastructure/queue/stock-sync.processor';

export interface IncreaseStockCommand {
  variantId: string;
  quantity: number;
  source: StockSource;
  referenceType: ReferenceType;
  referenceId?: string;
  userId?: string;
}

@Injectable()
export class IncreaseStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY) private readonly stockRepo: IStockRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly movementRepo: IStockMovementRepository,
    private readonly stockDomain: StockDomainService,
    @Optional() @InjectQueue(STOCK_SYNC_QUEUE) private readonly syncQueue?: Queue,
  ) {}

  async execute(cmd: IncreaseStockCommand): Promise<void> {
    this.stockDomain.validateIncrease(cmd.quantity);

    const stock = await this.stockRepo.findByVariantId(cmd.variantId);
    this.stockDomain.assertExists(stock, cmd.variantId);

    const movement = StockMovement.create({
      variantId: cmd.variantId,
      quantity: +cmd.quantity,
      source: cmd.source,
      referenceType: cmd.referenceType,
      referenceId: cmd.referenceId,
      userId: cmd.userId,
    });

    await this.stockRepo.increase(cmd.variantId, cmd.quantity, movement);

    if (cmd.source === StockSource.ADMIN && this.syncQueue) {
      await this.syncQueue.add('sync-variant', { variantId: cmd.variantId });
    }
  }
}
