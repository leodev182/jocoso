import { Payment, PaymentStatus } from './payment.entity';

function makePending(): Payment {
  return Payment.create('order-1', 100);
}

describe('Payment entity — FSM', () => {
  describe('create()', () => {
    it('starts in PENDING with null gatewayId', () => {
      const p = makePending();
      expect(p.getStatus()).toBe(PaymentStatus.PENDING);
      expect(p.getGatewayId()).toBeNull();
      expect(p.getId()).toBeTruthy();
      expect(p.getOrderId()).toBe('order-1');
      expect(p.getAmount()).toBe(100);
    });
  });

  describe('approve()', () => {
    it('transitions PENDING → APPROVED and stores gatewayId', () => {
      const p = makePending();
      p.approve('gw-123');
      expect(p.getStatus()).toBe(PaymentStatus.APPROVED);
      expect(p.getGatewayId()).toBe('gw-123');
    });

    it('throws when already APPROVED', () => {
      const p = makePending();
      p.approve('gw-1');
      expect(() => p.approve('gw-2')).toThrow('Invalid payment transition');
    });

    it('throws when CANCELLED', () => {
      const p = makePending();
      p.cancel();
      expect(() => p.approve('gw-1')).toThrow('Invalid payment transition');
    });

    it('throws when REJECTED', () => {
      const p = makePending();
      p.reject();
      expect(() => p.approve('gw-1')).toThrow('Invalid payment transition');
    });
  });

  describe('reject()', () => {
    it('transitions PENDING → REJECTED', () => {
      const p = makePending();
      p.reject();
      expect(p.getStatus()).toBe(PaymentStatus.REJECTED);
    });

    it('throws when APPROVED', () => {
      const p = makePending();
      p.approve('gw-1');
      expect(() => p.reject()).toThrow('Invalid payment transition');
    });
  });

  describe('cancel()', () => {
    it('transitions PENDING → CANCELLED', () => {
      const p = makePending();
      p.cancel();
      expect(p.getStatus()).toBe(PaymentStatus.CANCELLED);
    });

    it('throws when already APPROVED', () => {
      const p = makePending();
      p.approve('gw-1');
      expect(() => p.cancel()).toThrow('Invalid payment transition');
    });
  });

  describe('settle()', () => {
    it('transitions APPROVED → SETTLED', () => {
      const p = makePending();
      p.approve('gw-1');
      p.settle();
      expect(p.getStatus()).toBe(PaymentStatus.SETTLED);
    });

    it('throws when PENDING', () => {
      const p = makePending();
      expect(() => p.settle()).toThrow('Invalid payment transition');
    });
  });

  describe('reconstitute()', () => {
    it('restores all props without touching state', () => {
      const now = new Date();
      const p = Payment.reconstitute({
        id: 'pay-1', orderId: 'ord-1', amount: 500,
        status: PaymentStatus.APPROVED, gatewayId: 'gw-x',
        createdAt: now, updatedAt: now,
      });
      expect(p.getStatus()).toBe(PaymentStatus.APPROVED);
      expect(p.getGatewayId()).toBe('gw-x');
    });
  });

  describe('toPersistence()', () => {
    it('serializes all fields', () => {
      const p = makePending();
      const d = p.toPersistence();
      expect(d.orderId).toBe('order-1');
      expect(d.amount).toBe(100);
      expect(d.status).toBe(PaymentStatus.PENDING);
      expect(d.gatewayId).toBeNull();
    });
  });
});
