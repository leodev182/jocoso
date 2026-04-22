import { Stock } from '../entities/stock.entity';
import { StockMovement } from '../entities/stock-movement.entity';

export interface IStockRepository {
  findByVariantId(variantId: string): Promise<Stock | null>;
  decreaseWithLock(variantId: string, amount: number, movement: StockMovement): Promise<void>;
  increase(variantId: string, amount: number, movement: StockMovement): Promise<void>;
}

export const STOCK_REPOSITORY = Symbol('IStockRepository');
