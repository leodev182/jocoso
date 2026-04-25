import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { StockDomainService, ML_STOCK_RESERVE } from './stock.domain.service';
import { Stock } from '../entities/stock.entity';
import { StockSource } from '../entities/stock-movement.entity';

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

    it('passes when stock exactly equals amount (source ADMIN)', () => {
      const stock = Stock.reconstitute('v-1', 5);
      expect(() => svc.validateDecrease(stock, 5, StockSource.ADMIN)).not.toThrow();
    });

    describe('ML reserve — venta WEB', () => {
      it('bloquea venta web cuando el restante quedaría por debajo del umbral ML', () => {
        // stock=5, pide=3 → remaining=2 < ML_STOCK_RESERVE(3) → bloqueado
        const stock = Stock.reconstitute('v-1', 5);
        expect(() => svc.validateDecrease(stock, 3, StockSource.WEB)).toThrow(UnprocessableEntityException);
      });

      it('bloquea venta web cuando el restante quedaría exactamente en el umbral - 1', () => {
        // stock=4, pide=2 → remaining=2 < 3 → bloqueado
        const stock = Stock.reconstitute('v-1', 4);
        expect(() => svc.validateDecrease(stock, 2, StockSource.WEB)).toThrow(UnprocessableEntityException);
      });

      it('permite venta web cuando el restante queda exactamente en el umbral', () => {
        // stock=5, pide=2 → remaining=3 === ML_STOCK_RESERVE → permitido
        const stock = Stock.reconstitute('v-1', 5);
        expect(() => svc.validateDecrease(stock, 2, StockSource.WEB)).not.toThrow();
      });

      it('permite venta web cuando el restante supera el umbral', () => {
        // stock=10, pide=5 → remaining=5 > 3 → permitido
        const stock = Stock.reconstitute('v-1', 10);
        expect(() => svc.validateDecrease(stock, 5, StockSource.WEB)).not.toThrow();
      });

      it('permite venta ML aunque el restante quede por debajo del umbral', () => {
        // ML puede vender los últimos 3 sin restricción
        const stock = Stock.reconstitute('v-1', 3);
        expect(() => svc.validateDecrease(stock, 3, StockSource.ML)).not.toThrow();
      });

      it('permite ajuste ADMIN aunque el restante quede por debajo del umbral', () => {
        const stock = Stock.reconstitute('v-1', 3);
        expect(() => svc.validateDecrease(stock, 3, StockSource.ADMIN)).not.toThrow();
      });

      it(`ML_STOCK_RESERVE es ${ML_STOCK_RESERVE}`, () => {
        expect(ML_STOCK_RESERVE).toBe(3);
      });
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
