import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SettlePaymentUseCase } from './settle-payment.usecase';
import { Payment, PaymentStatus } from '../../../domain/payments/entities/payment.entity';
import { PaymentDomainService } from '../../../domain/payments/services/payment.domain.service';
import { PAYMENT_REPOSITORY } from '../../../domain/payments/repositories/payment.repository';

function approvedPayment(orderId = 'ord-1') {
  const p = Payment.create(orderId, 200);
  p.approve('gw-1');
  return p;
}

const mockPaymentRepo = { findById: jest.fn(), save: jest.fn(), update: jest.fn() };

describe('SettlePaymentUseCase', () => {
  let useCase: SettlePaymentUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SettlePaymentUseCase,
        PaymentDomainService,
        { provide: PAYMENT_REPOSITORY, useValue: mockPaymentRepo },
      ],
    }).compile();
    useCase = module.get(SettlePaymentUseCase);
  });

  it('transitions APPROVED → SETTLED and persists', async () => {
    const payment = approvedPayment();
    mockPaymentRepo.findById.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(undefined);

    await useCase.execute(payment.getId(), 'mp-settlement');

    expect(payment.getStatus()).toBe(PaymentStatus.SETTLED);
    expect(mockPaymentRepo.update).toHaveBeenCalledTimes(1);
    expect(mockPaymentRepo.update).toHaveBeenCalledWith(
      payment,
      expect.objectContaining({ triggeredBy: 'mp-settlement' }),
    );
  });

  it('uses "system" as default triggeredBy', async () => {
    const payment = approvedPayment();
    mockPaymentRepo.findById.mockResolvedValue(payment);
    mockPaymentRepo.update.mockResolvedValue(undefined);

    await useCase.execute(payment.getId());

    expect(mockPaymentRepo.update).toHaveBeenCalledWith(
      payment,
      expect.objectContaining({ triggeredBy: 'system' }),
    );
  });

  it('throws NotFoundException when payment not found', async () => {
    mockPaymentRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing-id')).rejects.toThrow(NotFoundException);
    expect(mockPaymentRepo.update).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityException when payment is PENDING (not APPROVED)', async () => {
    const payment = Payment.create('ord-1', 200); // PENDING
    mockPaymentRepo.findById.mockResolvedValue(payment);

    await expect(useCase.execute(payment.getId())).rejects.toThrow(UnprocessableEntityException);
    expect(mockPaymentRepo.update).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityException when payment is already SETTLED (idempotency guard)', async () => {
    const payment = approvedPayment();
    payment.settle(); // already SETTLED
    mockPaymentRepo.findById.mockResolvedValue(payment);

    await expect(useCase.execute(payment.getId())).rejects.toThrow(UnprocessableEntityException);
    expect(mockPaymentRepo.update).not.toHaveBeenCalled();
  });
});
