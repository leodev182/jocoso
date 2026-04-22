export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface IRefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findByTokenHash(hash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');
