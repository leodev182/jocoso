import { StockMovement } from '../entities/stock-movement.entity';

export interface IStockMovementRepository {
  findByExternalId(externalId: string): Promise<StockMovement | null>;
  findByVariantId(variantId: string, limit?: number): Promise<StockMovement[]>;
}

export const STOCK_MOVEMENT_REPOSITORY = Symbol('IStockMovementRepository');
