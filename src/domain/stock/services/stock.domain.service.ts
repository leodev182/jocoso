import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { Stock } from '../entities/stock.entity';

export class StockDomainService {
  validateDecrease(stock: Stock, amount: number): void {
    if (amount <= 0) throw new UnprocessableEntityException('Amount must be greater than zero');
    if (!stock.canDecrease(amount)) {
      throw new UnprocessableEntityException(
        `Insufficient stock. Available: ${stock.getQuantity()}, requested: ${amount}`,
      );
    }
  }

  validateIncrease(amount: number): void {
    if (amount <= 0) throw new UnprocessableEntityException('Amount must be greater than zero');
  }

  assertExists(stock: Stock | null, variantId: string): asserts stock is Stock {
    if (!stock) throw new NotFoundException(`Variant ${variantId} not found`);
  }
}
