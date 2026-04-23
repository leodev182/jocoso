import { GetTrendingProductsUseCase } from './get-trending-products.usecase';

const mockProduct = (id: string) => ({
  getId: () => id,
  toPersistence: () => ({ id, title: `Product ${id}` }),
});

const mockViewRepo = { topProductIds: jest.fn() };
const mockProductRepo = { findById: jest.fn() };

const makeUseCase = () =>
  new GetTrendingProductsUseCase(mockViewRepo as any, mockProductRepo as any);

describe('GetTrendingProductsUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns products enriched with view count', async () => {
    mockViewRepo.topProductIds.mockResolvedValue([
      { productId: 'p1', views: 42 },
      { productId: 'p2', views: 18 },
    ]);
    mockProductRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(mockProduct(id)),
    );

    const uc = makeUseCase();
    const result = await uc.execute('7d', 10);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'p1', views: 42 });
    expect(result[1]).toMatchObject({ id: 'p2', views: 18 });
  });

  it('filters out products that no longer exist', async () => {
    mockViewRepo.topProductIds.mockResolvedValue([
      { productId: 'p1', views: 5 },
      { productId: 'deleted', views: 3 },
    ]);
    mockProductRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(id === 'deleted' ? null : mockProduct(id)),
    );

    const uc = makeUseCase();
    const result = await uc.execute();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'p1' });
  });

  it('falls back to 7d for unknown period', async () => {
    mockViewRepo.topProductIds.mockResolvedValue([]);
    const uc = makeUseCase();

    await uc.execute('invalid', 5);

    const since: Date = mockViewRepo.topProductIds.mock.calls[0][0];
    const diffDays = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it('respects the limit parameter', async () => {
    mockViewRepo.topProductIds.mockResolvedValue([]);
    const uc = makeUseCase();

    await uc.execute('30d', 5);

    expect(mockViewRepo.topProductIds).toHaveBeenCalledWith(expect.any(Date), 5);
  });

  it('passes correct since date for 30d period', async () => {
    mockViewRepo.topProductIds.mockResolvedValue([]);
    const uc = makeUseCase();

    await uc.execute('30d', 10);

    const since: Date = mockViewRepo.topProductIds.mock.calls[0][0];
    const diffDays = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });
});
