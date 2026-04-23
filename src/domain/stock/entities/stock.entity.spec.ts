import { Stock } from './stock.entity';

describe('Stock entity', () => {
  describe('canDecrease()', () => {
    it('returns true when quantity equals amount', () => {
      const s = Stock.reconstitute('v-1', 5);
      expect(s.canDecrease(5)).toBe(true);
    });

    it('returns true when quantity is greater than amount', () => {
      const s = Stock.reconstitute('v-1', 10);
      expect(s.canDecrease(3)).toBe(true);
    });

    it('returns false when insufficient stock', () => {
      const s = Stock.reconstitute('v-1', 2);
      expect(s.canDecrease(3)).toBe(false);
    });

    it('returns false when stock is zero', () => {
      const s = Stock.reconstitute('v-1', 0);
      expect(s.canDecrease(1)).toBe(false);
    });

    it('returns false when amount is zero', () => {
      const s = Stock.reconstitute('v-1', 10);
      expect(s.canDecrease(0)).toBe(false);
    });

    it('returns false when amount is negative', () => {
      const s = Stock.reconstitute('v-1', 10);
      expect(s.canDecrease(-1)).toBe(false);
    });
  });

  describe('reconstitute()', () => {
    it('exposes variantId and quantity', () => {
      const s = Stock.reconstitute('v-abc', 42);
      expect(s.getVariantId()).toBe('v-abc');
      expect(s.getQuantity()).toBe(42);
    });
  });
});
