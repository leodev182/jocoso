import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { StockDomainService } from './stock.domain.service';
import { Stock } from '../entities/stock.entity';

describe('StockDomainService', () => {
  const svc = new StockDomainService();

  describe('validateDecrease()', () => {
    it('throws when amount is zero', () => {
      const stock = Stock.reconstitute('v-1', 10);
      expect(() => svc.validateDecrease(stock, 0)).toThrow(UnprocessableEntityException);
    });

    it('throws when amount is negative', () => {
      const stock = Stock.reconstitute('v-1', 10);
      expect(() => svc.validateDecrease(stock, -5)).toThrow(UnprocessableEntityException);
    });

    it('throws when stock is insufficient', () => {
      const stock = Stock.reconstitute('v-1', 2);
      expect(() => svc.validateDecrease(stock, 5)).toThrow(UnprocessableEntityException);
    });

    it('passes when stock exactly equals amount', () => {
      const stock = Stock.reconstitute('v-1', 5);
      expect(() => svc.validateDecrease(stock, 5)).not.toThrow();
    });
  });

  describe('validateIncrease()', () => {
    it('throws when amount is zero', () => {
      expect(() => svc.validateIncrease(0)).toThrow(UnprocessableEntityException);
    });

    it('passes for positive amount', () => {
      expect(() => svc.validateIncrease(1)).not.toThrow();
    });
  });

  describe('assertExists()', () => {
    it('throws NotFoundException when stock is null', () => {
      expect(() => svc.assertExists(null, 'v-missing')).toThrow(NotFoundException);
    });

    it('does not throw when stock exists', () => {
      const stock = Stock.reconstitute('v-1', 10);
      expect(() => svc.assertExists(stock, 'v-1')).not.toThrow();
    });
  });
});
