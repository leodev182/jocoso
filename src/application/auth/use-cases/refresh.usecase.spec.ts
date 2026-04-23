import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RefreshUseCase } from './refresh.usecase';
import { User, Role } from '../../../domain/auth/entities/user.entity';
import { USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { TOKEN_SERVICE } from '../ports/token.service';

function fakeUser() {
  return User.reconstitute({
    id: 'u-1', email: 'u@t.com', passwordHash: 'h',
    role: Role.CUSTOMER, twoFactorSecret: null,
    twoFactorEnabled: false, createdAt: new Date(),
  });
}

function fakeRecord(overrides: Partial<{ revokedAt: Date | null; expiresAt: Date }> = {}) {
  return {
    id: 'rt-1',
    userId: 'u-1',
    tokenHash: 'hashed-token',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60),
    revokedAt: overrides.revokedAt ?? null,
  };
}

const mockUserRepo  = { findByEmail: jest.fn(), save: jest.fn(), findById: jest.fn() };
const mockTokenRepo = { create: jest.fn(), findByTokenHash: jest.fn(), revoke: jest.fn() };
const mockTokenSvc  = {
  generateAccessToken: jest.fn().mockReturnValue('new-at'),
  generateRefreshToken: jest.fn().mockReturnValue('new-rt'),
  hashToken: jest.fn().mockReturnValue('hashed-token'),
};

describe('RefreshUseCase', () => {
  let useCase: RefreshUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RefreshUseCase,
        { provide: USER_REPOSITORY,          useValue: mockUserRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockTokenRepo },
        { provide: TOKEN_SERVICE,            useValue: mockTokenSvc },
      ],
    }).compile();
    useCase = module.get(RefreshUseCase);
  });

  it('rotates token and returns new pair', async () => {
    mockTokenRepo.findByTokenHash.mockResolvedValue(fakeRecord());
    mockTokenRepo.revoke.mockResolvedValue(undefined);
    mockUserRepo.findById.mockResolvedValue(fakeUser());
    mockTokenRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute('raw-token');

    expect(mockTokenRepo.revoke).toHaveBeenCalledWith('rt-1');
    expect(mockTokenRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' });
  });

  it('throws when token not found', async () => {
    mockTokenRepo.findByTokenHash.mockResolvedValue(null);
    await expect(useCase.execute('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('throws when token is revoked (theft detection)', async () => {
    mockTokenRepo.findByTokenHash.mockResolvedValue(fakeRecord({ revokedAt: new Date() }));
    await expect(useCase.execute('stolen-token')).rejects.toThrow(UnauthorizedException);
    expect(mockTokenRepo.revoke).not.toHaveBeenCalled();
  });

  it('throws when token is expired', async () => {
    mockTokenRepo.findByTokenHash.mockResolvedValue(
      fakeRecord({ expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
  });
});
