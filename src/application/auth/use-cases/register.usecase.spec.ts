import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.usecase';
import { USER_REPOSITORY } from '../../../domain/auth/repositories/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../../domain/auth/repositories/refresh-token.repository';
import { TOKEN_SERVICE } from '../ports/token.service';
import { Test } from '@nestjs/testing';
import { BcryptService } from '../../../infrastructure/security/bcrypt.service';

const mockUserRepo = {
  findByEmail: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
};

const mockTokenRepo = {
  create: jest.fn(),
  findByTokenHash: jest.fn(),
  revoke: jest.fn(),
};

const mockTokenService = {
  generateAccessToken: jest.fn().mockReturnValue('access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('raw-refresh'),
  hashToken: jest.fn().mockReturnValue('hashed-refresh'),
};

const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
};

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockTokenRepo },
        { provide: TOKEN_SERVICE, useValue: mockTokenService },
        { provide: BcryptService, useValue: mockBcrypt },
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
  });

  it('registers a new user and returns token pair', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.save.mockResolvedValue(undefined);
    mockTokenRepo.create.mockResolvedValue(undefined);

    const result = await useCase.execute('Test@Example.com', 'pass123');

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockBcrypt.hash).toHaveBeenCalledWith('pass123');
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
    expect(mockTokenRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'raw-refresh' });
  });

  it('throws ConflictException when email already exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ getId: () => 'u-1' });

    await expect(useCase.execute('existing@example.com', 'pass')).rejects.toThrow(ConflictException);
    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});
