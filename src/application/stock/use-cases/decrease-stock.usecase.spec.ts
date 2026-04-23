import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DecreaseStockUseCase } from './decrease-stock.usecase';
import { Stock } from '../../../domain/stock/entities/stock.entity';
import { StockDomainService } from '../../../domain/stock/services/stock.domain.service';
import { STOCK_REPOSITORY } from '../../../domain/stock/repositories/stock.repository';
import { STOCK_MOVEMENT_REPOSITORY } from '../../../domain/stock/repositories/stock-movement.repository';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';

const mockStockRepo    = { findByVariantId: jest.fn(), decreaseWithLock: jest.fn(), increase: jest.fn() };
const mockMovementRepo = { findByExternalId: jest.fn(), findByVariantId: jest.fn() };

const baseCmd = {
  variantId: 'v-1',
  quantity: 2,
  source: StockSource.WEB,
  referenceType: ReferenceType.ORDER,
  referenceId: 'ord-1',
};

describe('DecreaseStockUseCase', () => {
  let useCase: DecreaseStockUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DecreaseStockUseCase,
        StockDomainService,
        { provide: STOCK_REPOSITORY,          useValue: mockStockRepo },
        { provide: STOCK_MOVEMENT_REPOSITORY, useValue: mockMovementRepo },
      ],
    }).compile();
    useCase = module.get(DecreaseStockUseCase);
  });

  it('decreases stock and creates movement', async () => {
    mockStockRepo.findByVariantId.mockResolvedValue(Stock.reconstitute('v-1', 10));
    mockStockRepo.decreaseWithLock.mockResolvedValue(undefined);

    await useCase.execute(baseCmd);

    expect(mockStockRepo.decreaseWithLock).toHaveBeenCalledTimes(1);
    const [variantId, qty] = mockStockRepo.decreaseWithLock.mock.calls[0];
    expect(variantId).toBe('v-1');
    expect(qty).toBe(2);
  });

  it('throws NotFoundException when variant not found', async () => {
    mockStockRepo.findByVariantId.mockResolvedValue(null);
    await expect(useCase.execute(baseCmd)).rejects.toThrow(NotFoundException);
    expect(mockStockRepo.decreaseWithLock).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityException when stock is insufficient', async () => {
    mockStockRepo.findByVariantId.mockResolvedValue(Stock.reconstitute('v-1', 1));
    await expect(useCase.execute({ ...baseCmd, quantity: 5 })).rejects.toThrow(UnprocessableEntityException);
    expect(mockStockRepo.decreaseWithLock).not.toHaveBeenCalled();
  });

  it('is idempotent — skips if externalId already processed', async () => {
    mockMovementRepo.findByExternalId.mockResolvedValue({ id: 'existing-movement' });

    await useCase.execute({ ...baseCmd, externalId: 'ml-order-123' });

    expect(mockStockRepo.findByVariantId).not.toHaveBeenCalled();
    expect(mockStockRepo.decreaseWithLock).not.toHaveBeenCalled();
  });

  it('processes normally when externalId is new', async () => {
    mockMovementRepo.findByExternalId.mockResolvedValue(null);
    mockStockRepo.findByVariantId.mockResolvedValue(Stock.reconstitute('v-1', 10));
    mockStockRepo.decreaseWithLock.mockResolvedValue(undefined);

    await useCase.execute({ ...baseCmd, externalId: 'new-event-id' });

    expect(mockStockRepo.decreaseWithLock).toHaveBeenCalledTimes(1);
  });
});
