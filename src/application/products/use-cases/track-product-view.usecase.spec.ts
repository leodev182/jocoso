import { TrackProductViewUseCase } from './track-product-view.usecase';

const mockViewRepo = { record: jest.fn() };

const makeUseCase = () =>
  new TrackProductViewUseCase(mockViewRepo as any);

describe('TrackProductViewUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls record with productId and userId', () => {
    mockViewRepo.record.mockResolvedValue(undefined);
    const uc = makeUseCase();

    uc.track('prod-1', 'user-1');

    expect(mockViewRepo.record).toHaveBeenCalledWith('prod-1', 'user-1');
  });

  it('calls record without userId for anonymous views', () => {
    mockViewRepo.record.mockResolvedValue(undefined);
    const uc = makeUseCase();

    uc.track('prod-1');

    expect(mockViewRepo.record).toHaveBeenCalledWith('prod-1', undefined);
  });

  it('never throws even when repo fails', async () => {
    mockViewRepo.record.mockRejectedValue(new Error('DB down'));
    const uc = makeUseCase();

    expect(() => uc.track('prod-1', 'user-1')).not.toThrow();

    // let the rejected promise settle
    await new Promise((r) => setTimeout(r, 0));
  });
});
