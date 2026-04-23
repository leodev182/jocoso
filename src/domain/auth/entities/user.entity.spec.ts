import { User, Role } from './user.entity';

function makeUser(): User {
  return User.create('Test@Example.com', 'hash-abc');
}

describe('User entity', () => {
  describe('create()', () => {
    it('normalizes email to lowercase', () => {
      const u = makeUser();
      expect(u.getEmail()).toBe('test@example.com');
    });

    it('assigns CUSTOMER role by default', () => {
      expect(makeUser().getRole()).toBe(Role.CUSTOMER);
    });

    it('starts with 2FA disabled and no secret', () => {
      const u = makeUser();
      expect(u.isTwoFactorEnabled()).toBe(false);
      expect(u.getTwoFactorSecret()).toBeNull();
    });

    it('assigns a UUID id', () => {
      const u = makeUser();
      expect(u.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('stores the password hash as-is', () => {
      expect(makeUser().getPasswordHash()).toBe('hash-abc');
    });
  });

  describe('2FA flow', () => {
    it('setTwoFactorSecret() stores the secret', () => {
      const u = makeUser();
      u.setTwoFactorSecret('TOTP_SECRET');
      expect(u.getTwoFactorSecret()).toBe('TOTP_SECRET');
    });

    it('enableTwoFactor() requires secret to be set first', () => {
      const u = makeUser();
      expect(() => u.enableTwoFactor()).toThrow('2FA secret must be set before enabling');
    });

    it('enableTwoFactor() succeeds after setting secret', () => {
      const u = makeUser();
      u.setTwoFactorSecret('TOTP_SECRET');
      u.enableTwoFactor();
      expect(u.isTwoFactorEnabled()).toBe(true);
    });
  });

  describe('reconstitute()', () => {
    it('restores all props', () => {
      const now = new Date();
      const u = User.reconstitute({
        id: 'u-1', email: 'a@b.com', passwordHash: 'h',
        role: Role.ADMIN, twoFactorSecret: 'S', twoFactorEnabled: true,
        createdAt: now,
      });
      expect(u.getId()).toBe('u-1');
      expect(u.getRole()).toBe(Role.ADMIN);
      expect(u.isTwoFactorEnabled()).toBe(true);
    });
  });

  describe('toPersistence()', () => {
    it('serializes all fields', () => {
      const u = makeUser();
      const d = u.toPersistence();
      expect(d.email).toBe('test@example.com');
      expect(d.role).toBe(Role.CUSTOMER);
      expect(d.twoFactorEnabled).toBe(false);
    });
  });
});
