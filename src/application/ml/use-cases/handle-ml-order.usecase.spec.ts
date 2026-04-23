import { HandleMlOrderUseCase } from './handle-ml-order.usecase';
import { StockSource, ReferenceType } from '../../../domain/stock/entities/stock-movement.entity';

const mlOrder = (status: string, items: any[]) => ({
  status,
  buyer: { id: 999 },
  order_items: items,
});

const mlItem = (variationId: string | null, quantity: number, price: number) => ({
  item: { id: 'ML-ITEM-1', variation_id: variationId },
  quantity,
  unit_price: price,
});

const mockMlClient = { getOrder: jest.fn() };
const mockVariantRepo = { findByMlVariationId: jest.fn() };
const mockOrderRepo = { save: jest.fn() };
const mockDecreaseStock = { execute: jest.fn() };

const makeUseCase = () =>
  new HandleMlOrderUseCase(
    mockMlClient as any,
    mockVariantRepo as any,
    mockOrderRepo as any,
    mockDecreaseStock as any,
  );

describe('HandleMlOrderUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('processes a paid ML order and creates internal order + stock movements', async () => {
    mockMlClient.getOrder.mockResolvedValue(
      mlOrder('paid', [mlItem('VAR-1', 2, 100)]),
    );
    mockVariantRepo.findByMlVariationId.mockResolvedValue({
      getId: () => 'variant-uuid-1',
    });
    mockOrderRepo.save.mockResolvedValue(undefined);
    mockDecreaseStock.execute.mockResolvedValue(undefined);

    await makeUseCase().execute('ml-order-123');

    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
    expect(mockDecreaseStock.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: 'variant-uuid-1',
        quantity: 2,
        source: StockSource.ML,
        referenceType: ReferenceType.ML_SALE,
        externalId: 'ml-order-ml-order-123-variant-uuid-1',
      }),
    );
  });

  it('skips order when ML status is not paid', async () => {
    mockMlClient.getOrder.mockResolvedValue(
      mlOrder('pending', [mlItem('VAR-1', 1, 50)]),
    );

    await makeUseCase().execute('ml-order-456');

    expect(mockOrderRepo.save).not.toHaveBeenCalled();
    expect(mockDecreaseStock.execute).not.toHaveBeenCalled();
  });

  it('skips unmapped variants and aborts if no items remain', async () => {
    mockMlClient.getOrder.mockResolvedValue(
      mlOrder('paid', [mlItem('UNKNOWN-VAR', 1, 50)]),
    );
    mockVariantRepo.findByMlVariationId.mockResolvedValue(null);

    await makeUseCase().execute('ml-order-789');

    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('uses item.id as fallback when variation_id is null', async () => {
    mockMlClient.getOrder.mockResolvedValue(
      mlOrder('paid', [mlItem(null, 1, 75)]),
    );
    mockVariantRepo.findByMlVariationId.mockResolvedValue({
      getId: () => 'variant-uuid-2',
    });
    mockOrderRepo.save.mockResolvedValue(undefined);
    mockDecreaseStock.execute.mockResolvedValue(undefined);

    await makeUseCase().execute('ml-order-999');

    expect(mockVariantRepo.findByMlVariationId).toHaveBeenCalledWith('ML-ITEM-1');
    expect(mockOrderRepo.save).toHaveBeenCalledTimes(1);
  });

  it('decreases stock per item with unique externalId for idempotency', async () => {
    mockMlClient.getOrder.mockResolvedValue(
      mlOrder('paid', [
        mlItem('VAR-A', 1, 50),
        mlItem('VAR-B', 3, 20),
      ]),
    );
    mockVariantRepo.findByMlVariationId
      .mockResolvedValueOnce({ getId: () => 'uuid-a' })
      .mockResolvedValueOnce({ getId: () => 'uuid-b' });
    mockOrderRepo.save.mockResolvedValue(undefined);
    mockDecreaseStock.execute.mockResolvedValue(undefined);

    await makeUseCase().execute('ml-order-multi');

    expect(mockDecreaseStock.execute).toHaveBeenCalledTimes(2);
    const calls = mockDecreaseStock.execute.mock.calls;
    expect(calls[0][0].externalId).not.toEqual(calls[1][0].externalId);
  });
});
