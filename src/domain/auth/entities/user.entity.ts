import * as crypto from 'crypto';

export enum Role {
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  CUSTOMER = 'CUSTOMER',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  name: string | null;
  phone: string | null;
  role: Role;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(
    private readonly id: string,
    private readonly email: string,
    private passwordHash: string | null,
    private googleId: string | null,
    private name: string | null,
    private phone: string | null,
    private readonly role: Role,
    private twoFactorSecret: string | null,
    private twoFactorEnabled: boolean,
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(email: string, passwordHash: string): User {
    const now = new Date();
    return new User(crypto.randomUUID(), email.toLowerCase(), passwordHash, null, null, null, Role.CUSTOMER, null, false, true, now, now);
  }

  static createWithGoogle(email: string, googleId: string, name: string | null): User {
    const now = new Date();
    return new User(crypto.randomUUID(), email.toLowerCase(), null, googleId, name, null, Role.CUSTOMER, null, false, true, now, now);
  }

  static createManual(email: string, name: string, phone: string | null = null): User {
    const now = new Date();
    return new User(crypto.randomUUID(), email.toLowerCase(), null, null, name, phone, Role.CUSTOMER, null, false, true, now, now);
  }

  static reconstitute(props: UserProps): User {
    return new User(props.id, props.email, props.passwordHash, props.googleId, props.name, props.phone, props.role, props.twoFactorSecret, props.twoFactorEnabled, props.isActive, props.createdAt, props.updatedAt);
  }

  getId(): string { return this.id; }
  getEmail(): string { return this.email; }
  getPasswordHash(): string | null { return this.passwordHash; }
  getGoogleId(): string | null { return this.googleId; }
  getName(): string | null { return this.name; }
  getPhone(): string | null { return this.phone; }
  getRole(): Role { return this.role; }
  getTwoFactorSecret(): string | null { return this.twoFactorSecret; }
  isTwoFactorEnabled(): boolean { return this.twoFactorEnabled; }
  getIsActive(): boolean { return this.isActive; }

  updateProfile(name: string | null, phone: string | null): void {
    this.name = name;
    this.phone = phone;
    this.touch();
  }

  setGoogleId(googleId: string): void { this.googleId = googleId; this.touch(); }

  setTwoFactorSecret(secret: string): void { this.twoFactorSecret = secret; }

  enableTwoFactor(): void {
    if (!this.twoFactorSecret) throw new Error('2FA secret must be set before enabling');
    this.twoFactorEnabled = true;
  }

  deactivate(): void { this.isActive = false; this.touch(); }
  activate(): void { this.isActive = true; this.touch(); }

  private touch(): void { this.updatedAt = new Date(); }

  toPersistence(): UserProps {
    return {
      id: this.id, email: this.email, passwordHash: this.passwordHash,
      googleId: this.googleId, name: this.name, phone: this.phone,
      role: this.role, twoFactorSecret: this.twoFactorSecret,
      twoFactorEnabled: this.twoFactorEnabled, isActive: this.isActive,
      createdAt: this.createdAt, updatedAt: this.updatedAt,
    };
  }
}
