import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApprovePaymentUseCase } from './approve-payment.usecase';
import { Payment, PaymentStatus } from '../../../domain/payments/entities/payment.entity';
import { Order, OrderStatus } from '../../../domain/orders/entities/order.entity';
import { PaymentDomainService } from '../../../domain/payments/services/payment.domain.service';
import { PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';
import { ORDER_REPOSITORY } from '../../../domain/orders/repositories/order.repository';

function pendingPayment() {
  return Payment.create('ord-1', 200);
}

function pendingOrder(id = 'ord-1') {
  return Order.reconstitute({
    id, userId: 'u-1', status: OrderStatus.PENDING,
    totalAmount: 200, items: [], createdAt: new Date(), updatedAt: new Date(),
  });
}

const mockPaymentRepo = { findById: jest.fn(), save: jest.fn(), update: jest.fn() };
const mockOrderRepo   = { findById: jest.fn(), save: jest.fn(), update: jest.fn(), findByUserId: jest.fn() };

describe('ApprovePaymentUseCase', () => {
  let useCase: ApprovePaymentUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ApprovePaymentUseCase,
        PaymentDomainService,
        { provide: PAYMENT_REPOSITORY, useValue: mockPaymentRepo },
        { provide: ORDER_REPOSITORY,   useValue: mockOrderRepo },
      ],
    }).compile();
    useCase = module.get(ApprovePaymentUseCase);
  });

  it('approves payment and confirms order', async () => {
    const payment = pendingPayment();
    const order   = pendingOrder(payment.getOrderId());
    mockPaymentRepo.findById.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(undefined);
    mockOrderRepo.findById.mockResolvedValue(order);
    mockOrderRepo.update.mockResolvedValue(undefined);

    await useCase.execute(payment.getId(), 'gw-999');

    expect(payment.getStatus()).toBe(PaymentStatus.APPROVED);
    expect(payment.getGatewayId()).toBe('gw-999');
    expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    expect(mockPaymentRepo.update).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.update).toHaveBeenCalledTimes(1);
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
  });
});
