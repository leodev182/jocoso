import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { Stock } from '../entities/stock.entity';
import { StockSource } from '../entities/stock-movement.entity';

// Unidades mínimas reservadas para MercadoLibre.
// Cuando el stock disponible es <= este umbral, las ventas web se bloquean
// para evitar conflictos de concurrencia entre ambos canales.
export const ML_STOCK_RESERVE = 3;

export class StockDomainService {
  validateDecrease(stock: Stock, amount: number, source: StockSource = StockSource.ADMIN): void {
    if (amount <= 0) throw new UnprocessableEntityException('Amount must be greater than zero');
    if (!stock.canDecrease(amount)) {
      throw new UnprocessableEntityException(
        `Insufficient stock. Available: ${stock.getQuantity()}, requested: ${amount}`,
      );
    }

    // Ventas web no pueden consumir el stock reservado para ML
    if (source === StockSource.WEB) {
      const remaining = stock.getQuantity() - amount;
      if (remaining < ML_STOCK_RESERVE) {
        throw new UnprocessableEntityException(
          `Stock insuficiente para venta web. Quedan ${stock.getQuantity()} unidades pero se reservan ${ML_STOCK_RESERVE} para MercadoLibre.`,
        );
      }
    }
  }

  validateIncrease(amount: number): void {
    if (amount <= 0) throw new UnprocessableEntityException('Amount must be greater than zero');
  }

  assertExists(stock: Stock | null, variantId: string): asserts stock is Stock {
    if (!stock) throw new NotFoundException(`Variant ${variantId} not found`);
  }
}
