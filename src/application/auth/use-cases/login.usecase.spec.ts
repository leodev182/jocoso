import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LoginUseCase } from './login.usecase';
import { User, Role } from '../../../domain/auth/entities/user.entity';
import { AuthDomainService } from '../../../domain/auth/services/auth.domain.service';
import { USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { TOKEN_SERVICE } from '../ports/token.service';
import { BcryptService } from '../../../infrastructure/security/bcrypt.service';

function fakeUser(overrides: Partial<{ twoFactorEnabled: boolean }> = {}) {
  return User.reconstitute({
    id: 'u-1', email: 'user@test.com', passwordHash: 'hashed',
    role: Role.CUSTOMER, twoFactorSecret: null,
    twoFactorEnabled: overrides.twoFactorEnabled ?? false,
    createdAt: new Date(),
  });
}

const mockUserRepo   = { findByEmail: jest.fn(), save: jest.fn(), findById: jest.fn() };
const mockTokenRepo  = { create: jest.fn(), findByTokenHash: jest.fn(), revoke: jest.fn() };
const mockTokenSvc   = {
  generateAccessToken: jest.fn().mockReturnValue('at'),
  generateRefreshToken: jest.fn().mockReturnValue('rt'),
  hashToken: jest.fn().mockReturnValue('rt-hash'),
};
const mockBcrypt     = { hash: jest.fn(), compare: jest.fn() };
const mockAuthDomain = new AuthDomainService();

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY,          useValue: mockUserRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockTokenRepo },
        { provide: TOKEN_SERVICE,            useValue: mockTokenSvc },
        { provide: BcryptService,            useValue: mockBcrypt },
        { provide: AuthDomainService,        useValue: mockAuthDomain },
      ],
    }).compile();
    useCase = module.get(LoginUseCase);
  });

  it('returns tokens for valid credentials', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(fakeUser());
    mockBcrypt.compare.mockResolvedValue(true);
    mockTokenRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute('user@test.com', 'correct-pass');
    expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('throws UnauthorizedException when user not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute('x@x.com', 'pass')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException on wrong password', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(fakeUser());
    mockBcrypt.compare.mockResolvedValue(false);
    await expect(useCase.execute('user@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    expect(mockTokenRepo.create).not.toHaveBeenCalled();
  });

  it('normalizes email to lowercase before lookup', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute('USER@TEST.COM', 'pass')).rejects.toThrow(UnauthorizedException);
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('user@test.com');
  });
});
