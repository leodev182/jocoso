export interface ITokenService {
  generateAccessToken(userId: string, email: string, role: string): string;
  generateRefreshToken(): string;
  hashToken(raw: string): string;
}

export const TOKEN_SERVICE = Symbol('ITokenService');
