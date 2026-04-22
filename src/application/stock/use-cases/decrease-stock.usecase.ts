import { Injectable, Inject } from '@nestjs/common';
import { IStockRepository, STOCK_REPOSITORY } from '../../../domain/stock/repositories/stock.repository';
import { IStockMovementRepository, STOCK_MOVEMENT_REPOSITORY } from '../../../domain/stock/repositories/stock-movement.repository';
import { StockDomainService } from '../../../domain/stock/services/stock.domain.service';
import { StockMovement, StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';

export interface DecreaseStockCommand {
  variantId: string;
  quantity: number;
  source: StockSource;
  referenceType: ReferenceType;
  referenceId?: string;
  externalId?: string;
  userId?: string;
}

@Injectable()
export class DecreaseStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY) private readonly stockRepo: IStockRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly movementRepo: IStockMovementRepository,
    private readonly stockDomain: StockDomainService,
  ) {}

  async execute(cmd: DecreaseStockCommand): Promise<void> {
    // Idempotency — if same external event already processed, skip
    if (cmd.externalId) {
      const existing = await this.movementRepo.findByExternalId(cmd.externalId);
      if (existing) return;
    }

    const stock = await this.stockRepo.findByVariantId(cmd.variantId);
    this.stockDomain.assertExists(stock, cmd.variantId);
    this.stockDomain.validateDecrease(stock!, cmd.quantity);

    const movement = StockMovement.create({
      variantId: cmd.variantId,
      quantity: -cmd.quantity,
      source: cmd.source,
      referenceType: cmd.referenceType,
      referenceId: cmd.referenceId,
      externalId: cmd.externalId,
      userId: cmd.userId,
    });

    await this.stockRepo.decreaseWithLock(cmd.variantId, cmd.quantity, movement);
  }
}
