import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApprovePaymentUseCase } from './approve-payment.usecase';
import { Payment, PaymentStatus } from '../../../domain/payments/entities/payment.entity';
import { Order, OrderStatus } from '../../../domain/orders/entities/order.entity';
import { PaymentDomainService } from '../../../domain/payments/services/payment.domain.service';
import { DecreaseStockUseCase } from '../../stock/use-cases/decrease-stock.usecase';
import { PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';

function pendingPayment(orderId = 'ord-1') {
  return Payment.create(orderId, 200);
}

function pendingOrder(id = 'ord-1', items: any[] = []) {
  return Order.reconstitute({
    id, userId: 'u-1', status: OrderStatus.PENDING,
    totalAmount: 200, items, createdAt: new Date(), updatedAt: new Date(),
  });
}

const mockPaymentRepo   = { findById: jest.fn(), save: jest.fn(), update: jest.fn() };
const mockOrderRepo     = { findById: jest.fn(), save: jest.fn(), update: jest.fn(), findByUserId: jest.fn() };
const mockDecreaseStock = { execute: jest.fn() };

describe('ApprovePaymentUseCase', () => {
  let useCase: ApprovePaymentUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ApprovePaymentUseCase,
        PaymentDomainService,
        { provide: PAYMENT_REPOSITORY,  useValue: mockPaymentRepo },
        { provide: ORDER_REPOSITORY,    useValue: mockOrderRepo },
        { provide: DecreaseStockUseCase, useValue: mockDecreaseStock },
      ],
    }).compile();
    useCase = module.get(ApprovePaymentUseCase);
  });

  it('approves payment, confirms order and decreases stock per item', async () => {
    const payment = pendingPayment('ord-1');
    const items = [
      { id: 'oi-1', orderId: 'ord-1', variantId: 'var-1', quantity: 2, price: 100 },
      { id: 'oi-2', orderId: 'ord-1', variantId: 'var-2', quantity: 1, price: 50 },
    ];
    const order = pendingOrder('ord-1', items);
    mockPaymentRepo.findById.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(undefined);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.update.mockResolvedValue(undefined);
    mockDecreaseStock.execute.mockResolvedValue(undefined);

    await useCase.execute(payment.getId(), 'gw-999');

    expect(payment.getStatus()).toBe(PaymentStatus.APPROVED);
    expect(payment.getGatewayId()).toBe('gw-999');
    expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    expect(mockPaymentRepo.update).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.update).toHaveBeenCalledTimes(1);
    expect(mockDecreaseStock.execute).toHaveBeenCalledTimes(2);
    expect(mockDecreaseStock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'var-1', quantity: 2 }),
    );
    expect(mockDecreaseStock.execute).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'var-2', quantity: 1 }),
    );
  });

  it('throws NotFoundException when payment not found', async () => {
    mockPaymentRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('bad-id', 'gw-1')).rejects.toThrow(NotFoundException);
  });

  it('throws UnprocessableEntityException when payment is not PENDING', async () => {
    const payment = pendingPayment();
    payment.approve('gw-1');  // already APPROVED
    mockPaymentRepo.findById.mockResolvedValue(payment);

    await expect(useCase.execute(payment.getId(), 'gw-2')).rejects.toThrow(UnprocessableEntityException);
    expect(mockPaymentRepo.update).not.toHaveBeenCalled();
  });

  it('still updates payment even if order not found', async () => {
    const payment = pendingPayment();
    mockPaymentRepo.findById.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(undefined);
    mockOrderRepo.findById.mockResolvedValue(null);

    await useCase.execute(payment.getId(), 'gw-1');

    expect(mockPaymentRepo.update).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.update).not.toHaveBeenCalled();
    expect(mockDecreaseStock.execute).not.toHaveBeenCalled();
  });
});
