import { Injectable, Inject } from '@nestjs/common';
import { IStockRepository, STOCK_REPOSITORY } from '../../../domain/stock/repositories/stock.repository';
import { IStockMovementRepository, STOCK_MOVEMENT_REPOSITORY } from '../../../domain/stock/repositories/stock-movement.repository';
import { StockDomainService } from '../../../domain/stock/services/stock.domain.service';
import { StockMovement, StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';

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
  }
}
