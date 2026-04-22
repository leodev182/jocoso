import { User } from '../entities/user.entity';

export class AuthDomainService {
  canLogin(user: User): boolean {
    // extensible: add email verification check, ban check, etc.
    return true;
  }

  requiresTwoFactor(user: User): boolean {
    return user.isTwoFactorEnabled();
  }
}
