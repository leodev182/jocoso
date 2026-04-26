import { Injectable, Inject } from '@nestjs/common';
import { IStockRepository, STOCK_REPOSITORY } from '../../../domain/stock/repositories/stock.repository';
import { IStockMovementRepository, STOCK_MOVEMENT_REPOSITORY } from '../../../domain/stock/repositories/stock-movement.repository';
import { StockDomainService } from '../../../domain/stock/services/stock.domain.service';

@Injectable()
export class GetStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY) private readonly stockRepo: IStockRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly movementRepo: IStockMovementRepository,
    private readonly stockDomain: StockDomainService,
  ) {}

  async getStock(variantId: string) {
    const stock = await this.stockRepo.findByVariantId(variantId);
    this.stockDomain.assertExists(stock, variantId);
    return { variantId, quantity: stock!.getQuantity() };
  }

  async getMovements(variantId: string, page = 1, limit = 20) {
    const stock = await this.stockRepo.findByVariantId(variantId);
    this.stockDomain.assertExists(stock, variantId);
    const movements = await this.movementRepo.findByVariantId(variantId, limit, (page - 1) * limit);
    const total = movements.length < limit && page === 1 ? movements.length : undefined;
    return { data: movements, page, limit, ...(total !== undefined && { total, totalPages: 1 }) };
  }
}
